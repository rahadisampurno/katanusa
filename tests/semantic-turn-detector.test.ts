import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideSemanticTurn,
  isConversationalBackchannel,
  selectListeningBackchannel,
} from '../src/libs/semanticTurnDetector';

test('menunggu ketika pengguna sedang berpikir atau menyambung kalimat', () => {
  const hesitation = decideSemanticTurn({
    transcript: 'hmm',
    isFinal: true,
    aiSpeaking: false,
  });
  const continuation = decideSemanticTurn({
    transcript: 'saya ingin bertanya tentang',
    isFinal: true,
    aiSpeaking: false,
  });

  assert.equal(hesitation.kind, 'wait');
  assert.equal(hesitation.endpointDelayMs, 1_150);
  assert.equal(continuation.kind, 'wait');
});

test('mengirim pikiran lengkap dengan endpoint adaptif yang cepat', () => {
  const decision = decideSemanticTurn({
    transcript: 'Apa makna upacara Seren Taun?',
    isFinal: true,
    aiSpeaking: false,
  });

  assert.equal(decision.kind, 'end_turn');
  assert.ok(decision.endpointDelayMs <= 340);
  assert.ok(decision.confidence >= 0.9);
});

test('membedakan backchannel dari interupsi ketika AI sedang berbicara', () => {
  const backchannel = decideSemanticTurn({
    transcript: 'muhun',
    isFinal: true,
    aiSpeaking: true,
  });
  const interruption = decideSemanticTurn({
    transcript: 'tunggu, saya mau tanya',
    isFinal: false,
    aiSpeaking: true,
  });

  assert.equal(backchannel.kind, 'backchannel');
  assert.equal(interruption.kind, 'interrupt');
  assert.equal(interruption.endpointDelayMs, 0);
});

test('mengenali backchannel dan memilih ungkapan sesuai budaya', () => {
  assert.equal(isConversationalBackchannel('Oh kitu.'), true);
  assert.deepEqual(selectListeningBackchannel('Sunda'), [
    'muhun',
    'oh kitu',
    'mangga teraskeun',
  ]);
  assert.deepEqual(selectListeningBackchannel('Jawa'), [
    'nggih',
    'oh ngoten',
    'monggo dilanjutkan',
  ]);
});
