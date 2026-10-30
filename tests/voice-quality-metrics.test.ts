import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getVoiceQualitySummary,
  storeVoiceTurnMeasurement,
} from '../src/libs/voiceQualityMetrics';

const values = new Map<string, string>();
const storage: Storage = {
  get length() {
    return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => Array.from(values.keys())[index] ?? null,
  removeItem: (key) => {
    values.delete(key);
  },
  setItem: (key, value) => {
    values.set(key, value);
  },
};

Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: storage,
});

test('menghitung ringkasan latency suara dan interupsi', () => {
  storage.clear();
  storeVoiceTurnMeasurement({
    turnId: 'one',
    startedAt: 0,
    firstTextMs: 300,
    firstAudioMs: 700,
    interruptionStopMs: 180,
  });
  storeVoiceTurnMeasurement({
    turnId: 'two',
    startedAt: 0,
    firstTextMs: 420,
    firstAudioMs: 850,
    interruptionStopMs: 240,
  });
  storeVoiceTurnMeasurement({
    turnId: 'three',
    startedAt: 0,
    firstTextMs: 550,
    firstAudioMs: 1_100,
    interruptionStopMs: 310,
  });

  assert.deepEqual(getVoiceQualitySummary(), {
    sampleCount: 3,
    firstTextP50Ms: 420,
    firstAudioP50Ms: 850,
    firstAudioP95Ms: 1_100,
    interruptionP50Ms: 240,
    interruptionP95Ms: 310,
  });
});

test('membatasi penyimpanan ke 100 pengukuran terakhir', () => {
  storage.clear();
  for (let index = 0; index < 105; index += 1) {
    storeVoiceTurnMeasurement({
      turnId: String(index),
      startedAt: index,
      firstAudioMs: 700 + index,
    });
  }

  assert.equal(getVoiceQualitySummary().sampleCount, 100);
});
