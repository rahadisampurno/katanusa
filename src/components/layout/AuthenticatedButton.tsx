import { Sparkles, User } from 'lucide-react';
import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useRevalidator } from 'react-router';
import auth from '../../libs/auth';
import useAiTokenStore from '../../stores/useAiTokenStore';

const AuthenticatedButton: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { revalidate } = useRevalidator();
  const { aiToken } = useAiTokenStore();

  const buttonRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener('click', () => {});
  }, [buttonRef]);

  return (
    <div
      ref={buttonRef}
      role="button"
      className="relative border text-white text-sm rounded-2xl flex justify-center items-center gap-5 px-4 py-2 cursor-pointer bg-blue-500 hover:bg-blue-500/70 transition-colors"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      <div className="flex items-center gap-2">
        <User className="w-4 h-4" />
        <span>{auth.getUserData()?.user_metadata?.name}</span>
      </div>
      <div className="flex items-center gap-2 text-amber-500 font-bold">
        <span className="inline-block">{aiToken}</span>
        <Sparkles className="w-4 h-4" />
      </div>
      {showDropdown && (
        <div className="absolute right-0 translate-y-3 rounded-2xl top-full w-full bg-white shadow-lg z-50">
          <div className="flex flex-col">
            <Link
              to="/booking-history"
              className="hover:bg-gray-50 text-gray-700 transition p-4 rounded-t-2xl"
            >
              Booking Saya
            </Link>
            {auth.getUserData()?.user_metadata?.role === 'pakar' ? (
              <Link
                to="/dashboard"
                className="hover:bg-gray-50 text-gray-700 transition p-4"
              >
                Dashboard
              </Link>
            ) : null}
            <div className="border-t border-gray-700/10"></div>
            <button
              onClick={() => {
                auth.logout();
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
