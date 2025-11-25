import { create } from 'zustand';

interface AiTokenStore {
  aiToken: number;
  setAiToken(aiToken: number): void;
}

const useAiTokenStore = create<AiTokenStore>()((set) => ({
  aiToken: 100,
  setAiToken(aiToken: number): void {
    set((state) => ({
      ...state,
      aiToken,
    }));
  },
}));

export default useAiTokenStore;
