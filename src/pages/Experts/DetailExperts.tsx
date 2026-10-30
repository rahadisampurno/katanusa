import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MessageCircle,
  Phone,
} from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router';
import ExpertImage from '../../components/experts/ExpertImage';
import ScopedBadges from '../../components/experts/ScopedBadges';
import {
  GununganWayangIcon,
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../../components/icons/NusantaraIcons';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import BookingModal from '../../components/modals/BookingModal';
import PaymentModal, {
  type BookingData,
} from '../../components/modals/PaymentModal';
import Button from '../../components/ui/Button';
import { experts } from '../../data/experts';
import auth from '../../libs/auth';
import network from '../../libs/network';
import type { Expert } from '../../types/expert';

const DetailExperts = (): JSX.Element => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [imgError, setImgError] = useState(false);
  const loaderData = useLoaderData() as { data?: Expert } | undefined;
  const localMatch = experts.find((item) => item.id === id && item.isAi);
  const localExpert = localMatch
    ? { ...localMatch, realExpertReferences: [] }
    : undefined;
  const [expert, setExpert] = useState<Expert | null>(
    loaderData?.data || localExpert || null,
  );

  useEffect(() => {
    if (loaderData?.data) {
      setExpert(loaderData.data);
    } else if (id) {
      network
        .get(`/experts/${id}`)
        .then((response) => {
          if (response.data) setExpert(response.data);
        })
        .catch(() => {});
    }
  }, [loaderData, id]);

  useEffect(() => {
    if (expert) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [expert]);

  if (!expert) {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-[#1E315A]">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white">
          <h1 className="text-3xl font-bold">Pakar tidak ditemukan</h1>
          <Button onClick={() => navigate('/experts')}>
            Kembali ke Daftar Pakar
          </Button>
        </div>
      </main>
    );
  }

  const cultureName = expert.suku || expert.origin || 'Nusantara';
  const highlightedSpecialty = expert.specialties[0] || `budaya ${cultureName}`;
  const conversationStarters = [
    `Apa yang paling khas dari budaya ${cultureName}?`,
    `Ceritakan makna ${highlightedSpecialty} bagi masyarakat.`,
    `Bagaimana generasi muda dapat ikut melestarikan budaya ${cultureName}?`,
  ];
  const languageLabel = expert.languageCode === 'su-ID'
    ? 'Sunda & Indonesia'
    : `${cultureName} & Indonesia`;
  const otherExperts = experts
    .filter((item) => item.id !== expert.id && item.isAi)
    .slice(0, 4);

  const openChat = (question?: string): void => {
    const query = question ? `?q=${encodeURIComponent(question)}` : '';
    const target = `/experts/${expert.id}/chats${query}`;
    navigate(
      auth.isAuthenticated()
        ? target
        : `/auth/login?returnUrl=${encodeURIComponent(target)}`,
    );
  };

  const openCall = (): void => {
    const target = `/experts/${expert.id}/chats?call=true`;
    navigate(
      auth.isAuthenticated()
        ? target
        : `/auth/login?returnUrl=${encodeURIComponent(target)}`,
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#1E315A] font-sans text-white">
      <Navbar isWhite />

      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pt-20 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[url('/assets/bg-pattern.webp')] bg-contain bg-repeat opacity-[0.045]" />
        <div className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-red-600/[0.05] blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate('/experts')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke para pakar
          </button>

          <div className="flex flex-col items-start gap-10 md:flex-row md:gap-14 lg:gap-16">
            <div className="mx-auto w-full max-w-md shrink-0 md:w-1/3">
              <div className="relative overflow-hidden rounded-3xl bg-[#132346] shadow-2xl">
                <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600" />
                {!imgError && expert.image ? (
                  <img
                    src={expert.image.endsWith('.png') ? expert.image.replace(/\.png$/i, '.webp') : expert.image}
                    alt={`Potret ${expert.name}`}
                    decoding="async"
                    onError={() => setImgError(true)}
                    className="h-[460px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[460px] w-full flex-col items-center justify-center bg-[#132346] p-6 text-center">
                    <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/10 font-itim text-3xl text-white">
                      {expert.name
                        .split(' ')
                        .map((word) => word[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-amber-300">
                      {cultureName}
                    </span>
                  </div>
                )}
              </div>
              {expert.isAi && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/65">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Aktif dan siap diajak berbincang
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 md:pt-1">
              {expert.isAi && (
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  <SuryaMajapahitIcon className="h-5 w-5" />
                  AI Persona Budaya
                </div>
              )}

              <h1 className="font-itim text-5xl leading-none text-white sm:text-6xl">
                {expert.name}
              </h1>
              <h2 className="mt-3 text-xl font-bold text-white/90 sm:text-2xl">
                {expert.role}
              </h2>
              {'badges' in expert && expert.badges ? (
                <ScopedBadges
                  badges={expert.badges as Record<string, boolean>}
                  className="mt-3"
                />
              ) : null}

              <div className="my-5 h-px w-20 bg-gradient-to-r from-red-500 to-amber-400" />

              <p className="max-w-3xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
                {expert.bio || 'Belum ada deskripsi untuk pakar ini.'}
              </p>

              {expert.isAi && (
                <div className="my-5 grid grid-cols-1 border-y border-white/10 py-4 sm:grid-cols-3">
                  <div className="py-2 sm:pr-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      Bahasa
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {languageLabel}
                    </p>
                  </div>
                  <div className="border-white/10 py-2 sm:border-l sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      Gaya berbincang
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Ramah dan edukatif
                    </p>
                  </div>
                  <div className="border-white/10 py-2 sm:border-l sm:pl-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      Tersedia melalui
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Chat dan panggilan
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-lg font-bold">Area keahlian</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.specialties.length > 0 ? (
                    expert.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="italic text-white/50">
                      Tidak ada data keahlian khusus.
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {expert.isAi ? (
                  <>
                    <Button
                      className="flex w-full items-center justify-center gap-2 bg-red-600 px-8 py-3.5 text-base font-bold shadow-lg shadow-red-950/25 transition hover:-translate-y-0.5 hover:bg-red-700 sm:w-auto"
                      onClick={() => openChat()}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Mulai Chat
                    </Button>
                    <Button
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 border-white/30 px-8 py-3.5 text-base font-bold transition hover:-translate-y-0.5 sm:w-auto"
                      onClick={openCall}
                    >
                      <Phone className="h-5 w-5" />
                      Mulai Panggilan
                    </Button>
                  </>
                ) : (
                  <Button
                    className="flex w-full items-center justify-center gap-2 bg-red-600 px-8 py-3.5 text-base font-bold sm:w-auto"
                    onClick={() =>
                      auth.isAuthenticated()
                        ? setIsBookingModalOpen(true)
                        : navigate('/auth/login')
                    }
                  >
                    <Calendar className="h-5 w-5" />
                    Booking Sesi
                  </Button>
                )}
              </div>

              {!expert.isAi && (
                <p className="mt-4 text-sm text-white/60">
                  Mulai dari <strong className="text-white">Rp 100.000</strong>
                </p>
              )}

              {expert.isAi && (
                <div className="mt-4 flex max-w-2xl items-start gap-2 text-xs leading-5 text-white/45">
                  <PerisaiTalawangIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/70" />
                  <p>
                    Persona berbasis AI dapat melakukan kekeliruan. Periksa kembali
                    informasi untuk kebutuhan akademik atau keputusan penting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {expert.isAi && (
        <section className="relative border-y border-white/10 bg-[#132346] px-4 py-12 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[url('/assets/bg-pattern.webp')] bg-cover opacity-[0.035]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
                  <GununganWayangIcon className="h-7 w-7" />
                  Pembuka percakapan
                </div>
                <h3 className="font-itim text-3xl leading-tight text-white sm:text-4xl">
                  Mulai menjelajahi cerita Nusantara
                </h3>
              </div>
              <p className="max-w-lg text-sm leading-6 text-white/60 md:text-right">
                Pilih pertanyaan, lalu sesuaikan sebelum dikirim.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {conversationStarters.map((question, index) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => openChat(question)}
                  className="group flex min-h-28 w-full flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-amber-300/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="font-itim text-xl text-amber-300">
                      0{index + 1}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-amber-300" />
                  </span>
                  <span className="text-sm font-semibold leading-6 text-white/90">
                    {question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#1E315A] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
                <MandalaKawungIcon className="h-5 w-5" />
                Ragam budaya Indonesia
              </div>
              <h3 className="font-itim text-3xl text-white">
                Kenali AI pakar budaya lainnya
              </h3>
              <p className="mt-2 text-sm text-white/55">
                Temukan cerita dan tradisi dari berbagai penjuru Nusantara.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/experts')}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-white transition hover:text-amber-300 sm:self-auto"
            >
              Lihat semua pakar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

      <Footer />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        expert={expert}
        onProceed={(data) => {
          const userData = auth.getUserData();
          setBookingData({ expert, ...data, userData });
          setIsBookingModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingData={bookingData}
      />
    </main>
  );
};

export default DetailExperts;
