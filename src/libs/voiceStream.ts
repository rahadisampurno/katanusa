/**
 * Modul streaming audio suara AI & pemutar antrean audio real-time.
 * Memungkinkan pemutaran suara per-kalimat (sentence-by-sentence streaming)
 * sehingga AI dapat langsung berbicara dalam ~1.5 - 2 detik, serta mendukung
 * pembatalan seketika (barge-in) ketika pengguna menyela pembicaraan AI.
 */

export type VoiceAudioChunk = {
  index: number;
  text: string;
  audioBase64: string;
  mimeType: string;
};

export type VoiceStreamCallbacks = {
  onMeta?: (data: {
    conversationId: string;
    userText: string;
    corrected?: boolean;
  }) => void;
  onSentence?: (data: { index: number; text: string }) => void;
  onAudioChunk?: (chunk: VoiceAudioChunk) => void;
  onDone?: (data: {
    text: string;
    timings?: { firstSentenceMs?: number; firstAudioMs?: number; totalMs?: number };
  }) => void;
  onError?: (error: { code?: string; message: string; retryable?: boolean }) => void;
};

/**
 * Pemutar antrean audio berurutan tanpa jeda antar-kalimat.
 * Mendukung penghentian mendadak (barge-in) saat pengguna mulai berbicara kembali.
 */
export class AudioQueuePlayer {
  private queue: VoiceAudioChunk[] = [];

  private isStreamDone = false;

  private isPlayingActive = false;

  private currentAudio: HTMLAudioElement | null = null;

  private currentObjectUrl: string | null = null;

  private preloadedAudio: HTMLAudioElement | null = null;

  private preloadedObjectUrl: string | null = null;

  private nextExpectedIndex = 0;

  private readonly onStartSpeaking?: () => void;

  private readonly onSentenceStart?: (chunk: VoiceAudioChunk) => void;

  private readonly onFinish?: () => void;

  private readonly onError?: (err: unknown, chunk?: VoiceAudioChunk) => void;

  public constructor(options: {
    onStartSpeaking?: () => void;
    onSentenceStart?: (chunk: VoiceAudioChunk) => void;
    onFinish?: () => void;
    onError?: (err: unknown, chunk?: VoiceAudioChunk) => void;
  } = {}) {
    this.onStartSpeaking = options.onStartSpeaking;
    this.onSentenceStart = options.onSentenceStart;
    this.onFinish = options.onFinish;
    this.onError = options.onError;
  }

  public get isSpeaking(): boolean {
    return this.isPlayingActive;
  }

  public addChunk(chunk: VoiceAudioChunk): void {
    this.queue.push(chunk);
    this.queue.sort((a, b) => a.index - b.index);

    if (!this.isPlayingActive && this.queue.length > 0) {
      if (this.queue[0].index === this.nextExpectedIndex) {
        this.playNext();
      }
    }
  }

  public markStreamDone(): void {
    this.isStreamDone = true;
    if (!this.isPlayingActive && this.queue.length === 0) {
      this.cleanup();
      this.onFinish?.();
    }
  }

  public stop(): void {
    this.cleanup();
    this.queue = [];
    this.isStreamDone = false;
    this.isPlayingActive = false;
  }

  private cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.removeAttribute('src');
      this.currentAudio.load();
      this.currentAudio = null;
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    if (this.preloadedAudio) {
      this.preloadedAudio.removeAttribute('src');
      this.preloadedAudio.load();
      this.preloadedAudio = null;
    }
    if (this.preloadedObjectUrl) {
      URL.revokeObjectURL(this.preloadedObjectUrl);
      this.preloadedObjectUrl = null;
    }
  }

  private createAudioFromBase64(base64: string, mimeType: string): { audio: HTMLAudioElement; url: string } {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      return { audio, url };
    } catch {
      // Fallback ke data-uri langsung
      const url = `data:${mimeType};base64,${base64}`;
      const audio = new Audio(url);
      return { audio, url };
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlayingActive = false;
      if (this.isStreamDone) {
        this.cleanup();
        this.onFinish?.();
      }
      return;
    }

    const nextChunk = this.queue.shift();
    if (!nextChunk) return;

    const isFirstPlay = !this.isPlayingActive;
    this.isPlayingActive = true;
    this.nextExpectedIndex = nextChunk.index + 1;

    // Bersihkan audio sebelumnya
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    // Gunakan preloaded jika cocok
    let audio: HTMLAudioElement;
    let url: string;
    if (this.preloadedAudio && this.preloadedObjectUrl) {
      audio = this.preloadedAudio;
      url = this.preloadedObjectUrl;
      this.preloadedAudio = null;
      this.preloadedObjectUrl = null;
    } else {
      const created = this.createAudioFromBase64(nextChunk.audioBase64, nextChunk.mimeType);
      audio = created.audio;
      url = created.url;
    }

    this.currentAudio = audio;
    this.currentObjectUrl = url;

    // Mulai preload chunk berikutnya jika ada di antrean
    if (this.queue.length > 0 && !this.preloadedAudio) {
      const ahead = this.queue[0];
      const preloaded = this.createAudioFromBase64(ahead.audioBase64, ahead.mimeType);
      this.preloadedAudio = preloaded.audio;
      this.preloadedObjectUrl = preloaded.url;
      this.preloadedAudio.preload = 'auto';
    }

    let hasStarted = false;
    const triggerStart = (): void => {
      if (!hasStarted) {
        hasStarted = true;
        if (isFirstPlay) {
          this.onStartSpeaking?.();
        }
        this.onSentenceStart?.(nextChunk);
      }
    };

    audio.onplay = triggerStart;

    audio.onended = (): void => {
      this.playNext();
    };

    audio.onerror = (e): void => {
      console.warn(`[AudioQueuePlayer] Gagal memutar potongan #${nextChunk.index}:`, e);
      this.onError?.(e, nextChunk);
      // Lanjut ke potongan berikutnya agar percakapan tidak macet
      this.playNext();
    };

    audio.play().then(triggerStart).catch((playErr) => {
      console.warn(`[AudioQueuePlayer] Play rejected #${nextChunk.index}:`, playErr);
      this.onError?.(playErr, nextChunk);
      this.playNext();
    });
  }
}

/**
 * Membuka koneksi SSE ke `/chat/voice-stream` untuk menerima potongan teks dan audio secara paralel.
 */
export const streamVoiceTurn = async (
  payload: {
    userMessage: string;
    personaId: string;
    conversationId?: string | null;
    engine?: 'edge' | 'gemini' | 'auto';
  },
  callbacks: VoiceStreamCallbacks,
  options: { signal?: AbortSignal } = {},
): Promise<void> => {
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/voice-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    credentials: 'include',
    body: JSON.stringify({
      userMessage: payload.userMessage,
      personaId: payload.personaId,
      ...(payload.conversationId ? { conversationId: payload.conversationId } : {}),
      ...(payload.engine ? { engine: payload.engine } : {}),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    let errorMessage = `Permintaan voice stream gagal dengan status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMessage = errJson.message;
    } catch {
      // response bukan json
    }
    callbacks.onError?.({ message: errorMessage, retryable: true });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.({
      message: 'Browser tidak mendukung pembaca aliran respon (ReadableStream).',
      retryable: false,
    });
    return;
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;

        let eventType = 'message';
        let dataJson = '';

        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataJson = line.slice(6).trim();
          }
        }

        if (!dataJson) continue;

        try {
          const parsed = JSON.parse(dataJson);
          switch (eventType) {
            case 'meta':
              callbacks.onMeta?.(parsed);
              break;
            case 'sentence':
              callbacks.onSentence?.(parsed);
              break;
            case 'audio':
              callbacks.onAudioChunk?.({
                index: parsed.index,
                text: parsed.text,
                audioBase64: parsed.audio,
                mimeType: parsed.mimeType || 'audio/wav',
              });
              break;
            case 'done':
              callbacks.onDone?.(parsed);
              break;
            case 'error':
              callbacks.onError?.(parsed);
              break;
            default:
              break;
          }
        } catch (parseError) {
          console.warn('[streamVoiceTurn] Gagal parse payload SSE:', parseError);
        }
      }
    }
  } catch (streamErr) {
    if (options.signal?.aborted) {
      // Pembatalan disengaja (barge-in / end call)
      return;
    }
    callbacks.onError?.({
      code: 'NETWORK_STREAM_ERROR',
      message: 'Koneksi aliran suara terputus.',
      retryable: true,
    });
  }
};

/**
 * Transkripsi rekaman audio suara melalui endpoint backend `/chat/transcribe` (Fallback STT).
 */
export const transcribeAudioBlob = async (
  blob: Blob,
  personaId: string,
): Promise<{ text: string; confidence?: number; language?: string }> => {
  const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audioBase64 = window.btoa(binary);

  const response = await fetch(`${baseUrl}/chat/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      audio: audioBase64,
      mimeType: blob.type || 'audio/webm',
      personaId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Transkripsi gagal: status ${response.status}`);
  }

  const result = await response.json();
  return {
    text: result.text || '',
    confidence: result.confidence,
    language: result.language,
  };
};
