import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router';
import { v1 } from 'uuid';
import network from '../../libs/network.ts';
import { groupAdjacentTranscripts } from '../../libs/transcriptGrouping.ts';
import { resolveExpertPersona } from '../../data/resolveExpertPersona.ts';
import useChatActions from '../../pages/Chat/hooks/useChatActions';
import useExpertChatStore from '../../pages/Chat/hooks/useExpertChatStore.ts';
import useExpertTalk from '../../pages/Chat/hooks/useExpertTalk.ts';
import useExpertTalkStore, {
  CallStatusEnum,
} from '../../pages/Chat/hooks/useExpertTalkStore.ts';
import type { ChatMessage } from '../../types/chat.ts';
import type { Expert } from '../../types/expert.ts';
import type { TranscriptEntry } from '../../types/audio.ts';
import TalkEnd from '../talk/TalkEnd.tsx';
import ChatBubble from './ChatBubble';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';

const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData() as { data?: Expert } | undefined;

  const [expert, setExpert] = useState<Expert | null>(loaderData?.data || null);
  const [isResolving, setIsResolving] = useState(!loaderData?.data);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
  const [errorNotFound, setErrorNotFound] = useState(false);
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const autoCallTriggered = useRef(false);

  // Sync loader data or fetch by URL param if loader returned undefined
  useEffect(() => {
    if (loaderData?.data) {
      setExpert(loaderData.data);
      setIsResolving(false);
      return;
    }

    if (id) {
      setIsResolving(true);
      network
        .get(`/experts/${id}`)
        .then((res) => {
          if (res.data) {
            setExpert(resolveExpertPersona(res.data));
            setErrorNotFound(false);
          } else {
            setErrorNotFound(true);
          }
        })
        .catch(() => {
          setErrorNotFound(true);
        })
        .finally(() => {
          setIsResolving(false);
        });
    } else {
      setIsResolving(false);
      setErrorNotFound(true);
    }
  }, [loaderData, id]);

  const {
    messages,
    setMessages,
    isLoading,
    setConversationId,
    setPersonaId,
  } = useExpertChatStore();
  const {
    callStatus,
    liveTranscript,
    errorMessage: callError,
  } = useExpertTalkStore();
  const { startCall, endCall, interruptAi, mediaStreamRef } = useExpertTalk(expert);
  const { sendMessage } = useChatActions(expert);
  const groupedLiveTranscript = useMemo(
    () => groupAdjacentTranscripts(liveTranscript),
    [liveTranscript],
  );

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState<string | null>(null);
  const [loadingVoiceMessageId, setLoadingVoiceMessageId] = useState<string | null>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopChatVoice = useCallback(() => {
    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current.removeAttribute('src');
      chatAudioRef.current.load();
      chatAudioRef.current = null;
    }
    setActiveVoiceMessageId(null);
    setLoadingVoiceMessageId(null);
  }, []);

  const handleToggleVoice = useCallback(
    async (msgId: string, text: string) => {
      if (activeVoiceMessageId === msgId) {
        stopChatVoice();
        return;
      }

      stopChatVoice();
      if (!expert || !text.trim()) return;

      setLoadingVoiceMessageId(msgId);
      try {
        const res = await network.post<{ audio: string; mimeType: string }>(
          '/chat/tts',
          {
            text,
            personaId: expert.id,
          },
        );

        if (res.data?.audio) {
          const audio = new Audio(
            `data:${res.data.mimeType || 'audio/wav'};base64,${res.data.audio}`,
          );
          chatAudioRef.current = audio;
          setActiveVoiceMessageId(msgId);
          setLoadingVoiceMessageId(null);

          audio.onended = () => {
            chatAudioRef.current = null;
            setActiveVoiceMessageId(null);
          };
          audio.onerror = () => {
            chatAudioRef.current = null;
            setActiveVoiceMessageId(null);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('Gagal memutar suara persona:', err);
      } finally {
        setLoadingVoiceMessageId(null);
      }
    },
    [activeVoiceMessageId, expert, stopChatVoice],
  );

  useEffect(() => {
    return () => {
      stopChatVoice();
    };
  }, [stopChatVoice]);

  // Chrome remembers microphone permission per origin. If it is already granted,
  // continue automatically; only show the permission action on the first use.
  useEffect(() => {
    const shouldCall =
      searchParams.get('call') === 'true' || searchParams.get('call') === '1';
    if (
      shouldCall &&
      expert &&
      !autoCallTriggered.current &&
      callStatus === CallStatusEnum.IDLE
    ) {
      autoCallTriggered.current = true;
      const continueCall = async (): Promise<void> => {
        try {
          const permission = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });
          if (permission.state === 'granted') {
            await startCall({ allowWithoutGesture: true });
            return;
          }
        } catch {
          // Safari lama belum menyediakan Permissions API untuk mikrofon.
        }
        setShowCallPrompt(true);
      };
      void continueCall();
    }
  }, [expert, searchParams, callStatus, startCall]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }

    const handlePopState = () => {
      if (callStatus === CallStatusEnum.ACTIVE) {
        void endCall();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return (): void => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [messages, isLoading, liveTranscript, callStatus, endCall]);

  const buildWelcomeMessage = useCallback((): ChatMessage[] => {
    if (!expert) return [];
    const greeting = expert.greeting || `Selamat datang, saya ${expert.name}.`;
    const topics = expert.specialties.slice(0, 3).join(', ')
      || `budaya ${expert.suku || 'Nusantara'}`;

    return [{
      sender: 'ai',
      text: `${greeting}\n\nSaya dapat membantu menjawab pertanyaan seputar ${topics}. Apa yang ingin Anda pelajari hari ini?`,
      timestamp: dayjs().format(),
      id: v1(),
    }];
  }, [expert]);

  // Restore server-owned history so text chat and voice call share one context.
  useEffect(() => {
    if (!expert) return undefined;
    let cancelled = false;
    const storageKey = `katanusa:conversation:${expert.id}`;
    const storedConversationId = sessionStorage.getItem(storageKey);

    setPersonaId(expert.id);
    setConversationId(storedConversationId);
    setHistoryLoadError(null);

    if (!storedConversationId) {
      setMessages(buildWelcomeMessage());
      return undefined;
    }

    setMessages([]);
    setIsHistoryLoading(true);
    void network.get<{
      conversation: { persona_profile_id: string };
      messages: ChatMessage[];
    }>(`/chat/conversations/${storedConversationId}`).then((response) => {
      if (cancelled) return;
      if (response.data.conversation.persona_profile_id !== expert.id) {
        throw new Error('Percakapan tidak sesuai dengan AI persona yang dipilih.');
      }
      setConversationId(storedConversationId);
      setMessages(
        response.data.messages.length > 0
          ? response.data.messages
          : buildWelcomeMessage(),
      );
    }).catch(() => {
      if (cancelled) return;
      sessionStorage.removeItem(storageKey);
      setConversationId(null);
      setMessages(buildWelcomeMessage());
      setHistoryLoadError(
        'Riwayat lama tidak dapat dimuat. Percakapan baru akan dimulai.',
      );
    }).finally(() => {
      if (!cancelled) setIsHistoryLoading(false);
    });

    return (): void => {
      cancelled = true;
    };
  }, [buildWelcomeMessage, expert, setConversationId, setMessages, setPersonaId]);

  if (isResolving) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 font-medium text-sm">Menghubungkan ke Pakar Budaya...</p>
      </div>
    );
  }

  if (errorNotFound || !expert) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Pakar Budaya Tidak Ditemukan</h3>
        <p className="text-xs text-gray-600">
          Profil pakar yang Anda tuju tidak ditemukan atau belum diverifikasi oleh Dewan Kurator Adat.
        </p>
        <button
          type="button"
          onClick={() => navigate('/experts')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full transition cursor-pointer"
        >
          Kembali ke Para Pakar
        </button>
      </div>
    );
  }

  const conversationStarters = [
    `Apa yang perlu saya ketahui tentang ${expert.specialties[0] || `budaya ${expert.suku || 'Nusantara'}`}?`,
    `Ceritakan tradisi penting dari ${expert.suku || 'daerah ini'}.`,
    `Bagaimana generasi muda dapat ikut melestarikannya?`,
  ];

  return (
    <div
      className="flex w-full min-h-0 flex-col overflow-hidden bg-[#F8F2E7]"
      style={{ height: 'calc(100dvh - 80px)' }}
    >
      <ChatHeader
        expert={expert}
        status={
          callStatus === CallStatusEnum.CONNECTING
            ? 'Menghubungkan...'
            : 'Online'
        }
        startCall={startCall}
        onClose={() => {
          void endCall();
          const targetId = id || expert?.id;
          if (targetId) {
            navigate(`/experts/${targetId}`);
          } else {
            navigate('/experts');
          }
        }}
      />

      {showCallPrompt && callStatus === CallStatusEnum.IDLE && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div
            className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            role="dialog"
            aria-label="Konfirmasi panggilan suara"
          >
            <div>
              <p className="text-sm font-bold text-[#1E315A]">
                Siap memulai panggilan suara dengan {expert.name}?
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Browser akan meminta izin mikrofon. Suara hanya dipakai selama panggilan aktif.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setShowCallPrompt(false)}
                className="rounded-full border border-[#1E315A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E315A] hover:bg-slate-50"
              >
                Nanti saja
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCallPrompt(false);
                  void startCall();
                }}
                className="rounded-full bg-[#1E315A] px-4 py-2 text-sm font-bold text-white hover:bg-[#294273]"
              >
                Izinkan mikrofon &amp; mulai
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="relative min-h-0 flex-1 overscroll-contain overflow-y-auto bg-[#F8F2E7] px-3 py-5 scroll-smooth sm:px-6 sm:py-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[url('/assets/bg-pattern.webp')] bg-contain bg-repeat opacity-[0.025]" />

        <div className="relative mx-auto max-w-4xl">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              isUser={msg.sender === 'user'}
              avatarUrl={msg.sender === 'ai' ? expert?.image : undefined}
              additional={msg.additional}
              onOptionClick={sendMessage}
              onSpeak={
                msg.sender === 'ai'
                  ? () => void handleToggleVoice(msg.id, msg.text)
                  : undefined
              }
              isPlayingVoice={activeVoiceMessageId === msg.id}
              isLoadingVoice={loadingVoiceMessageId === msg.id}
            />
          ))}

          {messages.length === 1 && !isHistoryLoading && !isLoading && (
            <div className="ml-0 mt-1 flex flex-wrap gap-2 sm:ml-12">
              {conversationStarters.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  className="min-h-11 rounded-full border border-[#1E315A]/15 bg-transparent px-3.5 py-2 text-left text-xs font-medium leading-5 text-[#1E315A]/75 transition hover:border-amber-600/40 hover:bg-amber-50 hover:text-[#1E315A]"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {groupedLiveTranscript.map((msg: TranscriptEntry) => (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              isUser={msg.speaker === 'user'}
              avatarUrl={msg.speaker === 'ai' ? expert?.image : undefined}
            />
          ))}

          {(historyLoadError || (callError && callStatus === CallStatusEnum.IDLE)) && (
            <div className="mx-auto mb-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">
              {historyLoadError || callError}
            </div>
          )}

          {isHistoryLoading && (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">
              Memuat riwayat percakapan...
            </div>
          )}

          {isLoading && (
            <div className="flex items-end justify-start gap-3 pl-12">
              <div className="flex items-center space-x-2 rounded-2xl rounded-tl-sm border border-[#1E315A]/10 bg-white px-4 py-3 text-slate-800 shadow-sm">
                <span className="block h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.3s]" />
                <span className="block h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.15s]" />
                <span className="block h-2 w-2 animate-bounce rounded-full bg-amber-500" />
              </div>
            </div>
          )}

        </div>
      </div>

      {callStatus === CallStatusEnum.IDLE ? (
        <ChatInput expert={expert} />
      ) : (
        <TalkEnd
          expert={expert}
          endCall={endCall}
          interruptAi={interruptAi}
          mediaStreamRef={mediaStreamRef}
        />
      )}
    </div>
  );
};

export default ChatWindow;
