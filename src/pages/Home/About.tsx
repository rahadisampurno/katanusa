import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';

const About = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <main className="bg-[#1E315A]">
      <section className="relative min-h-[60vh] overflow-hidden">
        <Navbar isWhite />
        <div className="absolute inset-0 bg-cover opacity-15 bg-[url('/assets/bg-experts-header.png')] pointer-events-none"></div>
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6 md:py-32 xl:px-0">
          <h1 className="text-3xl md:text-5xl font-itim text-white mb-4">Tentang Katanusa</h1>
          <p className="text-white/90 max-w-2xl leading-relaxed">
            Katanusa adalah platform belajar budaya Indonesia melalui AI Pakar Budaya dan konsultasi langsung
            dengan Budayawan terverifikasi. Misi kami: membuat pengetahuan budaya jadi mudah diakses, akurat,
            dan berdampak bagi para penjaga tradisi.
          </p>
          <div className="mt-8 flex gap-3">
            <Button variant="primary" className="px-6" onClick={() => navigate('/experts')}>
              Jelajahi Pakar Budaya
            </Button>
            <Button variant="outline" className="px-6" onClick={() => navigate('/auth/signup')}>
              Gabung sebagai Mitra Pakar
            </Button>
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-[#1E315A]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:px-6 xl:px-0">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Visi & Misi</h2>
            <ul className="space-y-3 text-white/90">
              <li>• Mempermudah akses pengetahuan budaya yang tervalidasi.</li>
              <li>• Menghubungkan masyarakat dengan Budayawan untuk pembelajaran mendalam.</li>
              <li>• Mengapresiasi dan menyejahterakan para penjaga tradisi.</li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-6">
            <img
              alt="ai-group"
              src="/assets/icon-ai-group.webp"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-[#132346]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-4 md:grid-cols-2 md:px-6 xl:px-0">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Pendekatan Kami</h2>
            <div className="space-y-4 text-white/90">
              <p>
                • AI Pakar Budaya: Persona digital yang menggunakan sumber terkurasi,
                memiliki provenance, dan hanya aktif saat konsen pemilik hak masih berlaku.
              </p>
              <p>
                • Bimbingan Bersama Pakar &amp; Maestro: Ruang dialog langsung bersama Budayawan terverifikasi untuk mendalami sastra tutur, bahasa daerah, dan kearifan tradisi Nusantara dengan dukungan apresiasi pelestarian sanggar.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img alt="Persona AI budaya Aceh" src="/assets/pakar-virtual/10-teungku-meurah.webp" className="rounded-xl shadow-lg" loading="lazy" />
            <img alt="Persona AI budaya Bali" src="/assets/pakar-virtual/11-bli-komang.webp" className="rounded-xl shadow-lg" loading="lazy" />
            <img alt="Persona AI budaya Maluku" src="/assets/pakar-virtual/12-bung-kapitan.webp" className="rounded-xl shadow-lg" loading="lazy" />
            <img alt="Persona AI budaya Papua" src="/assets/pakar-virtual/13-pace-mambri.webp" className="rounded-xl shadow-lg" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-[#1E315A]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 xl:px-0">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Nilai-Nilai yang Kami Junjung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-white">
              <h3 className="text-xl font-bold mb-2">Valid</h3>
              <p className="text-white/90">Konten AI disusun dari sumber-sumber yang divalidasi oleh pakar budaya.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-white">
              <h3 className="text-xl font-bold mb-2">Ramah</h3>
              <p className="text-white/90">Bahasa lugas, mudah dipahami, dan empatik untuk semua kalangan.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 text-white">
              <h3 className="text-xl font-bold mb-2">Berdampak</h3>
              <p className="text-white/90">Setiap interaksi turut mengapresiasi dan mendukung para Budayawan.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[40vh] bg-[#132346] flex items-center">
        <Link to="/auth/signup" className="w-full">
          <img
            alt="join-as-partner"
            src="/assets/bg-join-as-partner.webp"
            className="block w-full h-72 object-contain"
          />
        </Link>
      </section>

      <Footer />
    </main>
  );
};

export default About;
