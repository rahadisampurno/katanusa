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
import {
  decideSemanticTurn,
  selectListeningBackchannel,
} from '../../../libs/semanticTurnDetector';
import {
  storeVoiceTurnMeasurement,
  type VoiceTurnMeasurement,
} from '../../../libs/voiceQualityMetrics';
import type {
  RealtimeVoiceClient as RealtimeVoiceClientType,
  RealtimeAgentState,
} from '../../../libs/livekitVoice';
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

type StartCallOptions = {
  allowWithoutGesture?: boolean;
};

const AI_PLAYBACK_COOLDOWN_MS = 650;
const MANUAL_INTERRUPT_RESUME_MS = 80;
const FIRST_AUDIO_FALLBACK_MS = 420;
const BACKCHANNEL_MIN_WORDS = 8;
const BACKCHANNEL_COOLDOWN_MS = 7_000;

const normalizeSpeechText = (text: string): string =>
  text
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * SpeechRecognition kadang menangkap suara speaker sebagai input mikrofon.
 * Abaikan transkrip yang sangat mirip dengan kalimat AI, tetapi tetap izinkan
 * interjeksi singkat ("tunggu", "bukan", dst.) untuk melakukan barge-in.
 */
const isLikelyAiPlaybackEcho = (heardText: string, aiText: string): boolean => {
  const heard = normalizeSpeechText(heardText);
  const spoken = normalizeSpeechText(aiText);
  if (!heard || !spoken) return false;
  if (spoken.includes(heard)) return true;

  const heardTokens = heard.split(' ').filter((token) => token.length > 1);
  const spokenTokens = new Set(spoken.split(' '));
  if (heardTokens.length === 0) return false;

  const overlap = heardTokens.filter((token) => spokenTokens.has(token)).length;
  return overlap / heardTokens.length >= 0.72;
};

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
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
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
      if (signal?.aborted) {
        resolve();
        return;
      }
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
          if (signal?.aborted) {
            resolve();
            return;
          }
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
  startCall: (options?: StartCallOptions) => Promise<void | null>;
  endCall: () => Promise<void>;
  interruptAi: () => void;
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
  const resumeInputTimerRef = useRef<number | null>(null);
  const inputSuppressedRef = useRef(false);
  const currentAiSpeechRef = useRef('');
  const lastTranscriptRef = useRef<{ text: string; timestamp: number } | null>(null);
  const currentBackchannelRef = useRef('');
  const lastBackchannelAtRef = useRef(0);
  const lastBackchannelWordCountRef = useRef(0);
  const currentMeasurementRef = useRef<VoiceTurnMeasurement | null>(null);
  const interruptionDetectedAtRef = useRef<number | null>(null);
  const realtimeClientRef = useRef<RealtimeVoiceClientType | null>(null);

  const clearPendingTranscript = useCallback((): void => {
    if (transcriptTimerRef.current !== null) {
      window.clearTimeout(transcriptTimerRef.current);
      transcriptTimerRef.current = null;
    }
    pendingTranscriptRef.current = '';
  }, []);

  const clearResumeInputTimer = useCallback((): void => {
    if (resumeInputTimerRef.current !== null) {
      window.clearTimeout(resumeInputTimerRef.current);
      resumeInputTimerRef.current = null;
    }
  }, []);

  const appendTranscript = useCallback((entry: TranscriptEntry): void => {
    const store = useExpertTalkStore.getState();
    store.setLiveTranscript([...store.liveTranscript, entry]);
  }, []);

  const upsertAiTranscript = useCallback((id: string, text: string): void => {
    const normalized = text.trim();
    if (!normalized) return;
    const store = useExpertTalkStore.getState();
    const existingIndex = store.liveTranscript.findIndex((entry) => entry.id === id);
    if (existingIndex === -1) {
      store.setLiveTranscript([
        ...store.liveTranscript,
        {
          id,
          timestamp: dayjs().format(),
          speaker: 'ai',
          text: normalized,
        },
      ]);
      return;
    }
    store.setLiveTranscript(
      store.liveTranscript.map((entry) =>
        entry.id === id ? { ...entry, text: normalized } : entry,
      ),
    );
  }, []);

  const releaseMicrophone = useCallback((): void => {
    mediaStreamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Track dapat sudah berakhir saat cleanup berjalan.
      }
    });
    mediaStreamRef.current = null;
  }, []);

  const stopAudioPlayback = useCallback((): void => {
    if (audioQueuePlayerRef.current) {
      audioQueuePlayerRef.current.stop();
      audioQueuePlayerRef.current = null;
    }
    if (currentAudioRef.current) {
      const audio = currentAudioRef.current;
      currentAudioRef.current = null;
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // Elemen audio mungkin sudah dilepas ketika panggilan ditutup.
      }
    }
    if ('speechSynthesis' in window) {
      activeUtterance = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  const maybePlayListeningBackchannel = useCallback(
    (transcript: string): void => {
      if (!expert || !activeRef.current || inputSuppressedRef.current) return;
      const words = normalizeSpeechText(transcript).split(' ').filter(Boolean);
      const now = Date.now();
      if (
        words.length < BACKCHANNEL_MIN_WORDS ||
        words.length - lastBackchannelWordCountRef.current < 5 ||
        now - lastBackchannelAtRef.current < BACKCHANNEL_COOLDOWN_MS ||
        !('speechSynthesis' in window) ||
        window.speechSynthesis.speaking
      ) {
        return;
      }

      const options = selectListeningBackchannel(expert.suku);
      const phrase = options[Math.floor(now / BACKCHANNEL_COOLDOWN_MS) % options.length];
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = expert.languageCode ?? 'id-ID';
      utterance.rate = 1.08;
      utterance.pitch = Math.min(1.35, Math.max(0.75, 1 + (expert.pitch ?? 0)));
      utterance.volume = 0.32;
      currentBackchannelRef.current = phrase;
      lastBackchannelAtRef.current = now;
      lastBackchannelWordCountRef.current = words.length;
      const clearBackchannel = (): void => {
        window.setTimeout(() => {
          if (currentBackchannelRef.current === phrase) currentBackchannelRef.current = '';
        }, 280);
      };
      utterance.onend = clearBackchannel;
      utterance.onerror = clearBackchannel;
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        currentBackchannelRef.current = '';
      }
    },
    [expert],
  );

  const resumeListening = useCallback((): void => {
    if (
      !activeRef.current ||
      inputSuppressedRef.current ||
      !recognitionRef.current
    ) {
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      // Recognition may already be active.
    }
    useExpertTalkStore.getState().setIsListening(true);
  }, []);

  /**
   * Tandai input biasa sebagai tertahan selama suara AI diputar. Recognition
   * tetap aktif khusus untuk mendeteksi barge-in; kemiripan transkrip dengan
   * kalimat AI disaring sebagai gema pada handler recognition.
   */
  const suppressInputForAiPlayback = useCallback((): void => {
    clearResumeInputTimer();
    inputSuppressedRef.current = true;
    clearPendingTranscript();
    useExpertTalkStore.getState().setInterimTranscript('');
    useExpertTalkStore.getState().setIsListening(false);
  }, [clearPendingTranscript, clearResumeInputTimer]);

  const scheduleInputResume = useCallback(
    (delayMs = AI_PLAYBACK_COOLDOWN_MS): void => {
      clearResumeInputTimer();
      resumeInputTimerRef.current = window.setTimeout(() => {
        resumeInputTimerRef.current = null;
        if (!activeRef.current) return;
        inputSuppressedRef.current = false;
        processingRef.current = false;
        useExpertTalkStore.getState().setTurnState('listening');
        resumeListening();
      }, delayMs);
    },
    [clearResumeInputTimer, resumeListening],
  );

  /**
   * Interupsi eksplisit menjaga fitur barge-in tanpa menebak suara speaker
   * sebagai ucapan pengguna. Input baru dibuka setelah audio benar-benar diam.
   */
  const interruptAi = useCallback((): void => {
    if (!activeRef.current) return;
    if (realtimeClientRef.current?.connected) {
      realtimeClientRef.current.requestInterruption();
      const realtimeStore = useExpertTalkStore.getState();
      realtimeStore.setInterimTranscript('');
      realtimeStore.setIsAiSpeaking(false);
      realtimeStore.setIsInterrupted(true);
      realtimeStore.setTurnState('interrupted');
      return;
    }
    clearResumeInputTimer();
    inputSuppressedRef.current = true;
    clearPendingTranscript();
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    stopAudioPlayback();
    if (currentMeasurementRef.current && interruptionDetectedAtRef.current !== null) {
      currentMeasurementRef.current.interruptionStopMs = Math.max(
        0,
        Math.round(performance.now() - interruptionDetectedAtRef.current),
      );
      storeVoiceTurnMeasurement(currentMeasurementRef.current);
      currentMeasurementRef.current = null;
    }
    interruptionDetectedAtRef.current = null;
    currentAiSpeechRef.current = '';

    const store = useExpertTalkStore.getState();
    store.setInterimTranscript('');
    store.setIsAiSpeaking(false);
    store.setIsInterrupted(true);
    store.setTurnState('interrupted');
    processingRef.current = false;
    scheduleInputResume(MANUAL_INTERRUPT_RESUME_MS);
  }, [
    clearPendingTranscript,
    clearResumeInputTimer,
    scheduleInputResume,
    stopAudioPlayback,
  ]);

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

    currentMeasurementRef.current = {
      turnId: v1(),
      startedAt: performance.now(),
    };

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
    const sentenceTextByIndex = new Map<number, string>();

    const appendAiSentence = (index: number, sentence: string): void => {
      const cleanSentence = sentence.trim();
      if (!cleanSentence || turnAbortController.signal.aborted) return;
      sentenceTextByIndex.set(index, cleanSentence);
      fullAccumulatedText = Array.from(sentenceTextByIndex.entries())
        .sort(([left], [right]) => left - right)
        .map(([, value]) => value)
        .join(' ');
      currentAiSpeechRef.current = fullAccumulatedText;
      aiMessageAppended = true;
      upsertAiTranscript(aiEntryId, fullAccumulatedText);
    };

    const player = new AudioQueuePlayer({
      onStartSpeaking: () => {
        if (turnAbortController.signal.aborted) return;
        const measurement = currentMeasurementRef.current;
        if (measurement && measurement.firstAudioMs === undefined) {
          measurement.firstAudioMs = Math.round(performance.now() - measurement.startedAt);
        }
        const currentStore = useExpertTalkStore.getState();
        currentStore.setTurnState('speaking');
      },
      onSentenceStart: (chunk) => {
        if (turnAbortController.signal.aborted) return;
        currentAiSpeechRef.current = fullAccumulatedText || chunk.text;
      },
      onFinish: () => {
        if (turnAbortController.signal.aborted) return;
        if (currentMeasurementRef.current) {
          storeVoiceTurnMeasurement(currentMeasurementRef.current);
          currentMeasurementRef.current = null;
        }
        scheduleInputResume();
      },
      onError: (err) => {
        console.warn('[AudioQueuePlayer] Error:', err);
      },
      playBrowserVoice: async (sentence) => {
        if (!expert || turnAbortController.signal.aborted) return;
        await speakWithSpeechSynthesis(
          sentence,
          expert,
          undefined,
          turnAbortController.signal,
        );
      },
    });

    audioQueuePlayerRef.current = player;
    let streamAccepted = false;
    let streamProducedAnswer = false;
    const audioReadyIndexes = new Set<number>();
    let firstAudioFallbackTimer: number | null = null;

    try {
      await streamVoiceTurn(
        {
          userMessage: normalized,
          personaId: expert.id,
          conversationId: chatStore.conversationId,
        },
        {
          onMeta: (meta) => {
            streamAccepted = true;
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
          onSentence: ({ index, text: sentence }) => {
            const measurement = currentMeasurementRef.current;
            if (measurement && measurement.firstTextMs === undefined) {
              measurement.firstTextMs = Math.round(performance.now() - measurement.startedAt);
            }
            streamProducedAnswer = true;
            appendAiSentence(index, sentence);
            if (index === 0 && firstAudioFallbackTimer === null) {
              firstAudioFallbackTimer = window.setTimeout(() => {
                firstAudioFallbackTimer = null;
                if (
                  turnAbortController.signal.aborted ||
                  audioReadyIndexes.has(index) ||
                  !activeRef.current
                ) {
                  return;
                }
                // Jalur spekulatif menjaga first-audio tetap rendah ketika
                // provider neural lambat. Chunk neural index yang sama akan
                // diabaikan AudioQueuePlayer agar tidak terdengar dua kali.
                suppressInputForAiPlayback();
                player.addBrowserVoiceChunk({ index, text: sentence });
              }, FIRST_AUDIO_FALLBACK_MS);
            }
          },
          onAudioChunk: (chunk) => {
            audioReadyIndexes.add(chunk.index);
            if (chunk.index === 0 && firstAudioFallbackTimer !== null) {
              window.clearTimeout(firstAudioFallbackTimer);
              firstAudioFallbackTimer = null;
            }
            if (!audioQueuePlayerRef.current?.isSpeaking) {
              suppressInputForAiPlayback();
            }
            player.addChunk(chunk);
          },
          onAudioError: ({ index, text: failedSentence }) => {
            audioReadyIndexes.add(index);
            if (index === 0 && firstAudioFallbackTimer !== null) {
              window.clearTimeout(firstAudioFallbackTimer);
              firstAudioFallbackTimer = null;
            }
            const sentence = failedSentence || sentenceTextByIndex.get(index);
            if (!sentence) return;
            if (!audioQueuePlayerRef.current?.isSpeaking) {
              suppressInputForAiPlayback();
            }
            player.addBrowserVoiceChunk({ index, text: sentence });
          },
          onDone: (done) => {
            if (done.text?.trim()) {
              fullAccumulatedText = done.text.trim();
              currentAiSpeechRef.current = fullAccumulatedText;
              aiMessageAppended = true;
              upsertAiTranscript(aiEntryId, fullAccumulatedText);
            }
            player.markStreamDone();
          },
          onError: (streamErr) => {
            console.warn('[VoiceStream] Stream error:', streamErr);
          },
        },
        { signal: turnAbortController.signal },
      );
    } catch (error) {
      if (turnAbortController.signal.aborted) {
        return;
      }

      // Setelah event meta diterima, backend sudah menyimpan ucapan pengguna.
      // Jangan mengirim ulang ke endpoint fallback karena akan menggandakan turn.
      if (streamAccepted) {
        player.markStreamDone();
        talkStore.setErrorMessage(
          streamProducedAnswer
            ? 'Koneksi suara sempat terputus. Anda dapat langsung melanjutkan percakapan.'
            : 'Jawaban suara terputus. Silakan ulangi pertanyaan Anda.',
        );
        if (!streamProducedAnswer) {
          upsertAiTranscript(
            aiEntryId,
            'Maaf, sambungan suara terputus sebelum jawaban selesai disiapkan.',
          );
        }
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

        const showFallbackAnswer = (): void => {
          if (aiMessageAppended) return;
          aiMessageAppended = true;
          currentAiSpeechRef.current = response.text;
          upsertAiTranscript(aiEntryId, response.text);
        };

        const onVoiceStart = (): void => {
          showFallbackAnswer();
          const measurement = currentMeasurementRef.current;
          if (measurement && measurement.firstAudioMs === undefined) {
            measurement.firstAudioMs = Math.round(
              performance.now() - measurement.startedAt,
            );
          }
          const store = useExpertTalkStore.getState();
          store.setTurnState('speaking');
        };

        const preloadedAudio = response.audio
          ? { audio: response.audio, mimeType: response.mimeType || 'audio/wav' }
          : null;

        suppressInputForAiPlayback();
        // Tampilkan jawaban segera; visibilitas teks tidak boleh bergantung pada
        // keberhasilan autoplay atau TTS.
        showFallbackAnswer();
        await speak(response.text, preloadedAudio, onVoiceStart);
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
        if (currentMeasurementRef.current) {
          storeVoiceTurnMeasurement(currentMeasurementRef.current);
          currentMeasurementRef.current = null;
        }
        scheduleInputResume();
      }
    }
  }, [
    appendTranscript,
    expert,
    scheduleInputResume,
    speak,
    stopAudioPlayback,
    suppressInputForAiPlayback,
    upsertAiTranscript,
  ]);

  const endCall = useCallback(async (): Promise<void> => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    inputSuppressedRef.current = false;
    processingRef.current = false;
    clearPendingTranscript();
    clearResumeInputTimer();
    lastTranscriptRef.current = null;
    currentMeasurementRef.current = null;
    interruptionDetectedAtRef.current = null;
    currentBackchannelRef.current = '';
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    const realtimeClient = realtimeClientRef.current;
    realtimeClientRef.current = null;
    if (realtimeClient) {
      try {
        await realtimeClient.disconnect();
      } catch (error) {
        console.warn('[RealtimeVoice] Cleanup room gagal:', error);
      }
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Recognition mungkin sudah berhenti ketika tombol akhir ditekan.
      }
    }
    stopAudioPlayback();
    releaseMicrophone();
    currentAiSpeechRef.current = '';

    const talkStore = useExpertTalkStore.getState();
    const transcript = talkStore.liveTranscript;
    if (transcript.length > 0) {
      const chatStore = useExpertChatStore.getState();
      const knownIds = new Set(chatStore.messages.map((message) => message.id));
      chatStore.setMessages([
        ...chatStore.messages,
        ...transcript.filter((entry) => !knownIds.has(entry.id)).map((entry) => ({
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
  }, [
    clearPendingTranscript,
    clearResumeInputTimer,
    releaseMicrophone,
    stopAudioPlayback,
  ]);

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
    let aiPlaybackStartedAt: number | null = null;
    let aiNoiseFloor = 0;
    let bargeInStartedAt: number | null = null;
    let pendingServerTranscript = '';
    let semanticEndpointTimer: number | null = null;

    const scheduleServerTranscript = (text: string): void => {
      pendingServerTranscript = [pendingServerTranscript, text.trim()]
        .filter(Boolean)
        .join(' ');
      if (!pendingServerTranscript) return;
      if (semanticEndpointTimer !== null) window.clearTimeout(semanticEndpointTimer);
      const decision = decideSemanticTurn({
        transcript: pendingServerTranscript,
        isFinal: true,
        aiSpeaking: false,
      });
      semanticEndpointTimer = window.setTimeout(() => {
        semanticEndpointTimer = null;
        const completed = pendingServerTranscript;
        pendingServerTranscript = '';
        if (completed && activeRef.current) void processTranscript(completed);
      }, decision.endpointDelayMs);
    };

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
        if (semanticEndpointTimer !== null) window.clearTimeout(semanticEndpointTimer);
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        try {
          source.disconnect();
          analyser.disconnect();
        } catch {
          // Audio graph dapat sudah dilepas oleh browser saat track berhenti.
        }
        if (audioContext?.state !== 'closed') {
          void audioContext?.close().catch(() => undefined);
        }
        return;
      }

      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const level = Math.min(1, Math.max(0, (average - 4) / 42));
      const now = Date.now();

      if (inputSuppressedRef.current) {
        silenceStart = null;
        if (isRecording) {
          isRecording = false;
          chunks = [];
          if (recorder && recorder.state !== 'inactive') {
            recorder.ondataavailable = null;
            recorder.onstop = null;
            recorder.stop();
          }
        }

        aiPlaybackStartedAt ??= now;
        if (now - aiPlaybackStartedAt < 700) {
          aiNoiseFloor = Math.max(aiNoiseFloor, level);
          bargeInStartedAt = null;
          return;
        }

        // Fallback Safari/Firefox: cari lonjakan suara dekat mikrofon yang
        // bertahan di atas noise/gema speaker, lalu perlakukan sebagai barge-in.
        aiNoiseFloor = aiNoiseFloor * 0.94 + level * 0.06;
        const bargeInThreshold = Math.min(
          0.72,
          Math.max(0.2, aiNoiseFloor + 0.14),
        );
        if (level > bargeInThreshold) {
          bargeInStartedAt ??= now;
          if (now - bargeInStartedAt >= 220) {
            interruptionDetectedAtRef.current = performance.now();
            interruptAi();
            aiPlaybackStartedAt = null;
            aiNoiseFloor = 0;
            bargeInStartedAt = null;
          }
        } else {
          bargeInStartedAt = null;
        }
        return;
      }

      aiPlaybackStartedAt = null;
      aiNoiseFloor = 0;
      bargeInStartedAt = null;
      const isSpeaking = level > 0.08;

      if (isSpeaking) {
        silenceStart = null;

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
              if (
                chunks.length === 0 ||
                !expert ||
                !activeRef.current ||
                inputSuppressedRef.current
              ) return;
              const fullBlob = new Blob(chunks, {
                type: recorder?.mimeType || 'audio/webm',
              });
              if (fullBlob.size < 1000) return;

              const store = useExpertTalkStore.getState();
              store.setIsTranscribing(true);
              try {
                const res = await transcribeAudioBlob(fullBlob, expert.id);
                if (res.text && activeRef.current) {
                  scheduleServerTranscript(res.text);
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
        } else if (now - silenceStart > 420) {
          isRecording = false;
          silenceStart = null;
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }
    }, 70);
  }, [expert, interruptAi, processTranscript]);

  const startCall = useCallback(async (
    options: StartCallOptions = {},
  ): Promise<void | null> => {
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

    if (
      navigator.userActivation &&
      !navigator.userActivation.isActive &&
      !options.allowWithoutGesture
    ) {
      useExpertTalkStore.getState().setErrorMessage(
        'Klik tombol panggilan untuk mengaktifkan mikrofon. Browser tidak mengizinkan panggilan dimulai otomatis.',
      );
      return null;
    }

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
    clearResumeInputTimer();
    inputSuppressedRef.current = false;
    const callAttempt = callAttemptRef.current + 1;
    callAttemptRef.current = callAttempt;

    // Jalur utama: WebRTC full-duplex dengan semantic turn detection di worker.
    // Bila fitur belum dikonfigurasi atau koneksi gagal, jalur lama di bawah
    // tetap dipakai agar panggilan tidak kehilangan fungsi.
    try {
      const { RealtimeVoiceClient } = await import('../../../libs/livekitVoice');
      const chatStore = useExpertChatStore.getState();
      const session = await RealtimeVoiceClient.requestSession({
        personaId: expert.id,
        conversationId: chatStore.conversationId,
      });
      if (
        callAttemptRef.current !== callAttempt ||
        useExpertTalkStore.getState().callStatus !== CallStatusEnum.CONNECTING
      ) {
        return null;
      }

      const updateRealtimeState = (state: RealtimeAgentState): void => {
        if (!activeRef.current) return;
        const currentStore = useExpertTalkStore.getState();
        if (state === 'speaking') currentStore.setTurnState('speaking');
        else if (state === 'thinking' || state === 'initializing') {
          currentStore.setTurnState('thinking');
        } else {
          currentStore.setTurnState('listening');
        }
      };
      const realtimeClient = new RealtimeVoiceClient({
        onTranscript: ({ id, text, speaker }) => {
          const normalized = text.trim();
          if (!normalized || !activeRef.current) return;
          const currentStore = useExpertTalkStore.getState();
          const existingIndex = currentStore.liveTranscript.findIndex(
            (entry) => entry.id === id,
          );
          const nextEntry: TranscriptEntry = {
            id,
            timestamp: dayjs().format(),
            speaker,
            text: normalized,
          };
          currentStore.setLiveTranscript(
            existingIndex === -1
              ? [...currentStore.liveTranscript, nextEntry]
              : currentStore.liveTranscript.map((entry) =>
                  entry.id === id ? { ...entry, text: normalized } : entry,
                ),
          );
        },
        onAgentState: updateRealtimeState,
        onLocalStream: (stream) => {
          mediaStreamRef.current = stream;
        },
        onDisconnected: () => {
          if (!activeRef.current) return;
          void endCall().then(() => {
            useExpertTalkStore
              .getState()
              .setErrorMessage(
                'Sambungan panggilan real-time terputus. Silakan mulai panggilan kembali.',
              );
          });
        },
      });
      realtimeClientRef.current = realtimeClient;
      await realtimeClient.connect(session);
      if (
        callAttemptRef.current !== callAttempt ||
        useExpertTalkStore.getState().callStatus !== CallStatusEnum.CONNECTING
      ) {
        await realtimeClient.disconnect();
        realtimeClientRef.current = null;
        return null;
      }

      chatStore.setConversationId(session.conversationId);
      sessionStorage.setItem(
        `katanusa:conversation:${expert.id}`,
        session.conversationId,
      );
      activeRef.current = true;
      talkStore.setCallStatus(CallStatusEnum.ACTIVE);
      talkStore.setTurnState('listening');
      return undefined;
    } catch (error) {
      const realtimeClient = realtimeClientRef.current;
      realtimeClientRef.current = null;
      if (realtimeClient) {
        await realtimeClient.disconnect().catch(() => undefined);
      }
      if (
        callAttemptRef.current !== callAttempt ||
        useExpertTalkStore.getState().callStatus !== CallStatusEnum.CONNECTING
      ) {
        return null;
      }
      const microphoneDenied =
        (error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'SecurityError')) ||
        (error instanceof Error &&
          error.message === 'Izin mikrofon belum diberikan.');
      if (microphoneDenied) {
        talkStore.setCallStatus(CallStatusEnum.IDLE);
        talkStore.setErrorMessage(
          'Akses mikrofon belum diizinkan. Klik ikon izin di bilah alamat browser, pilih Izinkan, lalu mulai panggilan kembali.',
        );
        releaseMicrophone();
        return null;
      }
      console.info(
        '[RealtimeVoice] Jalur WebRTC tidak tersedia, memakai fallback standar:',
        error,
      );
    }

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
          ...(supportedConstraints.sampleRate
            ? { sampleRate: { ideal: 48_000 } }
            : {}),
          ...(supportedConstraints.sampleSize
            ? { sampleSize: { ideal: 16 } }
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
      const microphoneTrack = stream.getAudioTracks()[0];
      if (microphoneTrack) {
        microphoneTrack.contentHint = 'speech';
        // Sejumlah browser baru mengaktifkan rangkaian AEC/NS sepenuhnya
        // setelah track hidup. Pengulangan constraints ini bersifat best effort.
        void microphoneTrack.applyConstraints({
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
        }).catch(() => undefined);
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

        const currentStore = useExpertTalkStore.getState();
        const activeSpeech = (finalTranscript || interimTranscript).trim();
        const backchannelEcho = isLikelyAiPlaybackEcho(
          activeSpeech,
          currentBackchannelRef.current,
        );

        if (backchannelEcho) {
          currentStore.setInterimTranscript('');
          return;
        }

        if (inputSuppressedRef.current) {
          const aiIsTalking =
            currentStore.isAiSpeaking ||
            currentStore.turnState === 'speaking' ||
            (audioQueuePlayerRef.current?.isSpeaking ?? false);
          const likelyEcho = isLikelyAiPlaybackEcho(
            activeSpeech,
            currentAiSpeechRef.current,
          );
          const turnDecision = decideSemanticTurn({
            transcript: activeSpeech,
            isFinal: Boolean(finalTranscript.trim()),
            aiSpeaking: aiIsTalking,
          });

          if (
            !aiIsTalking ||
            !activeSpeech ||
            likelyEcho ||
            turnDecision.kind !== 'interrupt'
          ) {
            currentStore.setInterimTranscript('');
            return;
          }

          // Barge-in otomatis: hentikan audio/stream seketika lalu teruskan
          // transkrip yang sama sebagai awal giliran baru pengguna.
          interruptionDetectedAtRef.current = performance.now();
          interruptAi();
          clearResumeInputTimer();
          inputSuppressedRef.current = false;
          processingRef.current = false;
          currentStore.setTurnState('listening');
        }

        currentStore.setInterimTranscript(interimTranscript.trim());
        if (interimTranscript.trim()) {
          maybePlayListeningBackchannel(interimTranscript);
        }

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

          const turnDecision = decideSemanticTurn({
            transcript: pendingTranscriptRef.current,
            isFinal: true,
            aiSpeaking: false,
          });

          // Endpoint adaptif: pikiran lengkap dikirim cepat, sedangkan filler,
          // konjungsi, dan jeda berpikir diberi ruang lebih panjang.
          transcriptTimerRef.current = window.setTimeout(() => {
            transcriptTimerRef.current = null;
            const transcript = pendingTranscriptRef.current.trim();
            pendingTranscriptRef.current = '';
            if (!transcript) return;

            const normalizedTranscript = normalizeSpeechText(transcript);
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
          }, turnDecision.endpointDelayMs);
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
        // Recognition tetap hidup saat AI bicara untuk mendeteksi barge-in.
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
    clearResumeInputTimer,
    endCall,
    expert,
    interruptAi,
    maybePlayListeningBackchannel,
    processTranscript,
    releaseMicrophone,
    resumeListening,
    startServerSttLoop,
  ]);

  useEffect(() => () => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    inputSuppressedRef.current = false;
    processingRef.current = false;
    currentMeasurementRef.current = null;
    interruptionDetectedAtRef.current = null;
    currentBackchannelRef.current = '';
    clearPendingTranscript();
    clearResumeInputTimer();
    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
      turnAbortControllerRef.current = null;
    }
    const realtimeClient = realtimeClientRef.current;
    realtimeClientRef.current = null;
    if (realtimeClient) {
      void realtimeClient.disconnect().catch(() => undefined);
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Recognition mungkin sudah berhenti ketika komponen dilepas.
      }
    }
    stopAudioPlayback();
    releaseMicrophone();
  }, [
    clearPendingTranscript,
    clearResumeInputTimer,
    releaseMicrophone,
    stopAudioPlayback,
  ]);

  return { startCall, endCall, interruptAi, mediaStreamRef };
};

export default useExpertTalk;
