import { create } from 'zustand';
import type { TranscriptEntry } from '../../../types/audio';

export const CallStatusEnum = {
  ACTIVE: 'active',
  CONNECTING: 'connection',
  IDLE: 'idle',
} as const;

export type CallStatusEnum =
  (typeof CallStatusEnum)[keyof typeof CallStatusEnum];

type UseExpertTalkStore = {
  callStatus: CallStatusEnum;
  liveTranscript: TranscriptEntry[];
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isListening: boolean;
  isAiSpeaking: boolean;
  isRagSearching: boolean;
  ragSearchingCount: number;
  setIsScreenSharing: (isScreenSharing: boolean) => void;
  setIsVideoEnabled: (isVideoEnabled: boolean) => void;
  setCallStatus: (callStatus: CallStatusEnum) => void;
  setLiveTranscript: (liveTranscript: TranscriptEntry[]) => void;
  setIsListening: (isListening: boolean) => void;
  setIsAiSpeaking: (isAiSpeaking: boolean) => void;
  setIsRagSearching: (active: boolean) => void;
  resetRagSearching: () => void;
};

const useExpertTalkStore = create<UseExpertTalkStore>()((set) => ({
  callStatus: CallStatusEnum.IDLE,
  liveTranscript: [],
  isVideoEnabled: false,
  isScreenSharing: false,
  isListening: false,
  isAiSpeaking: false,
  isRagSearching: false,
  ragSearchingCount: 0,
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
    }));
  },
  setIsAiSpeaking(isAiSpeaking: boolean): void {
    set((state) => ({
      ...state,
      isAiSpeaking,
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
      };
    });
  },
  resetRagSearching(): void {
    set((state) => ({
      ...state,
      ragSearchingCount: 0,
      isRagSearching: false,
    }));
  },
}));

export default useExpertTalkStore;
