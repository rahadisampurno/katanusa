import { User } from 'lucide-react';
import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useRevalidator } from 'react-router';
import auth from '../../libs/auth';
import useAiTokenStore from '../../stores/useAiTokenStore';
import { SuryaMajapahitIcon } from '../icons/NusantaraIcons';

const AuthenticatedButton: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { revalidate } = useRevalidator();
  const { aiToken } = useAiTokenStore();

  const buttonRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={buttonRef} className="relative text-sm">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={showDropdown}
        className="flex cursor-pointer items-center justify-center gap-5 rounded-2xl border bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-500/70"
        onClick={() => setShowDropdown((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <User className="h-4 w-4" aria-hidden="true" />
          <span>{auth.getUserData()?.user_metadata?.name ?? auth.getUserData()?.name}</span>
        </span>
        <span className="flex items-center gap-2 font-bold text-amber-500" title="Kearifan Token">
          <span>{aiToken}</span>
          <SuryaMajapahitIcon className="h-4 w-4" />
        </span>
      </button>
      {showDropdown && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-3 min-w-48 overflow-hidden rounded-2xl bg-white shadow-lg"
        >
          <div className="flex flex-col">
            <Link
              to="/dashboard"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
              className="hover:bg-gray-50 text-gray-700 transition p-4 rounded-t-2xl"
            >
              Dashboard Saya
            </Link>
            <Link
              to="/dashboard/konsultasi"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
              className="p-4 text-gray-700 transition hover:bg-gray-50"
            >
              Booking Saya
            </Link>
            <div className="border-t border-gray-700/10"></div>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setShowDropdown(false);
                await auth.logout();
                revalidate();
                navigate('/auth/login');
              }}
              className="text-red-500 hover:text-red-500/70 transition cursor-pointer p-4 rounded-b-2xl"
            >
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticatedButton;
