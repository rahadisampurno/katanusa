import { Phone, X } from 'lucide-react';
import type { Expert } from '../../types/expert.ts';

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
    <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100 rounded-t-3xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={expert.image}
            alt={expert.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {/* Online Indicator */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg">{expert.name}</h3>
            {expert.isAi && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-600 text-white">
                PAKAR VIRTUAL
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {status} • {expert.role}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          onClick={async () => {
            await startCall();
          }}
        >
          <Phone className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <X className="w-6 h-6 text-gray-900" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
