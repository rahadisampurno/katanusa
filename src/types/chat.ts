export type SenderType = 'user' | 'expert' | 'ai';

export interface ChatSession {
  expertName: string;
  expertRole: string;
  expertAvatar: string;
  isOnline: boolean;
}

export interface ChatMessage {
  sender: SenderType;
  text: string;
  timestamp: string;
  id: string;
}
