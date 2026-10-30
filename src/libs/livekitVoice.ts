import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
  type TranscriptionSegment,
} from 'livekit-client';
import network from './network';

export type RealtimeVoiceSessionResponse = {
  enabled: true;
  token: string;
  url: string;
  roomName: string;
  participantIdentity: string;
  agentName: string;
  conversationId: string;
};

export type RealtimeAgentState =
  | 'initializing'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking';

type RealtimeVoiceCallbacks = {
  onTranscript: (event: {
    id: string;
    text: string;
    isFinal: boolean;
    speaker: 'user' | 'ai';
  }) => void;
  onAgentState: (state: RealtimeAgentState) => void;
  onDisconnected: () => void;
  onLocalStream: (stream: MediaStream | null) => void;
};

const isAgentState = (value: string | undefined): value is RealtimeAgentState =>
  value === 'initializing' ||
  value === 'idle' ||
  value === 'listening' ||
  value === 'thinking' ||
  value === 'speaking';

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export class RealtimeVoiceClient {
  readonly room: Room;
  private readonly callbacks: RealtimeVoiceCallbacks;
  private readonly audioElements = new Set<HTMLMediaElement>();
  private intentionalDisconnect = false;
  private manualInterruption = false;
  private cancelRequested = false;

  constructor(callbacks: RealtimeVoiceCallbacks) {
    this.callbacks = callbacks;
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      stopLocalTrackOnUnpublish: true,
    });

    this.room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.autoplay = true;
      element.setAttribute('playsinline', 'true');
      document.body.appendChild(element);
      this.audioElements.add(element);
    });
    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((element) => {
        this.audioElements.delete(element);
        element.remove();
      });
    });
    this.room.on(
      RoomEvent.TranscriptionReceived,
      (segments: TranscriptionSegment[], participant?: Participant) => {
        const speaker =
          participant?.identity === this.room.localParticipant.identity ? 'user' : 'ai';
        segments.forEach((segment) => {
          this.callbacks.onTranscript({
            id: `livekit-${speaker}-${segment.id}`,
            text: segment.text,
            isFinal: segment.final,
            speaker,
          });
        });
      },
    );
    this.room.on(RoomEvent.ParticipantAttributesChanged, (changedAttributes) => {
      const state = changedAttributes['lk.agent.state'];
      if (!isAgentState(state)) return;
      if (state !== 'speaking' && this.manualInterruption) {
        this.manualInterruption = false;
        this.setRemoteAudioMuted(false);
      }
      this.callbacks.onAgentState(state);
    });
    this.room.on(RoomEvent.Disconnected, () => {
      this.cleanupElements();
      this.callbacks.onLocalStream(null);
      if (!this.intentionalDisconnect) this.callbacks.onDisconnected();
    });
  }

  static async requestSession(params: {
    personaId: string;
    conversationId?: string | null;
  }): Promise<RealtimeVoiceSessionResponse> {
    const response = await network.post<RealtimeVoiceSessionResponse>(
      '/chat/voice-session',
      params,
    );
    return response.data;
  }

  async connect(session: RealtimeVoiceSessionResponse): Promise<void> {
    this.cancelRequested = false;
    await withTimeout(
      this.room.connect(session.url, session.token, {
        autoSubscribe: true,
      }),
      12_000,
      'Koneksi ruang suara melewati batas waktu.',
    );
    await this.throwIfCancelled();
    await withTimeout(
      this.room.startAudio(),
      5_000,
      'Pemutaran audio tidak dapat dimulai.',
    );
    await this.throwIfCancelled();
    const publication = await withTimeout(
      this.room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48_000,
        sampleSize: 16,
        voiceIsolation: true,
      }),
      15_000,
      'Izin mikrofon belum diberikan.',
    );
    await this.throwIfCancelled();
    const mediaTrack = publication?.track?.mediaStreamTrack;
    if (mediaTrack) {
      mediaTrack.contentHint = 'speech';
      this.callbacks.onLocalStream(new MediaStream([mediaTrack]));
    }
  }

  requestInterruption(): void {
    this.manualInterruption = true;
    this.setRemoteAudioMuted(true);
    this.callbacks.onAgentState('listening');
  }

  async disconnect(): Promise<void> {
    this.intentionalDisconnect = true;
    this.cancelRequested = true;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(false);
    } catch {
      // Room dapat sudah terputus ketika cleanup berlangsung.
    }
    await this.room.disconnect();
    this.cleanupElements();
    this.callbacks.onLocalStream(null);
  }

  get connected(): boolean {
    return this.room.state === ConnectionState.Connected;
  }

  private async throwIfCancelled(): Promise<void> {
    if (!this.cancelRequested) return;
    await this.room.disconnect();
    throw new DOMException('Panggilan dibatalkan.', 'AbortError');
  }

  private setRemoteAudioMuted(muted: boolean): void {
    this.audioElements.forEach((element) => {
      element.muted = muted;
    });
  }

  private cleanupElements(): void {
    this.audioElements.forEach((element) => {
      try {
        element.pause();
        element.removeAttribute('src');
        element.remove();
      } catch {
        // Cleanup harus idempotent saat browser sudah melepas media element.
      }
    });
    this.audioElements.clear();
  }
}
