import { Mail, MapPin } from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router';
import {
  BungaMelatiIcon,
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../icons/NusantaraIcons';
// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../svgs/logo-katanusa-white.svg?react';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#0d172a] text-white border-t border-white/10 overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      {/* Main Footer Content */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand & Mission (Spans 2 columns on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link to="/" aria-label="KataNusa — kembali ke beranda" className="inline-block">
              <LogoKataNusaWhite className="h-9 w-auto" />
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Platform kecerdasan buatan dan jaringan konsultasi pakar untuk pelestarian, dokumentasi, dan edukasi kebudayaan Nusantara secara valid, beretika, dan berdampak nyata bagi para penjaga tradisi.
            </p>

            {/* Contact Micro-Info */}
            <div className="flex flex-col gap-2 pt-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span>Nusantara, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400 shrink-0" />
                <a href="mailto:halo@katanusa.id" className="hover:text-white transition-colors">
                  halo@katanusa.id
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Eksplorasi Platform - Surya Majapahit */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-white/90 flex items-center gap-2">
              <SuryaMajapahitIcon className="w-4 h-4 text-amber-400" />
              Eksplorasi
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <li>
                <Link to="/experts" className="hover:text-white transition-colors">
                  Jelajahi Pakar Budaya
                </Link>
              </li>
              <li>
                <Link to="/experts" className="hover:text-white transition-colors">
                  Tanya AI Persona Budaya
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Tentang KataNusa
                </Link>
              </li>
              <li>
                <Link to="/booking-history" className="hover:text-white transition-colors">
                  Jadwal Sesi Konsultasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Program & Komunitas - Mandala Kawung */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-white/90 flex items-center gap-2">
              <MandalaKawungIcon className="w-4 h-4 text-amber-300" />
              Ekosistem
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <li>
                <Link to="/auth/signup" className="hover:text-white transition-colors">
                  Daftar Mitra Budayawan
                </Link>
              </li>
              <li>
                <span className="text-gray-300">AI Persona Budaya Komunitas</span>
              </li>
              <li>
                <span className="text-gray-300">Warisan Budaya Takbenda</span>
              </li>
              <li>
                <span className="text-gray-300">Nusantaranomics &amp; Tradisi</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Keamanan & Tata Kelola - Perisai Talawang */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-white/90 flex items-center gap-2">
              <PerisaiTalawangIcon className="w-4 h-4 text-emerald-400" />
              Keamanan
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <li>
                <span className="text-gray-300">Verifikasi Pakar Resmi</span>
              </li>
              <li>
                <span className="text-gray-300">Pembayaran Terenkripsi</span>
              </li>
              <li>
                <span className="text-gray-300">Etika AI &amp; Transparansi</span>
              </li>
              <li>
                <span className="text-gray-300">Perlindungan Hak Cipta</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} KataNusa Indonesia. Seluruh hak cipta dilindungi undang-undang.
          </div>

          <div className="flex items-center gap-1.5 text-gray-400">
            <span>Didedikasikan untuk Pelestarian Kebudayaan Nusantara</span>
            <BungaMelatiIcon className="w-3.5 h-3.5 text-amber-400 inline-block" />
          </div>

          <div className="flex items-center gap-5">
            <span className="hover:text-gray-200 transition-colors cursor-pointer">
              Kebijakan Privasi
            </span>
            <span>&bull;</span>
            <span className="hover:text-gray-200 transition-colors cursor-pointer">
              Syarat &amp; Ketentuan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
