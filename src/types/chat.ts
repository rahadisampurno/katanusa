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
    [key: string]: any;
  };
  timestamp: string;
  id: string;
}
