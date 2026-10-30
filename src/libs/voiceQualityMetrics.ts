export type VoiceTurnMeasurement = {
  turnId: string;
  startedAt: number;
  firstTextMs?: number;
  firstAudioMs?: number;
  interruptionStopMs?: number;
};

const STORAGE_KEY = 'katanusa:voice-quality:v1';
const MAX_MEASUREMENTS = 100;

const percentile = (values: number[], quantile: number): number | undefined => {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * quantile));
  return Math.round(sorted[index]);
};

export const storeVoiceTurnMeasurement = (measurement: VoiceTurnMeasurement): void => {
  try {
    const previous = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    const entries = Array.isArray(previous) ? previous : [];
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...entries, measurement].slice(-MAX_MEASUREMENTS)),
    );
  } catch {
    // Metrics are diagnostics only and must never interrupt a call.
  }
};

export const getVoiceQualitySummary = (): {
  sampleCount: number;
  firstTextP50Ms?: number;
  firstAudioP50Ms?: number;
  firstAudioP95Ms?: number;
  interruptionP50Ms?: number;
  interruptionP95Ms?: number;
} => {
  let entries: VoiceTurnMeasurement[] = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (Array.isArray(parsed)) entries = parsed as VoiceTurnMeasurement[];
  } catch {
    // Return an empty summary if browser storage is unavailable.
  }
  const firstText = entries.flatMap((item) =>
    typeof item.firstTextMs === 'number' ? [item.firstTextMs] : [],
  );
  const firstAudio = entries.flatMap((item) =>
    typeof item.firstAudioMs === 'number' ? [item.firstAudioMs] : [],
  );
  const interruption = entries.flatMap((item) =>
    typeof item.interruptionStopMs === 'number' ? [item.interruptionStopMs] : [],
  );
  return {
    sampleCount: entries.length,
    firstTextP50Ms: percentile(firstText, 0.5),
    firstAudioP50Ms: percentile(firstAudio, 0.5),
    firstAudioP95Ms: percentile(firstAudio, 0.95),
    interruptionP50Ms: percentile(interruption, 0.5),
    interruptionP95Ms: percentile(interruption, 0.95),
  };
};

declare global {
  interface Window {
    getKataNusaVoiceQuality?: typeof getVoiceQualitySummary;
  }
}

if (typeof window !== 'undefined') {
  window.getKataNusaVoiceQuality = getVoiceQualitySummary;
}
