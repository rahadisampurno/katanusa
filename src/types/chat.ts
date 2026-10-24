import type { KnowledgeSource } from './rag';

export type SenderType = 'user' | 'expert' | 'ai';

export interface ChatSession {
  expertName: string;
  expertRole: string;
  expertAvatar: string;
  isOnline: boolean;
}

export interface SuggestedQuestion {
  label: string;
  question: string;
}

export interface ChatMessage {
  sender: SenderType;
  text: string;
  additional?: {
    suggestedQuestions?: SuggestedQuestion[];
    source?: KnowledgeSource[];
    experts?: Array<{ name: string; role?: string }>;
  };
  timestamp: string;
  id: string;
  channel?: 'text' | 'voice';
}
