import type { TranscriptEntry } from '../types/audio';

const joinTranscriptText = (previous: string, current: string): string => {
  const left = previous.trim();
  const right = current.trim();
  if (!left) return right;
  if (!right || left === right || left.endsWith(right)) return left;
  if (right.startsWith(left)) return right;
  return `${left} ${right}`.replace(/\s+/g, ' ').trim();
};

/**
 * LiveKit dapat mengirim beberapa segmen final untuk satu giliran bicara.
 * Secara semantik worker tetap menggabungkannya, jadi UI juga menampilkan
 * segmen berurutan dari pembicara yang sama sebagai satu gelembung.
 */
export const groupAdjacentTranscripts = (
  entries: TranscriptEntry[],
): TranscriptEntry[] =>
  entries.reduce<TranscriptEntry[]>((grouped, entry) => {
    const previous = grouped.at(-1);
    if (!previous || previous.speaker !== entry.speaker) {
      grouped.push({ ...entry });
      return grouped;
    }

    grouped[grouped.length - 1] = {
      ...previous,
      text: joinTranscriptText(previous.text, entry.text),
      timestamp: entry.timestamp,
    };
    return grouped;
  }, []);

