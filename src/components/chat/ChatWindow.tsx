import dayjs from 'dayjs';
import { useCallback, useEffect, useRef } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { v1 } from 'uuid';
import useChatActions from '../../pages/Chat/hooks/useChatActions';
import useExpertChatStore from '../../pages/Chat/hooks/useExpertChatStore.ts';
import useExpertTalk from '../../pages/Chat/hooks/useExpertTalk.ts';
import useExpertTalkStore, {
  CallStatusEnum,
} from '../../pages/Chat/hooks/useExpertTalkStore.ts';
import TalkEnd from '../talk/TalkEnd.tsx';
import ChatBubble from './ChatBubble';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';

const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const { data: expert } = useLoaderData();

  const { messages, setMessages, isLoading } = useExpertChatStore();
  const { callStatus, liveTranscript } = useExpertTalkStore();
  const { startCall, endCall } = useExpertTalk(expert);
  const { sendMessage } = useChatActions(expert);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, liveTranscript]);

  const initialMessages = useCallback(() => {
    if (expert) {
      setMessages([
        {
          sender: 'ai',
          text: `Selamat datang! Saya adalah asisten AI dari ${expert.name}. Anda bisa bertanya lewat teks atau memulai panggilan suara dengan ikon telepon di atas.`,
          timestamp: dayjs().format(),
          id: v1(),
        },
      ]);
    }
  }, [expert, setMessages]);

  // initial
  useEffect(() => {
    initialMessages();
  }, [expert, initialMessages]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col h-120 md:h-160">
      <ChatHeader
        expert={expert}
        status={
          callStatus === CallStatusEnum.CONNECTING
            ? 'Menghubungkan...'
            : 'Online'
        }
        startCall={startCall}
        onClose={() => navigate('/experts')}
      />

      {/* Chat Area dengan Background Pattern */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-[#fdf8f0] relative"
      >
        {/* CSS Pattern Hack untuk simulasi Batik background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            isUser={msg.sender === 'user'}
            additional={msg.additional}
            onOptionClick={sendMessage}
          />
        ))}

        {liveTranscript.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            isUser={msg.speaker === 'user'}
          />
        ))}

        {isLoading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-tl-none shadow-sm flex items-center space-x-2">
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {callStatus === CallStatusEnum.IDLE ? (
        <ChatInput />
      ) : (
        <TalkEnd endCall={endCall} />
      )}
    </div>
  );
};

export default ChatWindow;
