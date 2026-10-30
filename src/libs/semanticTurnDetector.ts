/**
 * Lightweight semantic endpointing for live voice calls.
 *
 * This deliberately combines lexical meaning and conversation state instead of
 * treating every fixed period of silence as the end of a turn. It is designed
 * to be deterministic and fast in the browser; a learned detector can replace
 * it later without changing the hook contract.
 */

export type SemanticTurnKind =
  | 'wait'
  | 'end_turn'
  | 'backchannel'
  | 'interrupt';

export type SemanticTurnDecision = {
  kind: SemanticTurnKind;
  endpointDelayMs: number;
  confidence: number;
  reason: string;
};

export type SemanticTurnInput = {
  transcript: string;
  isFinal: boolean;
  aiSpeaking: boolean;
};

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}\s?!.,]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BACKCHANNELS = new Set([
  'hmm',
  'hm',
  'mhm',
  'iya',
  'ya',
  'yap',
  'oke',
  'okay',
  'muhun',
  'heeh',
  'nggih',
  'oh',
  'oh iya',
  'oh begitu',
  'oh gitu',
  'oh kitu',
  'baik',
  'paham',
  'mengerti',
  'mangga',
  'mangga teraskeun',
  'silakan lanjut',
  'lanjutkan',
]);

const HESITATIONS = new Set([
  'hmm',
  'hm',
  'eee',
  'ee',
  'anu',
  'sebentar',
  'apa ya',
  'gimana ya',
  'kumaha nya',
]);

const CONTINUATION_ENDINGS = /\b(dan|atau|karena|sebab|lalu|terus|kemudian|jadi|kalau|jika|ketika|yang|dengan|tentang|misalnya|seperti|tapi|tetapi|namun|terus terang|maksud saya|anu|eee?|hmm?)\s*[,.]?$/u;
const EXPLICIT_INTERRUPTION = /^(stop|berhenti|tunggu|sebentar|bukan|cukup|hei|halo|eh|maaf|potong dulu|saya mau tanya|aku mau tanya)\b/u;

export const isConversationalBackchannel = (value: string): boolean => {
  const text = normalize(value).replace(/[?!.,]/g, '').trim();
  if (!text) return false;
  if (BACKCHANNELS.has(text)) return true;
  const words = text.split(' ');
  return words.length <= 3 && /^(h+m+|e+h+|o+h+|iya+|ya+|muhun|nggih)$/u.test(text);
};

export const decideSemanticTurn = ({
  transcript,
  isFinal,
  aiSpeaking,
}: SemanticTurnInput): SemanticTurnDecision => {
  const text = normalize(transcript);
  const lexicalText = text.replace(/[?!.,]/g, '').trim();
  const wordCount = lexicalText.split(' ').filter(Boolean).length;

  if (!lexicalText) {
    return { kind: 'wait', endpointDelayMs: 0, confidence: 1, reason: 'empty' };
  }

  if (aiSpeaking) {
    if (isConversationalBackchannel(text)) {
      return {
        kind: 'backchannel',
        endpointDelayMs: 0,
        confidence: 0.94,
        reason: 'listener-backchannel',
      };
    }
    if (EXPLICIT_INTERRUPTION.test(lexicalText)) {
      return {
        kind: 'interrupt',
        endpointDelayMs: 0,
        confidence: 0.98,
        reason: 'explicit-interruption',
      };
    }
    if (wordCount >= 2 || isFinal) {
      return {
        kind: 'interrupt',
        endpointDelayMs: 0,
        confidence: isFinal ? 0.91 : 0.78,
        reason: 'meaningful-overlap',
      };
    }
    return { kind: 'wait', endpointDelayMs: 0, confidence: 0.65, reason: 'weak-overlap' };
  }

  if (!isFinal) {
    return { kind: 'wait', endpointDelayMs: 0, confidence: 0.75, reason: 'interim' };
  }

  if (HESITATIONS.has(lexicalText) || CONTINUATION_ENDINGS.test(text)) {
    return {
      kind: 'wait',
      endpointDelayMs: 1_150,
      confidence: 0.88,
      reason: 'thinking-or-continuation',
    };
  }

  if (/[?!]\s*$/.test(text) || wordCount >= 6) {
    return {
      kind: 'end_turn',
      endpointDelayMs: 240,
      confidence: 0.9,
      reason: 'complete-thought',
    };
  }

  if (isConversationalBackchannel(text)) {
    return {
      kind: 'end_turn',
      endpointDelayMs: 380,
      confidence: 0.72,
      reason: 'standalone-short-answer',
    };
  }

  return {
    kind: 'end_turn',
    endpointDelayMs: wordCount >= 3 ? 340 : 520,
    confidence: wordCount >= 3 ? 0.82 : 0.68,
    reason: 'short-complete-utterance',
  };
};

export const selectListeningBackchannel = (suku?: string): string[] => {
  const culture = (suku ?? '').toLocaleLowerCase('id-ID');
  if (culture.includes('sunda')) return ['muhun', 'oh kitu', 'mangga teraskeun'];
  if (culture.includes('jawa')) return ['nggih', 'oh ngoten', 'monggo dilanjutkan'];
  return ['iya', 'oh begitu', 'silakan lanjut'];
};
