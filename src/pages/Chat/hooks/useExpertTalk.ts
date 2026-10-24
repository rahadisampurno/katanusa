import dayjs from 'dayjs';
import { useCallback, useEffect, useRef } from 'react';
import { v1 } from 'uuid';
import deepseek from '../../../libs/deepseek';
import network from '../../../libs/network';
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

const speakWithSpeechSynthesis = (
  text: string,
  expert: Expert,
): Promise<void> =>
  new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    void waitForBrowserVoices().then((voices) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const matchingVoice = choosePersonaVoice(voices, expert);
      utterance.voice = matchingVoice ?? null;
      utterance.lang = matchingVoice?.lang ?? expert.languageCode ?? 'id-ID';
      utterance.rate = expert.speakingRate ?? 1;
      utterance.pitch = Math.min(2, Math.max(0, 1 + (expert.pitch ?? 0)));
      utterance.onend = (): void => resolve();
      utterance.onerror = (): void => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
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

  const resumeListening = useCallback((): void => {
    if (!activeRef.current || processingRef.current || !recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.start();
      useExpertTalkStore.getState().setIsListening(true);
    } catch {
      // Recognition may already be active.
    }
  }, []);

  const stopAudioPlayback = useCallback((): void => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.removeAttribute('src');
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!expert || !text.trim() || !activeRef.current) return;

      // 1. Coba Gemini Native Persona Audio via Backend
      try {
        const response = await network.post<{
          audio: string;
          mimeType: string;
        }>('/chat/tts', {
          text,
          personaId: expert.id,
        });

        if (response.data?.audio && activeRef.current) {
          return await new Promise<void>((resolve) => {
            stopAudioPlayback();

            const audio = new Audio(
              `data:${response.data.mimeType || 'audio/wav'};base64,${response.data.audio}`,
            );
            currentAudioRef.current = audio;

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
              void speakWithSpeechSynthesis(text, expert).then(resolve);
            };

            audio.play().catch((playErr) => {
              console.warn('Audio play() rejected:', playErr);
              currentAudioRef.current = null;
              void speakWithSpeechSynthesis(text, expert).then(resolve);
            });
          });
        }
      } catch (err) {
        console.warn(
          'TTS backend request failed, falling back to SpeechSynthesis:',
          err,
        );
      }

      // 2. Fallback SpeechSynthesis jika audio backend gagal atau panggilan masih aktif
      if (activeRef.current) {
        return await speakWithSpeechSynthesis(text, expert);
      }
    },
    [expert, stopAudioPlayback],
  );

  const processTranscript = useCallback(async (text: string): Promise<void> => {
    const normalized = text.trim();
    if (!normalized || processingRef.current || !expert) return;
    processingRef.current = true;
    recognitionRef.current?.stop();
    const talkStore = useExpertTalkStore.getState();
    talkStore.setIsListening(false);
    talkStore.setIsRagSearching(true);
    appendTranscript({
      id: v1(),
      timestamp: dayjs().format(),
      speaker: 'user',
      text: normalized,
    });

    try {
      const chatStore = useExpertChatStore.getState();
      const response = await deepseek.getAiResponse({
        expert,
        userMessage: normalized,
        chatHistory: chatStore.messages,
        conversationId: chatStore.conversationId,
        channel: 'voice',
      });
      chatStore.setConversationId(response.conversationId);
      sessionStorage.setItem(
        `katanusa:conversation:${expert.id}`,
        response.conversationId,
      );
      appendTranscript({
        id: v1(),
        timestamp: dayjs().format(),
        speaker: 'ai',
        text: response.text,
      });
      talkStore.setIsAiSpeaking(true);
      talkStore.setIsRagSearching(false);
      await speak(response.text);
    } catch (error) {
      console.error('Voice chat gagal:', error);
      talkStore.setErrorMessage(
        'Jawaban AI belum dapat diproses. Periksa koneksi lalu coba bicara lagi.',
      );
      appendTranscript({
        id: v1(),
        timestamp: dayjs().format(),
        speaker: 'ai',
        text: 'Maaf, layanan percakapan sedang mengalami kendala.',
      });
    } finally {
      const latestStore = useExpertTalkStore.getState();
      latestStore.setIsAiSpeaking(false);
      latestStore.resetRagSearching();
      processingRef.current = false;
      resumeListening();
    }
  }, [appendTranscript, expert, resumeListening, speak]);

  const endCall = useCallback(async (): Promise<void> => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    processingRef.current = false;
    clearPendingTranscript();
    lastTranscriptRef.current = null;
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
          sender: entry.speaker === 'user' ? 'user' as const : 'ai' as const,
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
    const talkStore = useExpertTalkStore.getState();
    talkStore.setErrorMessage(null);
    if (!Recognition) {
      talkStore.setErrorMessage(
        'Voice call membutuhkan browser yang mendukung Speech Recognition, seperti Chrome atau Edge.',
      );
      return null;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      talkStore.setErrorMessage(
        'Browser ini tidak menyediakan akses mikrofon. Gunakan Chrome atau Edge melalui HTTPS.',
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
        callAttemptRef.current !== callAttempt
        || useExpertTalkStore.getState().callStatus !== CallStatusEnum.CONNECTING
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      mediaStreamRef.current = stream;
    } catch (error) {
      if (callAttemptRef.current !== callAttempt) return null;
      const denied = error instanceof DOMException
        && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      talkStore.setCallStatus(CallStatusEnum.IDLE);
      talkStore.setErrorMessage(
        denied
          ? 'Akses mikrofon ditolak. Izinkan mikrofon pada pengaturan browser lalu coba lagi.'
          : 'Mikrofon tidak dapat dibuka. Pastikan perangkat audio tersedia dan tidak sedang bermasalah.',
      );
      releaseMicrophone();
      return null;
    }

    const recognition = new Recognition();
    const preferredLanguage = expert.languageCode
      || document.documentElement.lang
      || navigator.language
      || 'id-ID';
    const fallbackLanguage = expert.fallbackLanguageCode || 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = preferredLanguage;
    recognition.onresult = (event): void => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          finalTranscript += event.results[index][0].transcript;
        } else {
          interimTranscript += event.results[index][0].transcript;
        }
      }
      useExpertTalkStore.getState().setInterimTranscript(
        interimTranscript.trim(),
      );
      if (finalTranscript.trim()) {
        useExpertTalkStore.getState().setInterimTranscript('');
        pendingTranscriptRef.current = [
          pendingTranscriptRef.current,
          finalTranscript.trim(),
        ].filter(Boolean).join(' ');

        if (transcriptTimerRef.current !== null) {
          window.clearTimeout(transcriptTimerRef.current);
        }

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
          const isRecentDuplicate = previousTranscript
            && previousTranscript.text === normalizedTranscript
            && now - previousTranscript.timestamp < 6000;

          if (isRecentDuplicate) return;

          lastTranscriptRef.current = {
            text: normalizedTranscript,
            timestamp: now,
          };
          void processTranscript(transcript);
        }, 700);
      }
    };
    recognition.onerror = (event): void => {
      useExpertTalkStore.getState().setInterimTranscript('');
      if (event.error === 'not-allowed') {
        void endCall().then(() => {
          useExpertTalkStore.getState().setErrorMessage(
            'Akses mikrofon ditolak. Izinkan mikrofon pada pengaturan browser lalu coba lagi.',
          );
        });
      } else if (event.error === 'audio-capture') {
        void endCall().then(() => {
          useExpertTalkStore.getState().setErrorMessage(
            'Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain.',
          );
        });
      } else if (event.error === 'network') {
        talkStore.setErrorMessage(
          'Pengenalan suara kehilangan koneksi. Panggilan akan mencoba mendengarkan kembali.',
        );
      } else if (
        event.error === 'language-not-supported'
        && recognition.lang !== fallbackLanguage
      ) {
        recognition.lang = fallbackLanguage;
        talkStore.setErrorMessage(null);
      }
    };
    recognition.onend = (): void => {
      const latestStore = useExpertTalkStore.getState();
      latestStore.setIsListening(false);
      latestStore.setInterimTranscript('');
      resumeListening();
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    talkStore.setCallStatus(CallStatusEnum.ACTIVE);
    resumeListening();
    return undefined;
  }, [endCall, expert, processTranscript, releaseMicrophone, resumeListening]);

  useEffect(() => () => {
    callAttemptRef.current += 1;
    activeRef.current = false;
    processingRef.current = false;
    clearPendingTranscript();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    stopAudioPlayback();
    releaseMicrophone();
  }, [clearPendingTranscript, releaseMicrophone, stopAudioPlayback]);

  return { startCall, endCall, mediaStreamRef };
};

export default useExpertTalk;
