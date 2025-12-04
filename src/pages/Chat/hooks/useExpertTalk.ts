import { LiveServerMessage } from '@google/genai';
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
  const pendingAudioQueueRef = useRef<string[]>([]);
  const listenDebounceTimerRef = useRef<number | null>(null);
  const LISTENING_DEBOUNCE_MS = 700;
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
    pendingAiTextRef.current = '';
    pendingAudioQueueRef.current = [];
    if (listenDebounceTimerRef.current) {
      window.clearTimeout(listenDebounceTimerRef.current);
      listenDebounceTimerRef.current = null;
    }
  };

  const startCall = async (): Promise<void | null> => {
    if (!expert) return null;
    setCallStatus(CallStatusEnum.CONNECTING);
    setLiveTranscript([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextAudioStartTimeRef.current = 0;
      audioSourcesRef.current.clear();

      const callbacks = {
        onopen: (): void => {
          console.log('Session opened');
          setCallStatus(CallStatusEnum.ACTIVE);
          setIsListening(true);
          if (!scriptProcessorRef) {
            return;
          }
          const source =
            inputAudioContextRef.current?.createMediaStreamSource(stream);
          const scriptProcessor =
            inputAudioContextRef.current?.createScriptProcessor(4096, 1, 1) ||
            null;
          scriptProcessorRef.current = scriptProcessor;

          if (scriptProcessor && inputAudioContextRef.current) {
            scriptProcessor.onaudioprocess = (audioProcessingEvent): void => {
              const inputData =
                audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = audio.createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source?.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          }
        },
        onmessage: async (message: LiveServerMessage): Promise<void> => {
          const hasInput = !!message.serverContent?.inputTranscription;
          const hasOutput = !!message.serverContent?.outputTranscription;
          if (hasInput) {
            setIsListening(true);
            if (listenDebounceTimerRef.current) {
              window.clearTimeout(listenDebounceTimerRef.current);
            }
            listenDebounceTimerRef.current = window.setTimeout(async () => {
              setIsListening(false);
              if (pendingAiTextRef.current) {
                const prev = useExpertTalkStore.getState().liveTranscript;
                const last = prev[prev.length - 1];
                if (last && last.speaker === 'ai') {
                  setLiveTranscript([
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      text: pendingAiTextRef.current,
                      id: v1(),
                      timestamp: dayjs().format(),
                    },
                  ]);
                } else {
                  setLiveTranscript([
                    ...prev,
                    {
                      speaker: 'ai',
                      text: pendingAiTextRef.current,
                      id: v1(),
                      timestamp: dayjs().format(),
                    },
                  ]);
                }
                pendingAiTextRef.current = '';
              }
              if (
                pendingAudioQueueRef.current.length &&
                outputAudioContextRef.current
              ) {
                const outputCtx = outputAudioContextRef.current;
                for (const base64Audio of pendingAudioQueueRef.current) {
                  nextAudioStartTimeRef.current = Math.max(
                    nextAudioStartTimeRef.current,
                    outputCtx.currentTime,
                  );
                  const audioBuffer = await audio.decodeAudioData(
                    audio.decode(base64Audio),
                    outputCtx,
                    24000,
                    1,
                  );
                  const source = outputCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputCtx.destination);
                  source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                  });
                  source.start(nextAudioStartTimeRef.current);
                  nextAudioStartTimeRef.current += audioBuffer.duration;
                  audioSourcesRef.current.add(source);
                }
                pendingAudioQueueRef.current = [];
              }
            }, LISTENING_DEBOUNCE_MS);
          }
          setIsLoading(hasOutput && !useExpertTalkStore.getState().isListening);
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            const prev = useExpertTalkStore.getState().liveTranscript;
            const last = prev[prev.length - 1];
            if (last && last.speaker === 'user') {
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
                  speaker: 'user',
                  text: sanitizeTranscription(text || ''),
                  id: v1(),
                  timestamp: dayjs().format(),
                },
              ]);
            }
          }
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
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
          }

          const base64Audio =
            message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && outputAudioContextRef.current) {
            if (useExpertTalkStore.getState().isListening) {
              pendingAudioQueueRef.current.push(base64Audio);
            } else {
              const outputCtx = outputAudioContextRef.current;
              nextAudioStartTimeRef.current = Math.max(
                nextAudioStartTimeRef.current,
                outputCtx.currentTime,
              );

              const audioBuffer = await audio.decodeAudioData(
                audio.decode(base64Audio),
                outputCtx,
                24000,
                1,
              );
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);

              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });

              source.start(nextAudioStartTimeRef.current);
              nextAudioStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
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

          let alertMessage =
            'Terjadi kesalahan koneksi saat panggilan. Panggilan diakhiri.';
          const errorMessage = e.message?.toLowerCase() || '';

          if (errorMessage.includes('requested entity was not found')) {
            alertMessage =
              'Kunci API yang Anda pilih tidak valid atau telah dicabut. Silakan klik tombol panggil lagi untuk memilih kunci API yang lain.';
          } else if (errorMessage.includes('network error')) {
            alertMessage =
              'Terjadi kesalahan jaringan. Periksa koneksi internet Anda. Jika masalah berlanjut, coba pilih kembali kunci API Anda dengan mengklik tombol panggil lagi.';
          }

          alert(alertMessage);
          endCall();
        },
      };

      sessionPromiseRef.current = gemini.startAiCallSession(expert, callbacks);
      await sessionPromiseRef?.current;
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
