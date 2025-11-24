export type CallStatus = 'idle' | 'connecting' | 'active' | 'error';
export type TranscriptEntry = {
  id: string;
  timestamp: string;
  speaker: 'user' | 'ai' | 'expert';
  text: string;
};
