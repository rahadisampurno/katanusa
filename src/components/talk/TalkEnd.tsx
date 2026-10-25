import {
  AudioLines,
  Loader2,
  Mic,
  PhoneOff,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { cn } from '../../libs/utils.ts';
import useExpertTalkStore, {
  CallStatusEnum,
} from '../../pages/Chat/hooks/useExpertTalkStore.ts';
import type { Expert } from '../../types/expert.ts';

interface TalkEndProps {
  expert: Expert;
  endCall: () => Promise<void>;
  mediaStreamRef: MutableRefObject<MediaStream | null>;
}

const TalkEnd: React.FC<TalkEndProps> = ({ expert, endCall, mediaStreamRef }) => {
  const {
    callStatus,
    turnState,
    isListening,
    isAiSpeaking,
    isRagSearching,
    isInterrupted,
    isTranscribing,
    interimTranscript,
    errorMessage,
    setErrorMessage,
    setTurnState,
  } = useExpertTalkStore();
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [audioHint, setAudioHint] = useState<string | null>(null);
  const interimTranscriptRef = useRef(interimTranscript);

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  useEffect(() => {
    const mediaStream = mediaStreamRef.current;
    if (!mediaStream || callStatus !== CallStatusEnum.ACTIVE) {
      setMicrophoneLevel(0);
      setAudioHint(null);
      return undefined;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return undefined;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const samples = new Uint8Array(analyser.frequencyBinCount);
    let animationFrame = 0;
    let lastUpdate = 0;
    let quietStartedAt: number | null = null;
    let noisyStartedAt: number | null = null;
    let currentHint: string | null = null;

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);
    void audioContext.resume();

    const measure = (timestamp: number): void => {
      analyser.getByteFrequencyData(samples);
      if (timestamp - lastUpdate > 70) {
        const average =
          samples.reduce((sum, value) => sum + value, 0) / samples.length;
        const normalizedLevel = Math.min(1, Math.max(0, (average - 4) / 42));
        setMicrophoneLevel(normalizedLevel);

        if (!isListening) {
          quietStartedAt = null;
          noisyStartedAt = null;
          if (currentHint !== null) {
            currentHint = null;
            setAudioHint(null);
          }
        } else if (normalizedLevel < 0.025) {
          quietStartedAt ??= timestamp;
          noisyStartedAt = null;
          if (timestamp - quietStartedAt > 3500 && currentHint !== 'quiet') {
            currentHint = 'quiet';
            setAudioHint(
              'Suara masih sangat pelan. Dekatkan mikrofon atau tingkatkan volume input.',
            );
          }
        } else if (
          normalizedLevel > 0.6 &&
          interimTranscriptRef.current.length === 0
        ) {
          noisyStartedAt ??= timestamp;
          quietStartedAt = null;
          if (timestamp - noisyStartedAt > 2500 && currentHint !== 'noisy') {
            currentHint = 'noisy';
            setAudioHint(
              'Suara latar cukup kuat. Berpindahlah ke tempat yang lebih tenang.',
            );
          }
        } else {
          quietStartedAt = null;
          noisyStartedAt = null;
          if (currentHint !== null) {
            currentHint = null;
            setAudioHint(null);
          }
        }
        lastUpdate = timestamp;
      }
      animationFrame = window.requestAnimationFrame(measure);
    };

    animationFrame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [callStatus, isListening, mediaStreamRef]);

  const isVoiceDetected =
    isListening && (microphoneLevel > 0.08 || interimTranscript.length > 0);

  const statusText =
    callStatus === CallStatusEnum.CONNECTING
      ? 'Meminta akses mikrofon...'
      : isInterrupted
        ? 'Percakapan disela'
        : isTranscribing
          ? 'Memproses ucapan suara...'
          : isAiSpeaking || turnState === 'speaking'
            ? `${expert.name} sedang berbicara`
            : isRagSearching || turnState === 'thinking'
              ? `${expert.name} sedang menyiapkan jawaban...`
              : isVoiceDetected
                ? 'Suara Anda terdeteksi'
                : isListening
                  ? 'Mendengarkan suara Anda...'
                  : 'Panggilan aktif';

  const statusDescription =
    callStatus === CallStatusEnum.CONNECTING
      ? 'Izinkan akses mikrofon untuk memulai percakapan.'
      : isInterrupted
        ? 'AI langsung berhenti bicara, silakan lanjutkan pertanyaan baru Anda.'
        : isTranscribing
          ? 'Menganalisis intonasi dan kosakata budaya dengan akurasi tinggi.'
          : isAiSpeaking || turnState === 'speaking'
            ? 'Dengarkan jawaban, atau Anda dapat langsung menyela kapan saja.'
            : isRagSearching || turnState === 'thinking'
              ? 'Mengaitkan pengetahuan adat dan merumuskan jawaban terbaik.'
              : interimTranscript
                ? `“${interimTranscript}”`
                : audioHint
                  ? audioHint
                  : isListening
                    ? `Bicaralah secara santai dengan ${expert.name}. Beri jeda sejenak untuk mengirim.`
                    : 'Percakapan suara sedang berlangsung.';

  const StatusIcon =
    callStatus === CallStatusEnum.CONNECTING
      ? Loader2
      : isTranscribing
        ? Sparkles
        : isAiSpeaking || turnState === 'speaking'
          ? AudioLines
          : isRagSearching || turnState === 'thinking'
            ? Sparkles
            : isInterrupted
              ? Volume2
              : Mic;

  const handleRetry = (): void => {
    setErrorMessage(null);
    setTurnState('listening');
  };

  return (
    <div className="border-t border-[#1E315A]/10 bg-gradient-to-t from-[#F8F2E7] via-[#F8F2E7] to-[#F8F2E7]/70 px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#1E315A]/10 bg-white/95 px-3 py-3 shadow-[0_10px_35px_rgba(30,49,90,0.10)] backdrop-blur sm:px-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <span
              className={cn(
                'absolute -inset-1 rounded-full opacity-40',
                isAiSpeaking && 'animate-pulse bg-amber-400',
                isListening && !isAiSpeaking && 'animate-pulse bg-emerald-400',
                isRagSearching && !isAiSpeaking && 'animate-pulse bg-amber-300',
                isInterrupted && 'animate-ping bg-blue-400',
              )}
            />
            <img
              src={expert.image}
              alt={expert.name}
              className="relative h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
            />
            <span
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                callStatus === CallStatusEnum.CONNECTING
                  ? 'bg-amber-400'
                  : 'bg-emerald-500',
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusIcon
                className={cn(
                  'h-4 w-4 shrink-0',
                  (callStatus === CallStatusEnum.CONNECTING || isTranscribing) &&
                    'animate-spin text-amber-600',
                  (isAiSpeaking || turnState === 'speaking') && 'text-amber-600',
                  (isRagSearching || turnState === 'thinking') &&
                    'animate-pulse text-amber-600',
                  isInterrupted && 'text-blue-600',
                  isListening &&
                    !isAiSpeaking &&
                    !isRagSearching &&
                    !isTranscribing &&
                    'text-emerald-600',
                )}
              />
              <p className="truncate text-sm font-bold text-[#1E315A]">
                {statusText}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {statusDescription}
            </p>
          </div>

          <div
            className="hidden h-8 items-center gap-1 px-2 sm:flex"
            aria-hidden="true"
          >
            {[0.62, 1, 0.76, 0.9, 0.55].map((scale, index) => {
              const activeLevel = isListening
                ? Math.max(0.12, microphoneLevel)
                : isAiSpeaking
                  ? 0.7
                  : isRagSearching
                    ? 0.25
                    : 0.12;
              const height = 7 + activeLevel * 25 * scale;

              return (
                <span
                  key={scale}
                  className={cn(
                    'w-1 rounded-full bg-[#1E315A]/20 transition-all',
                    isVoiceDetected && 'bg-emerald-500/80',
                    isAiSpeaking && 'animate-pulse bg-amber-500/70',
                    isRagSearching && 'animate-pulse bg-amber-300/60',
                    isInterrupted && 'bg-blue-500/80',
                  )}
                  style={{
                    height: `${height}px`,
                    animationDelay: `${index * 120}ms`,
                  }}
                />
              );
            })}
          </div>

          {callStatus !== CallStatusEnum.IDLE && (
            <button
              type="button"
              onClick={() => void endCall()}
              aria-label="Akhiri panggilan"
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-red-600 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 sm:px-4"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">Akhiri</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-red-100 pt-2 text-xs text-red-600">
            <p role="alert" className="truncate">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex shrink-0 items-center gap-1 rounded bg-red-100 px-2 py-1 font-medium text-red-700 hover:bg-red-200"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalkEnd;
