import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactMarkdown from 'react-markdown';
// eslint-disable-next-line import/no-extraneous-dependencies
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
      {/* Bubble */}
      <div className="flex flex-col gap-2 max-w-[70%]">
        <div
          className={cn(
            'p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-blue-100 text-gray-800 rounded-tr-none'
              : 'bg-white text-gray-800 rounded-tl-none',
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
