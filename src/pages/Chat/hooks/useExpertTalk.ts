import { LiveServerMessage, Session } from '@google/genai';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { v1 } from 'uuid';
import audio from '../../../libs/audio';
import gemini from '../../../libs/gemini';
import { sanitizeTranscription } from '../../../libs/textSanitizer';
import type { Expert } from '../../../types/expert';
import useExpertChatStore from './useExpertChatStore';
import useExpertTalkStore, { CallStatusEnum } from './useExpertTalkStore';

const useExpertTalk = (
  expert: Expert,
): {
  startCall: () => Promise<void | null>;
  endCall: () => Promise<void>;
  mediaStreamRef: React.MutableRefObject<MediaStream | null>;
} => {
  const {
    liveTranscript,
    callStatus,
    setCallStatus,
    setLiveTranscript,
    setIsListening,
    setIsAiSpeaking,
    // isPushToTalkEnabled,
    // isPushHoldActive,
    // setIsVideoEnabled,
    // setIsScreenSharing,
  } = useExpertTalkStore();

  const { messages, setMessages, setIsLoading } = useExpertChatStore();

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  // const videoStreamRef = useRef<MediaStream | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const pendingAiTextRef = useRef<string>('');
  const audioBufferQueueRef = useRef<AudioBuffer[]>([]);
  const hasReceivedAiTextRef = useRef<boolean>(false);
  const listenDebounceTimerRef = useRef<number | null>(null);
  const playbackTimeoutRef = useRef<number | null>(null);
  // const LISTENING_DEBOUNCE_MS = 700;
  // const VAD_THRESHOLD = 0.02;
  // const VAD_SILENCE_MS = 500;
  const vadSilenceTimerRef = useRef<number | null>(null);
  // const videoRef = useRef<HTMLVideoElement>(null);

  // const frameIntervalRef = useRef<number | null>(null);

  // const stopVideoStream = (): void => {
  //   console.log('Stopping video stream...');
  //   if (frameIntervalRef.current) {
  //     window.clearInterval(frameIntervalRef.current);
  //     frameIntervalRef.current = null;
  //   }
  //   if (videoRef.current) {
  //     videoRef.current.oncanplay = null;
  //   }
  //   videoStreamRef.current?.getTracks().forEach((track) => track.stop());
  //   videoStreamRef.current = null;
  //   if (videoRef.current) videoRef.current.srcObject = null;
  //   setIsVideoEnabled(false);
  //   setIsScreenSharing(false);
  // };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecognitionRef = useRef<any>(null);

  const endCall = async (): Promise<void> => {
    // stopVideoStream();
    setIsLoading(false);

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current
        .then((session) => session.close())
        .catch((e) =>
          console.warn('Session might have already failed to connect:', e),
        );
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current.onend = null;
      speechRecognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (inputAudioContextRef.current) {
      if (inputAudioContextRef.current.state !== 'closed') {
        await inputAudioContextRef.current.close();
      }
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      if (outputAudioContextRef.current.state !== 'closed') {
        await outputAudioContextRef.current.close();
      }
      outputAudioContextRef.current = null;
    }

    audioSourcesRef.current.forEach((source) => source.stop());
    audioSourcesRef.current.clear();

    sessionPromiseRef.current = null;

    if (callStatus !== CallStatusEnum.IDLE) {
      if (liveTranscript.length > 0) {
        const transcriptText = liveTranscript
          .map(
            (entry) =>
              `${entry.speaker === 'user' ? 'Anda' : 'AI'}: ${entry.text}`,
          )
          .join('\n');

        setMessages([
          ...messages,
          {
            sender: 'ai',
            text: `Berikut adalah transkrip panggilan suara:\n\n${transcriptText}`,
            timestamp: dayjs().format(),
            id: v1(),
          },
        ]);
      }
      setCallStatus(CallStatusEnum.IDLE);
    }

    setLiveTranscript([]);
    setIsListening(false);
    setIsAiSpeaking(false);

    useExpertTalkStore.getState().resetRagSearching();

    pendingAiTextRef.current = '';
    audioBufferQueueRef.current = [];
    hasReceivedAiTextRef.current = false;
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    if (listenDebounceTimerRef.current) {
      window.clearTimeout(listenDebounceTimerRef.current);
      listenDebounceTimerRef.current = null;
    }
    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    if (vadSilenceTimerRef.current) {
      window.clearTimeout(vadSilenceTimerRef.current);
      vadSilenceTimerRef.current = null;
    }
  };

  const startCall = async (): Promise<void | null> => {
    if (!expert) return null;

    // Prevent multiple simultaneous connection attempts
    if (useExpertTalkStore.getState().callStatus !== CallStatusEnum.IDLE) {
      console.warn('Call is already active or connecting.');
      return null;
    }

    setCallStatus(CallStatusEnum.CONNECTING);
    setLiveTranscript([]);

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          console.log(
            `${device.kind}: ${device.label} id = ${device.deviceId}`,
          );
        });
      })
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
      });

    try {
      // Inisialisasi Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          'Browser Anda tidak mendukung fitur Speech Recognition. Silakan gunakan Chrome atau Edge.',
        );
        return;
      }

      // Cleanup previous recognition instance if exists
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      speechRecognitionRef.current = recognition;

      // Cleanup previous AudioContexts
      if (inputAudioContextRef.current) {
        if (inputAudioContextRef.current.state !== 'closed') {
          await inputAudioContextRef.current.close();
        }
        inputAudioContextRef.current = null;
      }
      if (outputAudioContextRef.current) {
        if (outputAudioContextRef.current.state !== 'closed') {
          await outputAudioContextRef.current.close();
        }
        outputAudioContextRef.current = null;
      }

      // Setup Output Audio (untuk TTS dari Gemini)
      outputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextAudioStartTimeRef.current = 0;
      audioSourcesRef.current.clear();
      audioBufferQueueRef.current = [];
      hasReceivedAiTextRef.current = false;

      const callbacks = {
        onopen: (): void => {
          // Fix Race Condition: Check if call was cancelled during connection
          if (
            useExpertTalkStore.getState().callStatus !==
            CallStatusEnum.CONNECTING
          ) {
            console.log(
              'Session opened but call was cancelled. Closing session.',
            );
            endCall();
            return;
          }

          console.log('Session opened');
          setCallStatus(CallStatusEnum.ACTIVE);
          setIsListening(false);

          // Start Speech Recognition setelah sesi Gemini siap
          recognition.start();
        },
        onmessage: async (message: LiveServerMessage): Promise<void> => {
          const playAudioBuffer = (audioBuffer: AudioBuffer): void => {
            if (!outputAudioContextRef.current) return;
            const outputCtx = outputAudioContextRef.current;

            // Clear existing playback timeout (if any) to prevent premature restart
            if (playbackTimeoutRef.current) {
              window.clearTimeout(playbackTimeoutRef.current);
              playbackTimeoutRef.current = null;
            }

            if (nextAudioStartTimeRef.current < outputCtx.currentTime) {
              nextAudioStartTimeRef.current = outputCtx.currentTime;
            }

            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            setIsAiSpeaking(true);

            // Stop recognition saat AI mulai bicara agar tidak mendengar suaranya sendiri
            if (
              speechRecognitionRef.current &&
              useExpertTalkStore.getState().isListening
            ) {
              // Gunakan abort() untuk segera menghentikan dan membuang buffer audio saat ini
              speechRecognitionRef.current.abort();
            }

            source.addEventListener('ended', () => {
              audioSourcesRef.current.delete(source);
              if (audioSourcesRef.current.size === 0) {
                // Delay restart to avoid echo tail
                playbackTimeoutRef.current = window.setTimeout(() => {
                  if (
                    useExpertTalkStore.getState().callStatus !==
                    CallStatusEnum.ACTIVE
                  ) {
                    return;
                  }

                  setIsAiSpeaking(false);

                  // Restart recognition setelah AI selesai bicara dan delay echo selesai
                  if (
                    speechRecognitionRef.current &&
                    useExpertTalkStore.getState().callStatus ===
                      CallStatusEnum.ACTIVE
                  ) {
                    try {
                      speechRecognitionRef.current.start();
                    } catch (error) {
                      console.warn('Failed to restart recognition:', error);
                    }
                  }

                  if (pendingAiTextRef.current) {
                    const prev = useExpertTalkStore.getState().liveTranscript;
                    setLiveTranscript([
                      ...prev,
                      {
                        speaker: 'ai',
                        text: pendingAiTextRef.current,
                        id: v1(),
                        timestamp: dayjs().format(),
                      },
                    ]);
                    pendingAiTextRef.current = '';
                  }
                }, 1200); // 1.2s delay for echo safety on laptops
              }
            });

            source.start(nextAudioStartTimeRef.current);
            nextAudioStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
          };

          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            hasReceivedAiTextRef.current = true;

            if (useExpertTalkStore.getState().isListening) {
              pendingAiTextRef.current = sanitizeTranscription(
                (pendingAiTextRef.current || '') + (text || ''),
              );
            } else {
              const prev = useExpertTalkStore.getState().liveTranscript;
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'ai') {
                setLiveTranscript([
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: sanitizeTranscription(last.text + (text || '')),
                    id: v1(),
                    timestamp: dayjs().format(),
                  },
                ]);
              } else {
                setLiveTranscript([
                  ...prev,
                  {
                    speaker: 'ai',
                    text: sanitizeTranscription(text || ''),
                    id: v1(),
                    timestamp: dayjs().format(),
                  },
                ]);
              }
            }

            if (audioBufferQueueRef.current.length > 0) {
              audioBufferQueueRef.current.forEach(playAudioBuffer);
              audioBufferQueueRef.current = [];
            }
          }

          const base64Audio =
            message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && outputAudioContextRef.current) {
            const outputCtx = outputAudioContextRef.current;
            const audioBuffer = await audio.decodeAudioData(
              audio.decode(base64Audio),
              outputCtx,
              24000,
              1,
            );

            if (hasReceivedAiTextRef.current) {
              playAudioBuffer(audioBuffer);
            } else {
              audioBufferQueueRef.current.push(audioBuffer);
            }
          }
          setIsLoading(false);
        },
        onclose: (): void => {
          console.log('Session closed by server.');
          endCall();
        },
        onerror: (e: ErrorEvent): void => {
          console.error('Session error:', e);
          endCall();
        },
      };

      sessionPromiseRef.current = gemini.startAiCallSession(expert, callbacks);
      const session = (await sessionPromiseRef?.current) as Session;

      // Ensure session is closed if call was cancelled during await
      if (useExpertTalkStore.getState().callStatus === CallStatusEnum.IDLE) {
        if (session) session.close();
        return;
      }

      // Speech Recognition Event Handlers
      recognition.onresult = (event: any): void => {
        // Jangan proses input jika AI sedang bicara (opsional, untuk mencegah interupsi yang tidak diinginkan)
        if (useExpertTalkStore.getState().isAiSpeaking) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update UI dengan interim result (opsional)
        if (interimTranscript) {
          setIsListening(true);
          // Bisa tambahkan logic update liveTranscript 'user' (sedang mengetik...)
        }

        // Kirim Final Result ke Gemini
        if (finalTranscript) {
          console.log('🎤 User said:', finalTranscript);
          setIsListening(false);

          // Update Live Transcript (User)
          const prev = useExpertTalkStore.getState().liveTranscript;
          setLiveTranscript([
            ...prev,
            {
              speaker: 'user',
              text: finalTranscript,
              id: v1(),
              timestamp: dayjs().format(),
            },
          ]);

          // Kirim TEXT ke Gemini Session
          // session.sendClientContent({ parts: [{ text: finalTranscript }] });
          session.sendClientContent({
            turns: { parts: [{ text: finalTranscript }] },
          });
          hasReceivedAiTextRef.current = false;
        }
      };

      recognition.onerror = (event: any): void => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Izinkan akses mikrofon untuk menggunakan fitur ini.');
        }
      };

      recognition.onend = (): void => {
        // Restart recognition jika status masih ACTIVE (continuous loop)
        // DAN jika AI TIDAK sedang bicara (karena kita stop manual saat AI bicara)
        if (
          useExpertTalkStore.getState().callStatus === CallStatusEnum.ACTIVE &&
          !useExpertTalkStore.getState().isAiSpeaking
        ) {
          try {
            recognition.start();
          } catch (error) {
            console.warn('Failed to restart recognition:', error);
          }
        }
      };
    } catch (error) {
      console.error('Failed to start call:', error);
      await endCall();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startCall,
    mediaStreamRef,
    endCall,
  };
};

export default useExpertTalk;
