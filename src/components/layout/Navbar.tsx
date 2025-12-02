import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
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
}

const Navbar: React.FC<NavbarProps> = ({ isWhite = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div
        className={cn(
          'max-w-5xl md:max-w-7xl py-6 mx-auto flex justify-between items-center text-black px-4 md:px-0',
          {
            'text-white': isWhite,
          },
        )}
      >
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold font-serif tracking-wide">
          {isWhite ? <LogoKataNusaWhite /> : <LogoKataNusa />}
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-0.5 bg-black mb-1"></div>
          <div className="w-6 h-0.5 bg-black mb-1"></div>
          <div className="w-6 h-0.5 bg-black"></div>
        </button>

        {/* Navigation Links */}
        <div
          className={`${
            isOpen ? 'flex' : 'hidden'
          } md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 shadow-lg md:shadow-none space-y-4 md:space-y-0 md:space-x-8 items-center z-50`}
        >
          <Link to="/" className="hover:text-gray-300 transition">
            Beranda
          </Link>
          <Link to="/experts" className="hover:text-gray-300 transition">
            Para Pakar
          </Link>
          <Link to="/about" className="hover:text-gray-300 transition">
            Tentang Kami
          </Link>

          {/* Auth Buttons Mobile */}
          <div className="flex md:hidden flex-col gap-4 w-full items-center">
            <Link to="/auth/login" className="hover:text-gray-300 font-medium">
              Masuk
            </Link>
            <Button
              variant="outline"
              className={cn('px-6 py-1.5 border-black/50 text-black w-full', {
                'text-white border-white': isWhite,
              })}
            >
              Daftar
            </Button>
          </div>
        </div>

        {/* Auth Buttons Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {auth.isAuthenticated() ? (
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
