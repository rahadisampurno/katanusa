import { create } from 'zustand';
import type { ChatMessage } from '../../../types/chat.ts';

type UseExpertChatStore = {
  messages: ChatMessage[];
  userInput: string;
  isLoading: boolean;
  conversationId: string | null;
  personaId: string | null;

  setMessages: (messages: ChatMessage[]) => void;
  setUserInput: (userInput: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setConversationId: (conversationId: string | null) => void;
  setPersonaId: (personaId: string | null) => void;
};

const useExpertChatStore = create<UseExpertChatStore>()((set) => ({
  messages: [],
  userInput: '',
  isLoading: false,
  conversationId: null,
  personaId: null,

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
  setConversationId(conversationId: string | null): void {
    set((state) => ({ ...state, conversationId }));
  },
  setPersonaId(personaId: string | null): void {
    set((state) => ({ ...state, personaId }));
  },
}));

export default useExpertChatStore;
