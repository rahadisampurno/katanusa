import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Calendar,
  Clock,
  Filter,
  Search,
  Video,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface AppointmentItem {
  id: number;
  booking_id: string;
  total_amount: number;
  notes: string | null;
  session_notes: string | null;
  status: string;
  scheduled_at: string;
  meeting_url: string | null;
  created_at: string;
  client_id: string;
  client_name: string;
}

export const RuangPakarPermintaan: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<{ appointments: AppointmentItem[] }>({
    queryKey: ['expert-appointments'],
    queryFn: async () => {
      const res = await network.get('/expert/appointments');
      return res.data;
    },
  });

  const appointments = data?.appointments || [];

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, pageSize]);

  const filtered = appointments.filter((a) => {
    if (activeTab === 'pending' && a.status !== 'pending_payment') return false;
    if (activeTab === 'upcoming' && !['paid', 'confirmed', 'ready'].includes(a.status)) return false;
    if (activeTab === 'completed' && a.status !== 'completed') return false;
    if (activeTab === 'cancelled' && a.status !== 'cancelled') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchClient = a.client_name?.toLowerCase().includes(q);
      const matchBooking = a.booking_id?.toLowerCase().includes(q);
      const matchNotes = a.notes?.toLowerCase().includes(q);
      if (!matchClient && !matchBooking && !matchNotes) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedAppointments = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Terkonfirmasi
          </span>
        );
      case 'pending_payment':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Menunggu Bayar
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Permintaan & Sesi Konsultasi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Daftar permohonan bimbingan dan jadwal pertemuan tatap muka bersama para penikmat budaya Nusantara.
          </p>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({appointments.length})
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
            Akan Datang ({appointments.filter((a) => ['paid', 'confirmed', 'ready'].includes(a.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Menunggu Bayar ({appointments.filter((a) => a.status === 'pending_payment').length})
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
            Selesai ({appointments.filter((a) => a.status === 'completed').length})
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
            Batal ({appointments.filter((a) => a.status === 'cancelled').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari murid, kode sesi, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#0F1B38] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
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

      {/* Table Container */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Sesi Konsultasi & Permintaan Masuk
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-white">{filtered.length}</strong> sesi
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat daftar sesi konsultasi...
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Kode & Klien</th>
                    <th className="py-3 px-3">Jadwal Sesi</th>
                    <th className="py-3 px-3">Apresiasi</th>
                    <th className="py-3 px-3">Catatan Topik</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedAppointments.map((item) => (
                    <tr key={item.booking_id} className="hover:bg-white/5 transition-colors">
                      {/* Kode & Klien */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
                            {item.client_name ? item.client_name.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-white">
                              {item.client_name}
                            </span>
                            <span className="block text-[11px] font-mono text-slate-400">
                              #{item.booking_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jadwal */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {item.scheduled_at
                              ? dayjs(item.scheduled_at).format('DD MMM YYYY, HH:mm')
                              : 'Belum dijadwalkan'}{' '}
                            WIB
                          </span>
                        </div>
                      </td>

                      {/* Apresiasi */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-300">
                          Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Catatan */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                          {item.notes ? `"${item.notes}"` : '-'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Ruang tatap muka dengan ${item.client_name} (ID: ${item.booking_id}) dibuka saat waktu sesi aktif.`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Ruang Sesi</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada sesi konsultasi yang cocok dengan pencarian atau filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};
