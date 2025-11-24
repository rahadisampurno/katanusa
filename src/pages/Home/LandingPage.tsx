import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import ExpertImage from '../../components/experts/ExpertImage';
import Navbar from '../../components/layout/Navbar';
// @ts-expect-error
import LogoKataNusaWhite from '../../components/svgs/logo-katanusa-white.svg?react';
import Button from '../../components/ui/Button';
import { experts } from '../../data/experts';

const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <main className="bg-[#1E315A]">
      <section className="relative min-h-screen bg-white bg-cover bg-center bg-no-repeat bg-[url('https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-utama.webp')] overflow-hidden">
        <Navbar />
        <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-60vh)] text-center px-4 pt-24">
          <h1 className="text-2xl md:text-5xl font-itim max-w-4xl leading-tight mb-6 text-black">
            Jelajahi Kekayaan Budaya Indonesia, Semudah Mengirim Pesan.
          </h1>

          <p className="text-black text-lg max-w-2xl mb-10 leading-relaxed">
            Tanya jawab seputar budaya Indonesia secara valid dengan AI Pakar
            Budaya, atau konsultasi langsung dengan Pakar Budaya asli.
          </p>

          <div className="flex justify-between gap-3 items-center">
            <Button
              type="button"
              onClick={() => navigate('/experts')}
              variant="primary"
              className="text-lg px-8 py-3 shadow-xl hover:scale-105 transform"
            >
              Jelajahi Pakar Budaya
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[13.6875rem] bg-gradient-to-b from-transparent to-[#1E315A]"></div>
      </section>
      {/* kenapa-harus-katanusa? */}
      <section className="relative min-h-[50vh] bg-[#1E315A] overflow-hidden">
        <img
          alt="bg-why-katanusa"
          src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-why-katanusa.png"
          className="w-[48.75rem] object-contain absolute bottom-0 left-0"
        />
        <div className="flex justify-between min-h-[50vh]">
          <div className="flex-1 flex flex-col items-center justify-between">
            <h1 className="text-white text-2xl md:text-5xl font-itim pt-20 w-[20rem]">
              Kenapa Harus Katanusa?
            </h1>
          </div>
          <div className="flex-1 flex flex-col gap-6 text-white py-12">
            <div className="flex flex-row gap-6 items-center w-[35rem]">
              <img
                alt="bye-info-hoax"
                className="block w-52 h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-bye-info-hoax.png"
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold">Bye-bye Info Hoax</h3>
                <p>
                  Pernah bingung karena info budaya di Google beda-beda? Di
                  sini, AI hanya bicara sesuai data yang sudah divalidasi para
                  pakar budaya.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center w-[35rem]">
              <img
                alt="lebih-dari-sekadar-chatbot"
                className="block w-52 h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-lebih-dari-sekadar-chatbot.png"
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold">
                  Lebih dari Sekadar Chatbot
                </h3>
                <p>
                  AI kami bukan robot kaku. Dia belajar langsung dari catatan
                  dan wawancara para ahli budaya. Jawabannya nyambung dan
                  berbobot.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center w-[35rem]">
              <img
                alt="apresiasi"
                className="block w-52 h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-apresiasi-untuk-penjaga-tradisi.png"
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold">
                  Apresiasi untuk Penjaga Tradisi
                </h3>
                <p>
                  Setiap sesi konsultasi yang kamu pesan adalah bentuk dukungan
                  nyata agar para Budayawan tetap sejahtera dan berkarya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* kenapa-harus-katanusa? */}

      {/* temui-pakar-budaya */}
      <section className="relative min-h-[50vh]">
        <img
          alt="bg-ai-group"
          className="w-full h-full object-contain inset-0 z-0 -translate-y-4"
          src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-ai-group.webp"
        />
        <div className="z-10 absolute top-0 left-0 right-0 bottom-0 gap-12 flex justify-center items-center min-h-[50vh]">
          <img
            alt="ai-group"
            src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-ai-group.webp"
            className="w-[35rem] block"
          />

          <div className="flex flex-col items-start justify-start gap-6 w-[35rem]">
            <h1 className="text-2xl md:text-5xl font-itim pt-20">
              Temui AI Pakar Budaya
            </h1>
            <p>
              Belajar budaya lewat chat atau suara. Rasakan pengalaman bertanya
              pada "Persona Digital" Pakar Budaya virtual.
            </p>
            <Button
              type="button"
              onClick={() => navigate('/experts')}
              variant="primary"
              className="text-lg px-8 py-3 shadow-xl hover:scale-105 transform"
            >
              Coba AI Pakar Budaya
            </Button>
          </div>
        </div>
      </section>
      {/* temui-pakar-budaya */}

      {/* belajar-langsung-dari-pakarnya */}
      <section className="relative flex flex-col gap-12 justify-center items-center min-h-[85vh] bg-[#1E315A]">
        <div className="absolute w-full min-h-[85vh] z-10 flex flex-col gap-12 justify-center items-center pb-8">
          <div className="text-white flex flex-col items-center justify-center gap-6">
            <h1 className="text-2xl md:text-5xl font-itim pt-20 ">
              Belajar Langsung dari Pakarnya
            </h1>
            <p className="w-160 text-center">
              AI kami hanyalah pembuka jalan. Dapatkan wawasan mendalam melalui
              sesi konsultasi, workshop, atau diskusi privat dengan Pakar
              Budayawan terverifikasi.
            </p>
          </div>
          <div className="flex flex-row gap-6">
            {experts
              .filter((expert) => !(expert.isAi ?? false))
              .map((expert) => (
                <ExpertImage
                  key={expert.id}
                  alt={expert.name}
                  image={expert.image}
                  name={expert.name}
                  caption={expert.role}
                  isAi={expert.isAi ?? false}
                />
              ))}
          </div>
          <Button
            type="button"
            onClick={() => navigate('/experts')}
            variant="primary"
            className="text-lg px-8 py-3 shadow-xl hover:scale-105 transform"
          >
            Lihat semua pakar
          </Button>
        </div>
        <div className="w-full h-50 bg-[url('https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-pattern.webp')] absolute bg-repeat bg-contain block bottom-0 left-0 z-0" />
      </section>
      {/* belajar-langsung-dari-pakarnya */}
      {/* gabung-sebagai-mitra  */}
      <section className="relative min-h-[50vh] bg-[#132346] flex justify-center items-center pb-12">
        <a href="#" className="cursor-pointer">
          <img
            alt="join-as-partner"
            src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-join-as-partner.webp"
            className="block w-full h-72 object-contain"
          />
        </a>
      </section>
      {/* gabung-sebagai-mitra */}
      <footer className="relative py-8">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-3 gap-20 text-white">
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
    </main>
  );
};

export default LandingPage;
