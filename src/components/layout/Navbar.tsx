import { Menu, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import auth from '../../libs/auth';
import { cn } from '../../libs/utils';
// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../svgs/logo-katanusa-white.svg?react';
// @ts-expect-error - SVG import
import LogoKataNusa from '../svgs/logo-katanusa.svg?react';
import Button from '../ui/Button';
import AuthenticatedButton from './AuthenticatedButton';

interface NavbarProps {
  isWhite?: boolean;
  mobileOnDark?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isWhite = false, mobileOnDark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mobileMenuId = useId();
  const hasAuthenticatedUser = auth.isAuthenticated();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div
        className={cn(
          'max-w-5xl md:max-w-7xl py-5 md:py-6 mx-auto flex justify-between items-center text-black px-4 md:px-6 xl:px-0',
          {
            'text-white': isWhite,
            'text-white md:text-black': mobileOnDark && !isWhite,
          },
        )}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="KataNusa — kembali ke beranda"
          className="text-2xl font-bold font-serif tracking-wide"
        >
          {isWhite ? (
            <LogoKataNusaWhite />
          ) : mobileOnDark ? (
            <>
              <LogoKataNusaWhite className="md:hidden" />
              <LogoKataNusa className="hidden md:block" />
            </>
          ) : (
            <LogoKataNusa />
          )}
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={isOpen}
          aria-controls={mobileMenuId}
        >
          {isOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>

        {/* Navigation Links */}
        <div
          id={mobileMenuId}
          className={`${
            isOpen ? 'flex' : 'hidden'
          } md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto max-h-[calc(100dvh-5rem)] overflow-y-auto md:overflow-visible bg-white md:bg-transparent p-4 md:p-0 shadow-lg md:shadow-none gap-1 md:gap-0 md:space-x-8 items-stretch md:items-center z-50 text-[#1E315A] md:text-current`}
        >
          <Link to="/" className="min-h-11 flex items-center justify-center md:min-h-0 hover:text-red-600 md:hover:text-gray-300 transition">
            Beranda
          </Link>
          <Link to="/experts" className="min-h-11 flex items-center justify-center md:min-h-0 hover:text-red-600 md:hover:text-gray-300 transition">
            Para Pakar
          </Link>
          <Link to="/about" className="min-h-11 flex items-center justify-center md:min-h-0 hover:text-red-600 md:hover:text-gray-300 transition">
            Tentang Kami
          </Link>

          {/* Auth Buttons Mobile */}
          <div className="flex md:hidden flex-col gap-2 w-full items-stretch border-t border-slate-100 pt-3 mt-2">
            {hasAuthenticatedUser ? (
              <>
                <Link to="/dashboard" className="flex min-h-11 items-center justify-center font-semibold">
                  Buka Dashboard
                </Link>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-red-200 font-semibold text-red-700"
                  onClick={async () => {
                    await auth.logout();
                    navigate('/auth/login');
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="flex min-h-11 items-center justify-center font-medium">
                  Masuk
                </Link>
                <Button
                  variant="outline"
                  className="min-h-11 w-full border-[#1E315A]/30 px-6 py-2 text-[#1E315A]"
                  onClick={() => navigate('/auth/signup')}
                >
                  Daftar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Auth Buttons Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {hasAuthenticatedUser ? (
            <AuthenticatedButton />
          ) : (
            <>
              <Link
                to="/auth/login"
                className="hover:text-gray-300 font-medium"
              >
                Masuk
              </Link>
              <Button
                variant="outline"
                className={cn('px-6 py-1.5 border-black/50 text-black', {
                  'text-white border-white': isWhite,
                })}
                onClick={() => navigate('/auth/signup')}
              >
                Daftar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
