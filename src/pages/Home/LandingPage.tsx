import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import ExpertImage from '../../components/experts/ExpertImage';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
// @ts-expect-error - SVG import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LogoKataNusaWhite from '../../components/svgs/logo-katanusa-white.svg?react';
import Button from '../../components/ui/Button';
import { experts } from '../../data/experts';

const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <main className="bg-[#1E315A]">
      <section className="relative min-h-screen bg-transparent overflow-hidden">
        <Navbar />
        <img
          alt="bg-utama"
          src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-utama.webp"
          className="w-full h-full object-cover hidden md:block"
        />
        <div className="absolute z-5 top-0 left-0 right-0 bottom-0">
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 md:px-0 pb-12">
            <h1 className="text-3xl md:text-5xl font-itim max-w-4xl leading-tight mb-6 text-white md:text-black">
              Jelajahi Kekayaan Budaya Indonesia, Semudah Mengirim Pesan.
            </h1>

            <p className="text-white md:text-black text-lg max-w-2xl mb-10 leading-relaxed">
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
        </div>

        <div className="absolute top-0 left-0 right-0 h-0 md:h-54.75 bg-linear-to-b from-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-0 md:h-54.75 bg-linear-to-b from-transparent to-[#1E315A]"></div>
      </section>
      {/* kenapa-harus-katanusa? */}
      <section className="relative min-h-[50vh] bg-[#1E315A] overflow-hidden">
        <img
          alt="bg-why-katanusa"
          src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-why-katanusa.png"
          className="w-195 object-contain relative md:absolute md:bottom-0 md:left-0"
        />
        <div className="flex flex-col md:flex-row justify-between min-h-[50vh] relative z-10">
          <div className="flex-1 flex flex-col items-center justify-start md:justify-between px-4 md:px-0">
            <h1 className="text-white text-3xl md:text-5xl font-itim pt-12 md:pt-20 w-full md:w-[20rem] text-center md:text-left">
              Kenapa Harus Katanusa?
            </h1>
          </div>
          <div className="flex-1 flex flex-col gap-6 text-white py-12 px-4 md:px-0 items-center md:items-start">
            <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-[35rem]">
              <img
                alt="bye-info-hoax"
                className="block w-32 h-32 md:w-52 md:h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-bye-info-hoax.png"
              />
              <div className="flex flex-col gap-2 text-center md:text-left">
                <h3 className="text-2xl font-bold">Bye-bye Info Hoax</h3>
                <p>
                  Pernah bingung karena info budaya di Google beda-beda? Di
                  sini, AI hanya bicara sesuai data yang sudah divalidasi para
                  pakar budaya.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-[35rem]">
              <img
                alt="lebih-dari-sekadar-chatbot"
                className="block w-32 h-32 md:w-52 md:h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-lebih-dari-sekadar-chatbot.png"
              />
              <div className="flex flex-col gap-2 text-center md:text-left">
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
            <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-[35rem]">
              <img
                alt="apresiasi"
                className="block w-32 h-32 md:w-52 md:h-52 object-contain"
                src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-apresiasi-untuk-penjaga-tradisi.png"
              />
              <div className="flex flex-col gap-2 text-center md:text-left">
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
        <div className="z-10 relative md:absolute top-0 left-0 right-0 bottom-0 gap-8 md:gap-12 flex flex-col-reverse md:flex-row justify-center items-center min-h-[50vh] py-12 md:py-0 px-4">
          <img
            alt="ai-group"
            src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/icon-ai-group.webp"
            className="w-full max-w-[20rem] md:w-[35rem] block"
          />

          <div className="flex flex-col items-center md:items-start justify-start gap-6 w-full md:w-[35rem] text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-itim md:pt-20">
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
      <section className="relative flex flex-col gap-12 justify-center items-center min-h-[85vh] bg-[#1E315A] py-12">
        <div className="relative w-full min-h-[85vh] z-10 flex flex-col gap-12 justify-center items-center pb-8 px-4">
          <div className="text-white flex flex-col items-center justify-center gap-6 text-center">
            <h1 className="text-3xl md:text-5xl font-itim pt-0 md:pt-20">
              Belajar Langsung dari Pakarnya
            </h1>
            <p className="w-full max-w-2xl text-center">
              AI kami hanyalah pembuka jalan. Dapatkan wawasan mendalam melalui
              sesi konsultasi, workshop, atau diskusi privat dengan Pakar
              Budayawan terverifikasi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
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
        <Link to="/signup" className="cursor-pointer">
          <img
            alt="join-as-partner"
            src="https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-join-as-partner.webp"
            className="block w-full h-72 object-contain"
          />
        </Link>
      </section>
      {/* gabung-sebagai-mitra */}
      <Footer />
    </main>
  );
};

export default LandingPage;
