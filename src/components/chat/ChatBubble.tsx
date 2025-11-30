import { User } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../libs/utils';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  avatarUrl?: string;
  additional?: {
    suggestedQuestions?: { label: string; question: string }[];
  };
  onOptionClick?: (question: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  avatarUrl,
  additional,
  onOptionClick,
}) => {
  return (
    <div
      className={cn(
        'flex w-full gap-4 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {isUser ? (
          <User className="w-5 h-5 text-gray-600" />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-gray-600" />
        )}
      </div>
      {/* Bubble */}
      <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
        <div
          className={cn(
            'p-4 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
            isUser
              ? 'bg-blue-100 text-gray-800 rounded-tr-none border border-blue-200'
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200',
          )}
        >
          {message.split('\n').map((line, i) => (
            <div key={i} className={i > 0 ? 'mt-2 overflow-hidden' : ''}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{line}</ReactMarkdown>
            </div>
          ))}
        </div>

        {/* Suggested Questions */}
        {!isUser && additional?.suggestedQuestions && (
          <div className="flex flex-wrap gap-2 mt-1">
            {additional.suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => onOptionClick?.(question.question)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs text-blue-700 hover:bg-blue-50 transition-colors text-left"
              >
                {question.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
