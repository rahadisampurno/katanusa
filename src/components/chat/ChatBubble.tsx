import React from 'react';
import { cn } from '../../libs/utils';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  avatarUrl?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser }) => {
  return (
    <div
      className={cn(
        'flex w-full gap-4 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      {/*<div className="flex-shrink-0">*/}
      {/*    {avatarUrl ? (*/}
      {/*        <img*/}
      {/*            src={avatarUrl}*/}
      {/*            alt="avatar"*/}
      {/*            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"*/}
      {/*        />*/}
      {/*    ) : (*/}
      {/*        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">*/}
      {/*            {isUser ? <User size={20}/> : <Bot size={20}/>}*/}
      {/*        </div>*/}
      {/*    )}*/}
      {/*</div>*/}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-blue-100 text-gray-800 rounded-tr-none'
            : 'bg-white text-gray-800 rounded-tl-none',
        )}
      >
        {message.split('\n').map((line, i) => (
          <div
            key={i}
            className={i > 0 ? 'mt-2' : ''}
            dangerouslySetInnerHTML={{
              __html: line,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatBubble;
