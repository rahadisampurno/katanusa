import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import network from '../../libs/network';
import {
  BookingStatus,
  type Booking as BookingType,
} from '../../types/booking';

// Set locale to Indonesian
dayjs.locale('id');

// API Types
interface Expert {
  id: string;
  name: string;
  role: string;
  image: string;
  specialties: string[];
  bio: string;
  gender: string;
  isAi: boolean;
  articles?: string[];
  suku: string;
}

interface SessionType {
  id: string;
  label: string;
  duration: string;
  price: number;
}

interface ApiBooking {
  id: number;
  created_at: string;
  expert: Expert;
  schedule: string;
  sessionType: SessionType;
  isPaid: boolean;
  bookingId: string;
  time: string;
  totalAmount: number;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
}

interface BookingResponse {
  data: ApiBooking[];
  meta: Meta;
}

// Mapped Booking type for component use
// Extending the existing BookingType to match what we need or just using a local interface
// Since BookingType is imported, let's adapt the API data to the UI's expectation.
// The UI expects: id, expertId, expertName, expertRole, expertImage, topic, date, time, status, canReschedule, url

const mapApiBookingToUiBooking = (apiBooking: ApiBooking): BookingType => {
  const bookingDate = dayjs(apiBooking.schedule); // Assuming schedule is the date
  const isPast = bookingDate.isBefore(dayjs(), 'day');

  let status: BookingType['status'] = BookingStatus.ACTIVE;
  if (!apiBooking.isPaid) {
    status = BookingStatus.PENDING_PAYMENT;
  } else if (isPast) {
    status = BookingStatus.COMPLETED;
  }

  return {
    id: apiBooking.bookingId,
    expertId: apiBooking.expert.id,
    expertName: apiBooking.expert.name,
    expertRole: apiBooking.expert.role,
    expertImage: apiBooking.expert.image,
    topic: apiBooking.sessionType.label,
    date: apiBooking.schedule,
    time: `${apiBooking.time} WIB`, // Assuming time is start time, duration is in sessionType
    status: status,
    canReschedule: status === BookingStatus.ACTIVE, // Simplified logic
    url: 'https://meet.google.com/dfg-ixab-bds', // Placeholder as API doesn't provide URL yet
  };
};

const BookingCard: React.FC<{ booking: BookingType }> = ({ booking }) => {
  return (
    <div className="bg-[#162447] rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 border border-white/5 shadow-lg">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 w-full md:w-auto">
        <img
          src={booking.expertImage}
          alt={booking.expertName}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/10"
        />
        <div className="text-center md:text-left">
          <h3 className="text-white font-bold text-lg md:text-xl font-sans">
            {booking.expertName}
          </h3>
          <p className="text-gray-300 text-sm max-w-xs">{booking.expertRole}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-center md:text-left w-full md:w-auto">
        <span className="text-white font-bold text-sm">Topik Sesi</span>
        <span className="text-gray-300 text-sm">{booking.topic}</span>
      </div>

      <div className="flex flex-col gap-1 text-center md:text-left w-full md:w-auto">
        <span className="text-white font-bold text-sm">Waktu</span>
        <span className="text-gray-300 text-sm">{booking.date}</span>
        <span className="text-gray-300 text-sm">{booking.time}</span>
        {booking.canReschedule && (
          <button className="text-gray-300 text-sm underline hover:text-white text-left mt-1">
            Reschedule?
          </button>
        )}
      </div>

      <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
        {booking.status === BookingStatus.ACTIVE && (
          <button
            type="button"
            onClick={() => window.open(booking.url, '_blank')}
            className="bg-[#D92D20] hover:bg-[#b9251b] text-white font-bold py-3 px-6 rounded-full transition-colors w-full md:w-auto"
          >
            Masuk Video Call
          </button>
        )}
        {booking.status === BookingStatus.PENDING_PAYMENT && (
          <button
            type="button"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-full transition-colors w-full md:w-auto"
          >
            Bayar Sekarang
          </button>
        )}
        {booking.status === BookingStatus.COMPLETED && (
          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition-colors w-full md:w-auto"
          >
            Beri Ulasan
          </button>
        )}

        {booking.canReschedule && (
          <span className="text-[10px] text-gray-400 text-center md:text-right">
            Tombol akan aktif 5 menit sebelum dimulai
          </span>
        )}
      </div>
    </div>
  );
};

const BookingHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'pending'>(
    'active',
  );

  const tabs = [
    { id: 'active', label: 'Aktif/Yang Akan Datang' },
    { id: 'history', label: 'Riwayat/Selesai' },
    { id: 'pending', label: 'Pembayaran Tertunda' },
  ] as const;

  // Fetch Data using React Query
  const {
    data: bookingResponse,
    isLoading,
    isError,
  } = useQuery<BookingResponse>({
    queryKey: ['booking-history'],
    queryFn: async () => {
      const response = await network.get('/booking', {
        params: {
          page: 1,
          limit: 50, // Fetch enough items
        },
      });
      return response.data;
    },
  });

  // Filter Data based on Active Tab
  const bookings = bookingResponse?.data.map(mapApiBookingToUiBooking) || [];

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'active') return booking.status === BookingStatus.ACTIVE;
    if (activeTab === 'history')
      return booking.status === BookingStatus.COMPLETED;
    if (activeTab === 'pending')
      return booking.status === BookingStatus.PENDING_PAYMENT;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#0B1221] flex flex-col">
      <Navbar isWhite />

      <main className="grow container mx-auto px-4 py-8 md:py-12 mt-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 font-sans">
          Booking Sesi Saya
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-6 md:gap-8 border-b border-white/10 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-base md:text-lg font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D92D20] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}

          {isError && (
            <div className="text-center py-12 text-red-400">
              Gagal memuat data booking. Silakan coba lagi nanti.
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  {activeTab === 'active' && 'Belum ada sesi aktif.'}
                  {activeTab === 'history' && 'Belum ada riwayat sesi.'}
                  {activeTab === 'pending' && 'Tidak ada pembayaran tertunda.'}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingHistory;
