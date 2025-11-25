import type React from 'react';
import { useState } from 'react';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';
import { experts } from '../../data/experts';
import { BookingStatus, type Booking } from '../../types/booking';

// Mock Data
const mockBookings: Booking[] = [
  {
    id: '1',
    expertId: experts.find((e) => e.name === 'Sujiwo Tejo')?.id || 'expert-1',
    expertName: 'Sujiwo Tejo',
    expertRole: 'Seni Pedalangan (Wayang), Musik, dan Seni Peran.',
    expertImage: experts.find((e) => e.name === 'Sujiwo Tejo')?.image || '',
    topic: 'Filosofi Semar Wayang',
    date: 'Hari ini, 22 Nov 2025',
    time: '11:00 - 11:30 WIB',
    status: BookingStatus.ACTIVE,
  },
  {
    id: '2',
    expertId:
      experts.find((e) => e.name === 'Dr. Hawe Setiawan')?.id || 'expert-2',
    expertName: 'Dr. Hawe Setiawan',
    expertRole: 'Budayawan dan penulis, ahli sastra Sunda & kajian budaya.',
    expertImage:
      experts.find((e) => e.name === 'Dr. Hawe Setiawan')?.image || '',
    topic: 'Kajian budaya sunda',
    date: 'Hari ini, 22 Nov 2025',
    time: '16:00 - 17:00 WIB',
    status: BookingStatus.ACTIVE,
    canReschedule: true,
  },
];

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
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
        <button className="bg-[#D92D20] hover:bg-[#b9251b] text-white font-bold py-3 px-6 rounded-full transition-colors w-full md:w-auto">
          Masuk Video Call
        </button>
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
          {activeTab === 'active' && (
            <>
              {mockBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12 text-gray-400">
              Belum ada riwayat sesi.
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="text-center py-12 text-gray-400">
              Tidak ada pembayaran tertunda.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingHistory;
