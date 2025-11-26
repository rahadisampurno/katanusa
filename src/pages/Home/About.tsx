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
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-0 py-24 md:py-32 flex flex-col items-center text-center">
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
            <Button variant="outline" className="px-6" onClick={() => navigate('/signup')}>
              Gabung sebagai Mitra Pakar
            </Button>
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-[#1E315A]">
        <div className="max-w-7xl mx-auto px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
        <div className="max-w-7xl mx-auto px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Pendekatan Kami</h2>
            <div className="space-y-4 text-white/90">
              <p>
                • AI Pakar Budaya: Persona digital yang “belajar” dari data terkurasi dan referensi pakar nyata,
                sehingga jawaban relevan, ringkas, dan akurat.
              </p>
              <p>
                • Konsultasi dengan Pakar: Sesi berbayar yang menghubungkan Anda langsung dengan Budayawan terverifikasi
                untuk wawasan mendalam dan kontekstual.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img alt="pakar-1" src="/assets/pakar-nyata/sujiwo-tejo.png" className="rounded-xl shadow-lg" />
            <img alt="pakar-2" src="/assets/pakar-nyata/prof-juhaeri-muchtar.png" className="rounded-xl shadow-lg" />
            <img alt="pakar-3" src="/assets/pakar-nyata/pak-hawe.png" className="rounded-xl shadow-lg" />
            <img alt="pakar-4" src="/assets/pakar-nyata/didin-s-damanhuri.png" className="rounded-xl shadow-lg" />
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-[#1E315A]">
        <div className="max-w-7xl mx-auto px-4 md:px-0">
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
        <Link to="/signup" className="w-full">
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