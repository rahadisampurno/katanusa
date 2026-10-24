import { ArrowLeft, Phone } from 'lucide-react';
import type { Expert } from '../../types/expert.ts';
import { SuryaMajapahitIcon } from '../icons/NusantaraIcons';

interface ChatHeaderProps {
  expert: Expert;
  status: string;
  onClose?: () => void;
  startCall: () => Promise<void | null>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  expert,
  status,
  onClose,
  startCall,
}) => {
  return (
    <header className="border-b border-[#1E315A]/10 bg-[#F8F2E7]/95 px-3 py-2.5 text-[#1E315A] backdrop-blur sm:px-6 sm:py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Kembali ke profil persona"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1E315A]/55 transition hover:bg-[#1E315A]/5 hover:text-[#1E315A]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative shrink-0">
            <img
              src={expert.image}
              alt={expert.name}
              className="h-10 w-10 rounded-full border border-amber-500/40 object-cover"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#F8F2E7] bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate font-itim text-lg sm:text-xl">
                {expert.name}
              </h1>
              {expert.isAi && (
                <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:inline-flex">
                  <SuryaMajapahitIcon className="h-4 w-4" />
                  AI Persona Budaya
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#1E315A]/50">
              <span className="text-emerald-700">{status}</span>
              <span aria-hidden="true">•</span>
              <span className="truncate">{expert.role}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Mulai panggilan suara dengan ${expert.name}`}
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#1E315A]/70 transition hover:bg-[#1E315A]/5 hover:text-[#1E315A] sm:px-4"
          onClick={async () => {
            await startCall();
          }}
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Panggilan suara</span>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
