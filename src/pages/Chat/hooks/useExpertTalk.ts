import dayjs from 'dayjs';
import { useCallback, useEffect, useRef } from 'react';
import { v1 } from 'uuid';
import deepseek from '../../../libs/deepseek';
import network from '../../../libs/network';
import {
  AudioQueuePlayer,
  streamVoiceTurn,
  transcribeAudioBlob,
} from '../../../libs/voiceStream';
import type { Expert } from '../../../types/expert';
import type { TranscriptEntry } from '../../../types/audio';
import useExpertChatStore from './useExpertChatStore';
import useExpertTalkStore, { CallStatusEnum } from './useExpertTalkStore';

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type RecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const waitForBrowserVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  const available = window.speechSynthesis.getVoices();
  if (available.length > 0) return available;

  return new Promise((resolve) => {
    const finish = (): void => {
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, 500);
  });
};

const choosePersonaVoice = (
  voices: SpeechSynthesisVoice[],
  expert: Expert,
): SpeechSynthesisVoice | undefined => {
  const preferredName = expert.voiceName?.toLowerCase();
  const languageCode = (expert.languageCode ?? 'id-ID').toLowerCase();
  const language = languageCode.split('-')[0];
  const fallbackCode = (expert.fallbackLanguageCode ?? 'id-ID').toLowerCase();

  return (
    (preferredName
      ? voices.find((voice) => voice.name.toLowerCase().includes(preferredName))
      : undefined) ??
    voices.find((voice) => voice.lang.toLowerCase() === languageCode) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${language}-`)) ??
    voices.find((voice) => voice.lang.toLowerCase() === fallbackCode) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('id'))
  );
};

let activeUtterance: SpeechSynthesisUtterance | null = null;

const sanitizeForSpeechSynthesis = (text: string): string => {
  return text
    .replace(/\[cit-[^\]]+\]/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#~>]/g, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]/gu,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
};

const speakWithSpeechSynthesis = (
  text: string,
  expert: Expert,
  onStartSpeaking?: () => void,
): Promise<void> =>
  new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      onStartSpeaking?.();
      resolve();
      return;
    }

    const cleanText = sanitizeForSpeechSynthesis(text);
    if (!cleanText) {
      onStartSpeaking?.();
      resolve();
      return;
    }

    void waitForBrowserVoices().then((voices) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      activeUtterance = utterance;

      const matchingVoice = choosePersonaVoice(voices, expert);
      utterance.voice = matchingVoice ?? null;
      utterance.lang = matchingVoice?.lang ?? expert.languageCode ?? 'id-ID';
      utterance.rate = expert.speakingRate ?? 1;
      utterance.pitch = Math.min(2, Math.max(0, 1 + (expert.pitch ?? 0)));

      let hasTriggeredStart = false;
      const triggerStart = (): void => {
        if (!hasTriggeredStart) {
          hasTriggeredStart = true;
          onStartSpeaking?.();
        }
      };

      utterance.onstart = (): void => {
        triggerStart();
      };
      utterance.onend = (): void => {
        activeUtterance = null;
        resolve();
      };
      utterance.onerror = (): void => {
        activeUtterance = null;
        triggerStart();
        resolve();
      };

      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        window.setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
            window.setTimeout(triggerStart, 150);
          } catch {
            triggerStart();
            resolve();
          }
        }, 30);
      } catch {
        triggerStart();
        resolve();
      }
    });
  });

const useExpertTalk = (
  expert: Expert | null,
): {
  startCall: () => Promise<void | null>;
  endCall: () => Promise<void>;
  mediaStreamRef: React.MutableRefObject<MediaStream | null>;
} => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueuePlayerRef = useRef<AudioQueuePlayer | null>(null);
  const turnAbortControllerRef = useRef<AbortController | null>(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const callAttemptRef = useRef(0);
  const pendingTranscriptRef = useRef('');
  const transcriptTimerRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef<{ text: string; timestamp: number } | null>(null);

  const clearPendingTranscript = useCallback((): void => {
    if (transcriptTimerRef.current !== null) {
      window.clearTimeout(transcriptTimerRef.current);
      transcriptTimerRef.current = null;
    }
    pendingTranscriptRef.current = '';
  }, []);

  const appendTranscript = useCallback((entry: TranscriptEntry): void => {
    const store = useExpertTalkStore.getState();
    store.setLiveTranscript([...store.liveTranscript, entry]);
  }, []);

  const releaseMicrophone = useCallback((): void => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopAudioPlayback = useCallback((): void => {
    if (audioQueuePlayerRef.current) {
      audioQueuePlayerRef.current.stop();
      audioQueuePlayerRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.removeAttribute('src');
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      activeUtterance = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  /**
   * Barge-in: menghentikan pembicaraan AI seketika saat pengguna mulai berbicara.
   */
  const handleBargeIn = useCallback((): void => {
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    stopAudioPlayback();

    const store = useExpertTalkStore.getState();
    store.setIsAiSpeaking(false);
    store.setIsInterrupted(true);
    store.setTurnState('interrupted');
    processingRef.current = false;
  }, [stopAudioPlayback]);

  const resumeListening = useCallback((): void => {
    if (!activeRef.current || !recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.start();
      useExpertTalkStore.getState().setIsListening(true);
    } catch {
      // Recognition may already be active.
    }
  }, []);

  const speak = useCallback(
    async (
      text: string,
      preloadedAudio?: { audio: string; mimeType: string } | null,
      onStartSpeaking?: () => void,
    ): Promise<void> => {
      if (!expert || !text.trim() || !activeRef.current) return;

      let audioBase64 = preloadedAudio?.audio;
      let mimeType = preloadedAudio?.mimeType || 'audio/wav';

      if (!audioBase64) {
        try {
          const response = await network.post<{
            audio: string;
            mimeType: string;
          }>('/chat/tts', {
            text,
            personaId: expert.id,
          });

          if (response.data?.audio && activeRef.current) {
            audioBase64 = response.data.audio;
            mimeType = response.data.mimeType || 'audio/wav';
          }
        } catch (err) {
          console.warn(
            'TTS backend request failed, falling back to SpeechSynthesis:',
            err,
          );
        }
      }

      if (audioBase64 && activeRef.current) {
        return await new Promise<void>((resolve) => {
          stopAudioPlayback();

          const audio = new Audio(
            `data:${mimeType};base64,${audioBase64}`,
          );
          currentAudioRef.current = audio;

          let hasTriggeredStart = false;
          const triggerStart = (): void => {
            if (!hasTriggeredStart) {
              hasTriggeredStart = true;
              onStartSpeaking?.();
            }
          };

          audio.onplay = (): void => {
            triggerStart();
          };

          audio.onended = (): void => {
            currentAudioRef.current = null;
            resolve();
          };

          audio.onerror = (e): void => {
            console.warn(
              'Audio playback error, falling back to speech synthesis:',
              e,
            );
            currentAudioRef.current = null;
            void speakWithSpeechSynthesis(text, expert, onStartSpeaking).then(resolve);
          };

          audio.play().then(() => {
            triggerStart();
          }).catch((playErr) => {
            console.warn('Audio play() rejected:', playErr);
            currentAudioRef.current = null;
            void speakWithSpeechSynthesis(text, expert, onStartSpeaking).then(resolve);
          });
        });
      }

      if (activeRef.current) {
        return await speakWithSpeechSynthesis(text, expert, onStartSpeaking);
      }
    },
    [expert, stopAudioPlayback],
  );

  const processTranscript = useCallback(async (text: string): Promise<void> => {
    const normalized = text.trim();
    if (!normalized || !expert) return;

    // Hentikan turn sebelumnya jika sedang berjalan
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
    }
    stopAudioPlayback();

    processingRef.current = true;
    const talkStore = useExpertTalkStore.getState();
    talkStore.setIsInterrupted(false);
    talkStore.setTurnState('thinking');
    talkStore.setErrorMessage(null);

    const userEntryId = v1();
    appendTranscript({
      id: userEntryId,
      timestamp: dayjs().format(),
      speaker: 'user',
      text: normalized,
    });

    const chatStore = useExpertChatStore.getState();
    const turnAbortController = new AbortController();
    turnAbortControllerRef.current = turnAbortController;

    const aiEntryId = v1();
    let aiMessageAppended = false;
    let fullAccumulatedText = '';

    const player = new AudioQueuePlayer({
      onStartSpeaking: () => {
        if (turnAbortController.signal.aborted) return;
        const currentStore = useExpertTalkStore.getState();
        currentStore.setTurnState('speaking');
      },
      onSentenceStart: (chunk) => {
        if (turnAbortController.signal.aborted) return;
        fullAccumulatedText = fullAccumulatedText
          ? `${fullAccumulatedText} ${chunk.text}`
          : chunk.text;

        const store = useExpertTalkStore.getState();
        if (!aiMessageAppended) {
          aiMessageAppended = true;
          appendTranscript({
            id: aiEntryId,
            timestamp: dayjs().format(),
            speaker: 'ai',
            text: fullAccumulatedText,
          });
        } else {
          const updatedList = store.liveTranscript.map((entry) =>
            entry.id === aiEntryId ? { ...entry, text: fullAccumulatedText } : entry,
          );
          store.setLiveTranscript(updatedList);
        }
      },
      onFinish: () => {
        if (turnAbortController.signal.aborted) return;
        const currentStore = useExpertTalkStore.getState();
        currentStore.setTurnState('listening');
        processingRef.current = false;
        resumeListening();
      },
      onError: (err) => {
        console.warn('[AudioQueuePlayer] Error:', err);
      },
    });

    audioQueuePlayerRef.current = player;

    try {
      let streamSucceeded = false;

      await streamVoiceTurn(
        {
          userMessage: normalized,
          personaId: expert.id,
          conversationId: chatStore.conversationId,
        },
        {
          onMeta: (meta) => {
            if (meta.conversationId) {
              chatStore.setConversationId(meta.conversationId);
              sessionStorage.setItem(
                `katanusa:conversation:${expert.id}`,
                meta.conversationId,
              );
            }
            if (meta.corrected && meta.userText) {
              const store = useExpertTalkStore.getState();
              const updated = store.liveTranscript.map((item) =>
                item.id === userEntryId ? { ...item, text: meta.userText } : item,
              );
              store.setLiveTranscript(updated);
            }
          },
          onAudioChunk: (chunk) => {
            streamSucceeded = true;
            player.addChunk(chunk);
          },
          onDone: () => {
            streamSucceeded = true;
            player.markStreamDone();
          },
          onError: (streamErr) => {
            console.warn('[VoiceStream] Stream error:', streamErr);
            if (!streamSucceeded) {
              throw new Error(streamErr.message || 'Stream error');
            }
          },
        },
        { signal: turnAbortController.signal },
      );
    } catch (error) {
      if (turnAbortController.signal.aborted) {
        return;
      }

      console.warn('[useExpertTalk] Fallback ke non-streaming API chat:', error);
      try {
        const response = await deepseek.getAiResponse({
          expert,
          userMessage: normalized,
          chatHistory: chatStore.messages,
          conversationId: chatStore.conversationId,
          channel: 'voice',
        });

        if (turnAbortController.signal.aborted) return;

        chatStore.setConversationId(response.conversationId);
        sessionStorage.setItem(
          `katanusa:conversation:${expert.id}`,
          response.conversationId,
        );

        const onVoiceStart = (): void => {
          if (aiMessageAppended) return;
          aiMessageAppended = true;
          appendTranscript({
            id: aiEntryId,
            timestamp: dayjs().format(),
            speaker: 'ai',
            text: response.text,
          });
          const store = useExpertTalkStore.getState();
          store.setTurnState('speaking');
        };

        const preloadedAudio = response.audio
          ? { audio: response.audio, mimeType: response.mimeType || 'audio/wav' }
          : null;

        await speak(response.text, preloadedAudio, onVoiceStart);

        if (!aiMessageAppended) {
          onVoiceStart();
        }
      } catch (fallbackError) {
        console.error('[useExpertTalk] Seluruh jalur suara gagal:', fallbackError);
        talkStore.setErrorMessage(
          'Jawaban AI belum dapat diproses. Ketuk "Coba Lagi" atau bicara kembali.',
        );
        appendTranscript({
          id: v1(),
          timestamp: dayjs().format(),
          speaker: 'ai',
          text: 'Maaf, layanan percakapan sedang mengalami kendala jaringan.',
        });
      } finally {
        const latestStore = useExpertTalkStore.getState();
        latestStore.setTurnState('listening');
        processingRef.current = false;
        resumeListening();
      }
    }
  }, [appendTranscript, expert, resumeListening, speak, stopAudioPlayback]);

  const endCall = useCallback(async (): Promise<void> => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    processingRef.current = false;
    clearPendingTranscript();
    lastTranscriptRef.current = null;
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    stopAudioPlayback();
    releaseMicrophone();

    const talkStore = useExpertTalkStore.getState();
    const transcript = talkStore.liveTranscript;
    if (transcript.length > 0) {
      const chatStore = useExpertChatStore.getState();
      chatStore.setMessages([
        ...chatStore.messages,
        ...transcript.map((entry) => ({
          sender: entry.speaker === 'user' ? ('user' as const) : ('ai' as const),
          text: entry.text,
          timestamp: entry.timestamp,
          id: entry.id,
          channel: 'voice' as const,
        })),
      ]);
    }
    talkStore.setCallStatus(CallStatusEnum.IDLE);
    talkStore.setLiveTranscript([]);
    talkStore.setIsListening(false);
    talkStore.setIsAiSpeaking(false);
    talkStore.setInterimTranscript('');
    talkStore.resetRagSearching();
  }, [clearPendingTranscript, releaseMicrophone, stopAudioPlayback]);

  /**
   * Loop VAD dan transkripsi server (Fallback STT) untuk browser tanpa SpeechRecognition bawaan (misal Safari/Firefox/iOS).
   */
  const startServerSttLoop = useCallback((stream: MediaStream): void => {
    const MediaRecorderClass = window.MediaRecorder;
    if (typeof MediaRecorderClass === 'undefined') return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    let audioContext: AudioContext | null = null;
    try {
      audioContext = new AudioContextClass();
    } catch {
      return;
    }

    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    const samples = new Uint8Array(analyser.frequencyBinCount);
    let isRecording = false;
    let silenceStart: number | null = null;
    let recorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];

    const supportedMime = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      '',
    ].find((type) => !type || MediaRecorderClass.isTypeSupported(type)) || '';

    const vadInterval = window.setInterval(() => {
      if (!activeRef.current) {
        window.clearInterval(vadInterval);
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        source.disconnect();
        analyser.disconnect();
        void audioContext?.close();
        return;
      }

      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((s, v) => s + v, 0) / samples.length;
      const level = Math.min(1, Math.max(0, (average - 4) / 42));

      const now = Date.now();
      const isSpeaking = level > 0.08;

      if (isSpeaking) {
        silenceStart = null;
        const currentStore = useExpertTalkStore.getState();
        const isAiTalking =
          currentStore.isAiSpeaking ||
          (audioQueuePlayerRef.current?.isSpeaking ?? false);

        if (isAiTalking) {
          handleBargeIn();
        }

        if (!isRecording && !processingRef.current) {
          isRecording = true;
          chunks = [];
          try {
            recorder = new MediaRecorderClass(
              stream,
              supportedMime ? { mimeType: supportedMime } : undefined,
            );
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = async () => {
              if (chunks.length === 0 || !expert || !activeRef.current) return;
              const fullBlob = new Blob(chunks, {
                type: recorder?.mimeType || 'audio/webm',
              });
              if (fullBlob.size < 1000) return;

              const store = useExpertTalkStore.getState();
              store.setIsTranscribing(true);
              try {
                const res = await transcribeAudioBlob(fullBlob, expert.id);
                if (res.text && activeRef.current) {
                  void processTranscript(res.text);
                }
              } catch (err) {
                console.warn('[ServerSTT] Gagal transkripsi:', err);
              } finally {
                store.setIsTranscribing(false);
              }
            };
            recorder.start();
            useExpertTalkStore.getState().setIsListening(true);
          } catch (recErr) {
            console.warn('[ServerSTT] Start recorder gagal:', recErr);
            isRecording = false;
          }
        }
      } else if (isRecording) {
        if (silenceStart === null) {
          silenceStart = now;
        } else if (now - silenceStart > 850) {
          isRecording = false;
          silenceStart = null;
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }
    }, 70);
  }, [expert, handleBargeIn, processTranscript]);

  const startCall = useCallback(async (): Promise<void | null> => {
    if (
      !expert ||
      useExpertTalkStore.getState().callStatus !== CallStatusEnum.IDLE
    ) {
      return null;
    }
    const browserWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    // Prime audio playback on user gesture to avoid autoplay restrictions
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') {
          void dummyCtx.resume();
        }
      }
    } catch {
      // Audio priming is best-effort
    }

    const talkStore = useExpertTalkStore.getState();
    talkStore.setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      talkStore.setErrorMessage(
        'Browser ini tidak menyediakan akses mikrofon. Gunakan Chrome, Edge, atau Safari melalui HTTPS.',
      );
      return null;
    }

    talkStore.setCallStatus(CallStatusEnum.CONNECTING);
    talkStore.setLiveTranscript([]);
    talkStore.setInterimTranscript('');
    const callAttempt = callAttemptRef.current + 1;
    callAttemptRef.current = callAttempt;

    try {
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(supportedConstraints.echoCancellation
            ? { echoCancellation: { ideal: true } }
            : {}),
          ...(supportedConstraints.noiseSuppression
            ? { noiseSuppression: { ideal: true } }
            : {}),
          ...(supportedConstraints.autoGainControl
            ? { autoGainControl: { ideal: true } }
            : {}),
          ...(supportedConstraints.channelCount
            ? { channelCount: { ideal: 1 } }
            : {}),
        },
      });
      if (
        callAttemptRef.current !== callAttempt ||
        useExpertTalkStore.getState().callStatus !== CallStatusEnum.CONNECTING
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      mediaStreamRef.current = stream;
    } catch (error) {
      if (callAttemptRef.current !== callAttempt) return null;
      const denied =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      talkStore.setCallStatus(CallStatusEnum.IDLE);
      talkStore.setErrorMessage(
        denied
          ? 'Akses mikrofon ditolak. Izinkan mikrofon pada pengaturan browser lalu coba lagi.'
          : 'Mikrofon tidak dapat dibuka. Pastikan perangkat audio tersedia dan tidak sedang bermasalah.',
      );
      releaseMicrophone();
      return null;
    }

    activeRef.current = true;
    talkStore.setCallStatus(CallStatusEnum.ACTIVE);

    // 1. Jika browser mendukung SpeechRecognition (Chrome, Edge), gunakan recognition lokal super cepat
    if (Recognition) {
      const recognition = new Recognition();
      const preferredLanguage =
        expert.languageCode ||
        document.documentElement.lang ||
        navigator.language ||
        'id-ID';
      const fallbackLanguage = expert.fallbackLanguageCode || 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = preferredLanguage;

      recognition.onresult = (event): void => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          if (event.results[index].isFinal) {
            finalTranscript += event.results[index][0].transcript;
          } else {
            interimTranscript += event.results[index][0].transcript;
          }
        }

        const activeSpeech = (interimTranscript || finalTranscript).trim();
        const currentStore = useExpertTalkStore.getState();

        // BARGE-IN: Jika AI sedang berbicara dan pengguna bersuara, hentikan suara AI seketika
        const isAiCurrentlySpeaking =
          currentStore.isAiSpeaking ||
          (audioQueuePlayerRef.current?.isSpeaking ?? false);

        if (isAiCurrentlySpeaking && activeSpeech.length > 0) {
          handleBargeIn();
        }

        currentStore.setInterimTranscript(interimTranscript.trim());

        if (finalTranscript.trim()) {
          currentStore.setInterimTranscript('');
          pendingTranscriptRef.current = [
            pendingTranscriptRef.current,
            finalTranscript.trim(),
          ]
            .filter(Boolean)
            .join(' ');

          if (transcriptTimerRef.current !== null) {
            window.clearTimeout(transcriptTimerRef.current);
          }

          // Debounce 600ms hening sebelum mengirim ucapan
          transcriptTimerRef.current = window.setTimeout(() => {
            transcriptTimerRef.current = null;
            const transcript = pendingTranscriptRef.current.trim();
            pendingTranscriptRef.current = '';
            if (!transcript) return;

            const normalizedTranscript = transcript
              .toLocaleLowerCase('id-ID')
              .replace(/[^\p{L}\p{N}\s]/gu, '')
              .replace(/\s+/g, ' ')
              .trim();
            const previousTranscript = lastTranscriptRef.current;
            const now = Date.now();
            const isRecentDuplicate =
              previousTranscript &&
              previousTranscript.text === normalizedTranscript &&
              now - previousTranscript.timestamp < 4000;

            if (isRecentDuplicate) return;

            lastTranscriptRef.current = {
              text: normalizedTranscript,
              timestamp: now,
            };
            void processTranscript(transcript);
          }, 600);
        }
      };

      recognition.onerror = (event): void => {
        useExpertTalkStore.getState().setInterimTranscript('');
        if (event.error === 'not-allowed') {
          void endCall().then(() => {
            useExpertTalkStore
              .getState()
              .setErrorMessage(
                'Akses mikrofon ditolak. Izinkan mikrofon pada pengaturan browser lalu coba lagi.',
              );
          });
        } else if (event.error === 'audio-capture') {
          void endCall().then(() => {
            useExpertTalkStore
              .getState()
              .setErrorMessage(
                'Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain.',
              );
          });
        } else if (event.error === 'network') {
          talkStore.setErrorMessage(
            'Pengenalan suara kehilangan koneksi. Panggilan akan mencoba mendengarkan kembali.',
          );
        } else if (
          event.error === 'language-not-supported' &&
          recognition.lang !== fallbackLanguage
        ) {
          recognition.lang = fallbackLanguage;
          talkStore.setErrorMessage(null);
        }
      };

      recognition.onend = (): void => {
        // Jaga agar recognition terus hidup selama panggilan aktif
        if (activeRef.current) {
          try {
            recognition.start();
          } catch {
            // Already started
          }
        }
      };

      recognitionRef.current = recognition;
      resumeListening();
    } else {
      // 2. Jika browser tidak memiliki SpeechRecognition (Safari, iOS), aktifkan Server STT
      startServerSttLoop(mediaStreamRef.current);
      talkStore.setIsListening(true);
    }

    return undefined;
  }, [
    endCall,
    expert,
    handleBargeIn,
    processTranscript,
    releaseMicrophone,
    resumeListening,
    startServerSttLoop,
  ]);

  useEffect(() => () => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    processingRef.current = false;
    clearPendingTranscript();
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    stopAudioPlayback();
    releaseMicrophone();
  }, [clearPendingTranscript, releaseMicrophone, stopAudioPlayback]);

  return { startCall, endCall, mediaStreamRef };
};

export default useExpertTalk;
