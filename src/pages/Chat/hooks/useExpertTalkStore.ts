import { create } from 'zustand';
import type { TranscriptEntry } from '../../../types/audio';

export const CallStatusEnum = {
  ACTIVE: 'active',
  CONNECTING: 'connection',
  IDLE: 'idle',
} as const;

export type CallStatusEnum =
  (typeof CallStatusEnum)[keyof typeof CallStatusEnum];

export type TurnState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted';

type UseExpertTalkStore = {
  callStatus: CallStatusEnum;
  turnState: TurnState;
  liveTranscript: TranscriptEntry[];
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isListening: boolean;
  isAiSpeaking: boolean;
  isRagSearching: boolean;
  isInterrupted: boolean;
  isTranscribing: boolean;
  interimTranscript: string;
  ragSearchingCount: number;
  errorMessage: string | null;
  setIsScreenSharing: (isScreenSharing: boolean) => void;
  setIsVideoEnabled: (isVideoEnabled: boolean) => void;
  setCallStatus: (callStatus: CallStatusEnum) => void;
  setTurnState: (turnState: TurnState) => void;
  setLiveTranscript: (liveTranscript: TranscriptEntry[]) => void;
  setIsListening: (isListening: boolean) => void;
  setIsAiSpeaking: (isAiSpeaking: boolean) => void;
  setIsRagSearching: (active: boolean) => void;
  setIsInterrupted: (isInterrupted: boolean) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
  setInterimTranscript: (interimTranscript: string) => void;
  resetRagSearching: () => void;
  setErrorMessage: (errorMessage: string | null) => void;
};

const useExpertTalkStore = create<UseExpertTalkStore>()((set) => ({
  callStatus: CallStatusEnum.IDLE,
  turnState: 'idle',
  liveTranscript: [],
  isVideoEnabled: false,
  isScreenSharing: false,
  isListening: false,
  isAiSpeaking: false,
  isRagSearching: false,
  isInterrupted: false,
  isTranscribing: false,
  interimTranscript: '',
  ragSearchingCount: 0,
  errorMessage: null,
  setIsScreenSharing(isScreenSharing: boolean): void {
    set((state) => ({
      ...state,
      isScreenSharing,
    }));
  },
  setIsVideoEnabled(isVideoEnabled: boolean): void {
    set((state) => ({
      ...state,
      isVideoEnabled,
    }));
  },
  setCallStatus(callStatus: CallStatusEnum): void {
    set((state) => ({
      ...state,
      callStatus,
      ...(callStatus === CallStatusEnum.IDLE ? { turnState: 'idle' } : {}),
    }));
  },
  setTurnState(turnState: TurnState): void {
    set((state) => ({
      ...state,
      turnState,
      isListening: turnState === 'listening',
      isAiSpeaking: turnState === 'speaking',
      isRagSearching: turnState === 'thinking',
      isInterrupted: turnState === 'interrupted',
    }));
  },
  setLiveTranscript(liveTranscript: TranscriptEntry[]): void {
    set((state) => ({
      ...state,
      liveTranscript,
    }));
  },
  setIsListening(isListening: boolean): void {
    set((state) => ({
      ...state,
      isListening,
      turnState: isListening ? 'listening' : state.turnState,
    }));
  },
  setIsAiSpeaking(isAiSpeaking: boolean): void {
    set((state) => ({
      ...state,
      isAiSpeaking,
      turnState: isAiSpeaking ? 'speaking' : state.turnState,
    }));
  },
  setIsRagSearching(active: boolean): void {
    set((state) => {
      const nextCount = active
        ? state.ragSearchingCount + 1
        : Math.max(0, state.ragSearchingCount - 1);
      return {
        ...state,
        ragSearchingCount: nextCount,
        isRagSearching: nextCount > 0,
        turnState: nextCount > 0 && !state.isAiSpeaking ? 'thinking' : state.turnState,
      };
    });
  },
  setIsInterrupted(isInterrupted: boolean): void {
    set((state) => ({
      ...state,
      isInterrupted,
      turnState: isInterrupted ? 'interrupted' : state.turnState,
    }));
  },
  setIsTranscribing(isTranscribing: boolean): void {
    set((state) => ({ ...state, isTranscribing }));
  },
  setInterimTranscript(interimTranscript: string): void {
    set((state) => ({ ...state, interimTranscript }));
  },
  resetRagSearching(): void {
    set((state) => ({
      ...state,
      ragSearchingCount: 0,
      isRagSearching: false,
    }));
  },
  setErrorMessage(errorMessage: string | null): void {
    set((state) => ({ ...state, errorMessage }));
  },
}));

export default useExpertTalkStore;
