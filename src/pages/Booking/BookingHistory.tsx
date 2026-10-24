import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Loader2, Search, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import { TablePagination } from '../../components/ui/TablePagination';
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
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
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
            Sampaikan Apresiasi
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
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'pending'>('active');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const tabs = [
    { id: 'active', label: 'Aktif / Yang Akan Datang' },
    { id: 'history', label: 'Riwayat / Selesai' },
    { id: 'pending', label: 'Menunggu Konfirmasi' },
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
          limit: 100,
        },
      });
      return response.data;
    },
  });

  // Filter Data based on Active Tab & Search
  const bookings = bookingResponse?.data.map(mapApiBookingToUiBooking) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, pageSize]);

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'active' && booking.status !== BookingStatus.ACTIVE) return false;
    if (activeTab === 'history' && booking.status !== BookingStatus.COMPLETED) return false;
    if (activeTab === 'pending' && booking.status !== BookingStatus.PENDING_PAYMENT) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchExpert = booking.expertName?.toLowerCase().includes(q);
      const matchTopic = booking.topic?.toLowerCase().includes(q);
      const matchId = booking.id?.toLowerCase().includes(q);
      if (!matchExpert && !matchTopic && !matchId) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-[#0B1221] flex flex-col">
      <Navbar isWhite />

      <main className="grow container mx-auto px-4 py-8 md:py-12 mt-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 font-sans">
          Agenda Bimbingan Budaya Saya
        </h1>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 mb-8 pb-3">
          <div className="flex flex-wrap gap-6 md:gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-base md:text-lg font-medium transition-colors relative cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-3 left-0 w-full h-1 bg-[#D92D20] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari pakar, topik, atau ID sesi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#162447] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
              Gagal memuat agenda bimbingan. Silakan coba lagi nanti.
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {filteredBookings.length > 0 ? (
                <>
                  <div className="flex flex-col gap-4">
                    {paginatedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>

                  <div className="bg-[#162447] rounded-2xl p-4 border border-white/10 shadow-md">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredBookings.length}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[5, 10, 20]}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  {search
                    ? 'Tidak ada agenda bimbingan yang cocok dengan kata kunci pencarian.'
                    : activeTab === 'active'
                    ? 'Belum ada sesi aktif.'
                    : activeTab === 'history'
                    ? 'Belum ada riwayat sesi.'
                    : 'Tidak ada sesi menunggu konfirmasi.'}
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
