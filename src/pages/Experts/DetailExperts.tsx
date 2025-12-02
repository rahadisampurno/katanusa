import { Calendar, MessageCircle, Phone } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import ExpertImage from '../../components/experts/ExpertImage';
import Navbar from '../../components/layout/Navbar';
import BookingModal from '../../components/modals/BookingModal';
import PaymentModal, {
  type BookingData,
} from '../../components/modals/PaymentModal';
// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../../components/svgs/logo-katanusa-white.svg?react';
import Button from '../../components/ui/Button';
import { experts } from '../../data/experts';
import auth from '../../libs/auth';

const DetailExperts = (): JSX.Element => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const expert = experts.find((e) => e.id === id);

  useEffect(() => {
    if (expert) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [expert]);

  if (!expert) {
    return (
      <main className="bg-[#1E315A] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4">
          <h1 className="text-3xl font-bold">Pakar tidak ditemukan</h1>
          <Button onClick={() => navigate('/experts')}>
            Kembali ke Daftar Pakar
          </Button>
        </div>
      </main>
    );
  }

  const otherExperts = experts
    .filter((e) => e.id !== expert.id && !e.isAi)
    .slice(0, 4);

  return (
    <main className="bg-[#1E315A] min-h-screen font-sans">
      <Navbar isWhite />

      {/* Hero / Expert Info Section */}
      <section className="relative pt-32 pb-16 max-w-7xl mx-auto min-h-[80vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10">
          <div className="w-full h-full bg-[url('https://nqkccvvmafrqonxgvxih.supabase.co/storage/v1/object/public/assets/bg-pattern.webp')] bg-repeat bg-contain" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-16 items-start w-full">
          {/* Left: Image */}
          <div className="w-full md:w-1/3 shrink-0">
            <div className="aspect-3/4 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <img
                src={expert.image}
                alt={expert.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 text-white flex flex-col gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 font-itim">
                {expert.name}
              </h1>
              <h2 className="text-xl md:text-2xl font-medium text-gray-200">
                {expert.role}
              </h2>
            </div>

            <div className="prose prose-lg text-gray-300 leading-relaxed">
              <p>{expert.bio || 'Belum ada deskripsi untuk pakar ini.'}</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Area Keahlian</h3>
              <div className="flex flex-wrap gap-2">
                {expert.specialties.length > 0 ? (
                  expert.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-sm hover:bg-white/10 transition-colors cursor-default"
                    >
                      {specialty}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">
                    Tidak ada data keahlian khusus.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
              {expert.isAi && (
                <>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all w-full sm:w-auto justify-center"
                    onClick={() =>
                      auth.isAuthenticated()
                        ? navigate(`/experts/${expert.id}/chats`)
                        : navigate('/login')
                    }
                  >
                    <MessageCircle />
                    Mulai Chat
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all w-full sm:w-auto justify-center"
                    onClick={() =>
                      auth.isAuthenticated()
                        ? navigate(`/experts/${expert.id}/chats`)
                        : navigate('/login')
                    }
                  >
                    <Phone />
                    Mulai Call
                  </Button>
                </>
              )}
              {!expert.isAi && (
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all w-full sm:w-auto justify-center"
                  onClick={() =>
                    auth.isAuthenticated()
                      ? setIsBookingModalOpen(true)
                      : navigate('/login')
                  }
                >
                  <Calendar />
                  Booking Sesi
                </Button>
              )}

              {!expert.isAi && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400">Mulai dari</span>
                  <span className="text-xl font-bold">Rp 100.000</span>
                </div>
              )}

              <button
                onClick={() => navigate('/experts')}
                className="text-white underline hover:text-gray-300 transition-colors ml-auto sm:ml-0"
              >
                Lihat pakar lain
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="bg-[#132346]/50 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
            Rekomendasi Pakar budaya Sunda asli lainnya
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {otherExperts.map((otherExpert) => (
              <ExpertImage
                key={otherExpert.id}
                alt={otherExpert.name}
                image={otherExpert.image}
                name={otherExpert.name}
                caption={otherExpert.role}
                isAi={otherExpert.isAi ?? false}
                onClick={() => navigate(`/experts/${otherExpert.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/10">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20 text-white">
          <div className="flex flex-col gap-4">
            <LogoKataNusaWhite />
            <div className="text-gray-300">
              Semua bisa belajar dari para pakar.
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-lg">Link Utama</h1>
            <ul className="flex flex-col gap-2 text-gray-300">
              <li>
                <a href="/experts" className="hover:text-white transition">
                  Cari pakar
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white transition">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Daftar sebagai mitra pakar
                </a>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-lg">Tim Balad Wisesa</h1>
            <ul className="flex flex-col gap-2 text-gray-300">
              <li>Dena Hadianto (Ketua)</li>
              <li>Muhammad Agung Rizkyana</li>
              <li>Rahadi Sampurno</li>
              <li>Danu Ega Pratama</li>
              <li>Anisa Rahma</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        expert={expert}
        onProceed={(data) => {
          const userData = auth.getUserData();
          setBookingData({
            expert,
            ...data,
            userData,
          });
          setIsBookingModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingData={bookingData}
      />
    </main>
  );
};

export default DetailExperts;
