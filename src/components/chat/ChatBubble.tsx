import { Loader2, User, Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../libs/utils';
import type { KnowledgeSource } from '../../types/rag';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  avatarUrl?: string;
  additional?: {
    suggestedQuestions?: { label: string; question: string }[];
    source?: KnowledgeSource[];
    experts?: { name: string; role?: string }[];
  };
  onOptionClick?: (question: string) => void;
  onSpeak?: (message: string) => void;
  isPlayingVoice?: boolean;
  isLoadingVoice?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  avatarUrl,
  additional,
  onOptionClick,
  onSpeak,
  isPlayingVoice,
  isLoadingVoice,
}) => {
  const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

  return (
    <div
      className={cn(
        'mb-6 flex w-full gap-2.5 sm:mb-8 sm:gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border',
          isUser
            ? 'border-[#1E315A]/15 bg-[#1E315A]/10'
            : 'border-amber-300/50 bg-white',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-[#1E315A]" />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="Avatar persona" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-[#1E315A]" />
        )}
      </div>

      <div
        className={cn(
          'flex min-w-0 max-w-[calc(100%_-_2.875rem)] flex-col gap-2',
          isUser ? 'md:max-w-[70%]' : 'md:max-w-[82%]',
        )}
      >
        <div
          className={cn(
            'relative break-words text-sm leading-7 sm:text-[15px]',
            isUser
              ? 'rounded-2xl bg-[#E7E0D5] px-4 py-3 text-[#1E315A]'
              : 'px-1 py-1 text-slate-800',
          )}
        >
          <div className="chat-markdown space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
          </div>

          {additional?.source && additional.source.length > 0 && (
            <div
              className={cn(
                'mt-4 border-t pt-3 text-xs leading-5',
                'border-slate-300/70 text-slate-500',
              )}
            >
              <div>
                <span className="font-semibold">Sumber: </span>
                {additional.source.map((source, index) => {
                  const sourceUrl = source.url
                    ?? (source.citationId
                      ? `${apiBaseUrl}/knowledge/citations/${encodeURIComponent(source.citationId)}`
                      : undefined);

                  return (
                    <React.Fragment key={source.citationId ?? `${source.kind}-${source.title}`}>
                      {index > 0 ? '; ' : ''}
                      {sourceUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-amber-700"
                        >
                          {source.title}
                        </a>
                      ) : (
                        source.title
                      )}
                      {source.locator ? ` (${source.locator})` : ''}
                    </React.Fragment>
                  );
                })}
              </div>
              {additional.experts && additional.experts.length > 0 && (
                <div>
                  Referensi pakar:{' '}
                  <span className="font-semibold">
                    {additional.experts.map((expert) => expert.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {!isUser && onSpeak && message.trim() && (
          <button
            type="button"
            onClick={() => onSpeak(message)}
            disabled={isLoadingVoice}
            title={isPlayingVoice ? 'Hentikan suara' : 'Dengarkan suara persona'}
            className={cn(
              'flex min-h-11 w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60',
              isPlayingVoice
                ? 'bg-[#1E315A] text-white'
                : 'text-[#1E315A]/65 hover:bg-[#1E315A]/5 hover:text-[#1E315A]',
            )}
          >
            {isLoadingVoice ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPlayingVoice ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            <span>
              {isLoadingVoice
                ? 'Memuat suara...'
                : isPlayingVoice
                  ? 'Hentikan suara'
                  : 'Dengarkan suara'}
            </span>
          </button>
        )}

        {!isUser && additional?.suggestedQuestions && (
          <div className="mt-1 flex flex-wrap gap-2">
            {additional.suggestedQuestions.map((question) => (
              <button
                key={question.question}
                type="button"
                onClick={() => onOptionClick?.(question.question)}
                className="min-h-11 rounded-full border border-[#1E315A]/15 bg-white px-3 py-2 text-left text-xs font-medium text-[#1E315A] transition hover:border-amber-500/50 hover:bg-amber-50"
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
