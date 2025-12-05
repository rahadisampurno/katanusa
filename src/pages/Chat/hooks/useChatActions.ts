import dayjs from 'dayjs';
import { v1 } from 'uuid';
import gemini from '../../../libs/gemini';
import type { ChatMessage } from '../../../types/chat';
import type { Expert } from '../../../types/expert';
import useExpertChatStore from './useExpertChatStore';

const useChatActions = (
  expert: Expert,
): {
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
} => {
  const { messages, isLoading, setMessages, setIsLoading } =
    useExpertChatStore();

  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        sender: 'user',
        text: text.trim(),
        id: v1(),
        timestamp: dayjs().format(),
      },
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await gemini.getAiResponse({
        expert,
        userMessage: text.trim(),
        chatHistory: messages,
      });

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
