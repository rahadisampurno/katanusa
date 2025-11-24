import type { JSX } from 'react';
import { Link } from 'react-router';
// @ts-expect-error
import LogoKataNusa from '../svgs/logo-katanusa.svg?react';
import Button from '../ui/Button';

const Navbar = (): JSX.Element => {
  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div className="max-w-5xl md:max-w-7xl py-6 mx-auto flex justify-between items-center text-black">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold font-serif tracking-wide">
          <LogoKataNusa />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <Link to="/" className="hover:text-gray-300 transition">
            Beranda
          </Link>
          <Link to="/experts" className="hover:text-gray-300 transition">
            Para Pakar
          </Link>
          <Link to="/about" className="hover:text-gray-300 transition">
            Tentang Kami
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <Link to="/login" className="hover:text-gray-300 font-medium">
            Masuk
          </Link>
          <Button
            variant="outline"
            className="px-6 py-1.5 border-black/50 text-black"
          >
            Daftar
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
