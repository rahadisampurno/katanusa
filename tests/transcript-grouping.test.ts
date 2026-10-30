import assert from 'node:assert/strict';
import test from 'node:test';
import { groupAdjacentTranscripts } from '../src/libs/transcriptGrouping';

test('menggabungkan fragmen final dalam satu giliran pengguna', () => {
  const grouped = groupAdjacentTranscripts([
    { id: '1', timestamp: '2026-10-25T22:44:08+07:00', speaker: 'user', text: 'Tapi, kan, untuk kami' },
    { id: '2', timestamp: '2026-10-25T22:44:13+07:00', speaker: 'user', text: 'ketahui, ada yang disamakan dengan' },
    { id: '3', timestamp: '2026-10-25T22:44:14+07:00', speaker: 'user', text: 'ayam goreng.' },
  ]);

  assert.equal(grouped.length, 1);
  assert.equal(
    grouped[0]?.text,
    'Tapi, kan, untuk kami ketahui, ada yang disamakan dengan ayam goreng.',
  );
});

test('tidak menggabungkan giliran pengguna dan AI', () => {
  const grouped = groupAdjacentTranscripts([
    { id: '1', timestamp: '1', speaker: 'user', text: 'Halo' },
    { id: '2', timestamp: '2', speaker: 'ai', text: 'Sampurasun' },
    { id: '3', timestamp: '3', speaker: 'user', text: 'Apa kabar?' },
  ]);

  assert.equal(grouped.length, 3);
});

test('mengganti transkrip parsial dengan versi kumulatif tanpa duplikasi', () => {
  const grouped = groupAdjacentTranscripts([
    { id: '1', timestamp: '1', speaker: 'user', text: 'ceritakan tentang' },
    { id: '2', timestamp: '2', speaker: 'user', text: 'ceritakan tentang angklung' },
  ]);

  assert.equal(grouped[0]?.text, 'ceritakan tentang angklung');
});

