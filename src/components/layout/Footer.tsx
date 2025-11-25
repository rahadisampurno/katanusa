// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../svgs/logo-katanusa-white.svg?react';

const Footer: React.FC = () => {
  return (
    <footer className="relative py-8 px-4 bg-[#1E315A]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20 text-white">
        <div className="flex flex-col gap-2">
          <LogoKataNusaWhite />
          <div>Semua bisa belajar dari para pakar.</div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-bold">Link Utama</h1>
          <ul className="flex flex-col gap-2">
            <li>Cari pakar</li>
            <li>Tentang Kami</li>
            <li>Daftar sebagai mitra pakar</li>
          </ul>
        </div>
        <div>
          <h1 className="font-bold">Tim Balad Wisesa</h1>
          <ul className="flex flex-col gap-2">
            <li>Dena Hadianto (Ketua)</li>
            <li>Muhammad Agung Rizkyana</li>
            <li>Rahadi Sampurno</li>
            <li>Danu Ega Pratama</li>
            <li>Anisa Rahma</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
