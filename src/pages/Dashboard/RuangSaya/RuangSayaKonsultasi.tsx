import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MessageSquare,
  Receipt,
  Search,
  Video,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { TablePagination } from '../../../components/ui/TablePagination';
import Button from '../../../components/ui/Button';
import network from '../../../libs/network';

dayjs.locale('id');

interface BookingItem {
  id: number;
  booking_id: string;
  total_amount: number;
  notes: string | null;
  session_notes: string | null;
  status: string;
  scheduled_at: string;
  paid_at: string | null;
  meeting_url: string | null;
  created_at: string;
  expert_profile_id: string;
  expert_name: string;
  expert_title: string;
  expert_image_url: string | null;
}

export const RuangSayaKonsultasi: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'action_required' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<{ bookings: BookingItem[] }>({
    queryKey: ['me-bookings'],
    queryFn: async () => {
      const res = await network.get('/me/bookings');
      return res.data;
    },
  });

  const bookings = data?.bookings || [];

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  const filteredBookings = bookings.filter((b) => {
    // Filter status tab
    if (activeTab === 'action_required' && b.status !== 'pending_payment') return false;
    if (activeTab === 'upcoming' && !['paid', 'confirmed', 'ready'].includes(b.status)) return false;
    if (activeTab === 'completed' && b.status !== 'completed') return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled') return false;

    // Filter pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.expert_name.toLowerCase().includes(q);
      const matchTitle = b.expert_title.toLowerCase().includes(q);
      const matchId = b.booking_id.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchId) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Konsultasi Saya
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Kelola jadwal, riwayat pertemuan tatap muka, dan catatan bimbingan bersama para pakar adat Nusantara.
          </p>
        </div>

        <Link to="/experts">
          <Button variant="primary" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
            Jadwalkan Sesi Baru
          </Button>
        </Link>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('action_required')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'action_required'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Perlu Tindakan ({bookings.filter((b) => b.status === 'pending_payment').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Akan Datang ({bookings.filter((b) => ['paid', 'confirmed', 'ready'].includes(b.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai ({bookings.filter((b) => b.status === 'completed').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dibatalkan ({bookings.filter((b) => b.status === 'cancelled').length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pakar atau kode sesi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0F1B38] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
          />
        </div>
      </div>

      {/* List Sesi */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedBookings.map((b) => {
              const isUpcoming = ['paid', 'confirmed', 'ready'].includes(b.status);
              const isPending = b.status === 'pending_payment';
              const isCompleted = b.status === 'completed';

              return (
                <div
                  key={b.booking_id}
                  className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 transition-all hover:border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500/20 to-red-600/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0">
                      {b.expert_name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 uppercase">
                          #{b.booking_id}
                        </span>
                        {isUpcoming && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Terkonfirmasi
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse">
                            Menunggu Pembayaran
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            Selesai
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white">{b.expert_name}</h3>
                      <p className="text-xs text-amber-300">{b.expert_title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dayjs(b.scheduled_at).format('dddd, DD MMMM YYYY - HH:mm')} WIB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                    {isPending && (
                      <Link
                        to={`/payment?bookingId=${b.booking_id}`}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                      >
                        Bayar Sekarang (Rp {b.total_amount.toLocaleString('id-ID')})
                      </Link>
                    )}
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => alert(`Ruang tatap muka dengan ${b.expert_name} akan dibuka 10 menit sebelum jadwal sesi.`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Masuk Ruang Sesi</span>
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => alert('Fitur pemberian ulasan apresiasi dan umpan balik sesi konsultasi.')}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                      >
                        Beri Ulasan Budaya
                      </button>
                    )}
                    <Link
                      to={`/dashboard/pembayaran`}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                      title="Rincian Pembayaran"
                    >
                      <Receipt className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-4 shadow-md">
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
        </div>
      ) : (
        <div className="py-12 rounded-2xl bg-[#132346]/50 border border-white/10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">Tidak Ada Sesi Ditemukan</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ada riwayat sesi yang sesuai dengan filter yang Anda pilih saat ini.
          </p>
        </div>
      )}
    </div>
  );
};
