import type { ChatMessage } from '../types/chat';
import type { Expert } from '../types/expert';
import type { KnowledgeSource } from '../types/rag';
import network from './network';

export type AiResponse = {
  text: string;
  suggestedQuestions?: { label: string; question: string }[];
  source?: KnowledgeSource[];
  experts?: {
    name: string;
    role?: string;
  }[];
  mode?: 'deepseek' | 'local';
  conversationId: string;
};

const getAiResponse = async ({
  expert,
  userMessage,
  conversationId,
  channel = 'text',
}: {
  expert: Expert;
  userMessage: string;
  chatHistory: ChatMessage[];
  conversationId?: string | null;
  channel?: 'text' | 'voice';
}): Promise<AiResponse> => {
  const response = await network.post<AiResponse>('/chat', {
    personaId: expert.id,
    userMessage,
    conversationId: conversationId || undefined,
    channel,
  });
  return response.data;
};

export default {
  getAiResponse,
};
