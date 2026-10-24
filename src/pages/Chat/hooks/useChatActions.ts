import dayjs from 'dayjs';
import { v1 } from 'uuid';
import deepseek from '../../../libs/deepseek';
import type { ChatMessage } from '../../../types/chat';
import type { Expert } from '../../../types/expert';
import useExpertChatStore from './useExpertChatStore';

const useChatActions = (
  expert: Expert | null,
): {
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
} => {
  const { messages, isLoading, conversationId, setConversationId, setMessages, setIsLoading } =
    useExpertChatStore();

  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || isLoading || !expert) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        sender: 'user',
        text: text.trim(),
        id: v1(),
        timestamp: dayjs().format(),
        channel: 'text',
      },
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await deepseek.getAiResponse({
        expert,
        userMessage: text.trim(),
        chatHistory: messages,
        conversationId,
        channel: 'text',
      });

      setConversationId(aiResponse.conversationId);
      sessionStorage.setItem(`katanusa:conversation:${expert.id}`, aiResponse.conversationId);

      if (!aiResponse) {
        setMessages([
          ...newMessages,
          {
            sender: 'ai',
            text: 'Maaf, terjadi kesalahan. Coba lagi nanti.',
            id: v1(),
            timestamp: dayjs().format(),
          },
        ]);
        return;
      }

      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: aiResponse.text,
          additional: {
            suggestedQuestions: aiResponse.suggestedQuestions,
            source: aiResponse.source,
            experts: aiResponse.experts,
          },
          id: v1(),
          timestamp: dayjs().format(),
          channel: 'text',
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          sender: 'ai',
          text: 'Maaf, terjadi kesalahan. Coba lagi nanti.',
          id: v1(),
          timestamp: dayjs().format(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
  };
};

export default useChatActions;
