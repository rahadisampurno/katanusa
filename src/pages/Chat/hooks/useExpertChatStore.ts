import { create } from 'zustand';
import type { ChatMessage } from '../../../types/chat.ts';

type UseExpertChatStore = {
  messages: ChatMessage[];
  userInput: string;
  isLoading: boolean;

  setMessages: (messages: ChatMessage[]) => void;
  setUserInput: (userInput: string) => void;
  setIsLoading: (isLoading: boolean) => void;
};

const useExpertChatStore = create<UseExpertChatStore>()((set) => ({
  messages: [],
  userInput: '',
  isLoading: false,

  setMessages(messages: ChatMessage[]): void {
    set((state) => ({
      ...state,
      messages,
    }));
  },

  setIsLoading(isLoading: boolean): void {
    set((state) => ({
      ...state,
      isLoading,
    }));
  },

  setUserInput(userInput: string): void {
    set((state) => ({
      ...state,
      userInput,
    }));
  },
}));

export default useExpertChatStore;
