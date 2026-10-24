import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface BookingTransaction {
  id: number;
  booking_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  scheduled_at: string;
  expert_name: string;
  expert_title: string;
}

export const RuangSayaPembayaran: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<{ bookings: BookingTransaction[] }>({
    queryKey: ['me-bookings-payments'],
    queryFn: async () => {
      const res = await network.get('/me/bookings');
      return res.data;
    },
  });

  const transactions = data?.bookings || [];

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, pageSize]);

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'paid' && !['paid', 'completed'].includes(t.status)) return false;
    if (activeTab === 'pending' && t.status !== 'pending_payment') return false;
    if (activeTab === 'cancelled' && !['cancelled', 'expired'].includes(t.status)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = t.booking_id?.toLowerCase().includes(q);
      const matchExpert = t.expert_name?.toLowerCase().includes(q);
      const matchTitle = t.expert_title?.toLowerCase().includes(q);
      if (!matchId && !matchExpert && !matchTitle) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Pembayaran & Dokumen Kuitansi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Riwayat transaksi, bukti pembayaran resmi, dan transparansi distribusi apresiasi budaya.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Total Transaksi</span>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Selesai / Lunas</span>
          <p className="text-2xl font-bold text-emerald-400">
            {transactions.filter((t) => t.status === 'paid' || t.status === 'completed').length}
          </p>
        </div>
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Menunggu Pembayaran</span>
          <p className="text-2xl font-bold text-amber-400">
            {transactions.filter((t) => t.status === 'pending_payment').length}
          </p>
        </div>
      </div>

      {/* Daftar Transaksi Table Card */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Bukti Transaksi
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-white">{filteredTransactions.length}</strong> catatan
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
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
              Semua ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunas ({transactions.filter((t) => t.status === 'paid' || t.status === 'completed').length})
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
              Menunggu Bayar ({transactions.filter((t) => t.status === 'pending_payment').length})
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
              Batal ({transactions.filter((t) => t.status === 'cancelled' || t.status === 'expired').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode booking atau pakar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#0F1B38] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
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

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat bukti transaksi...
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Kode Transaksi</th>
                    <th className="py-3 px-3">Pakar & Layanan</th>
                    <th className="py-3 px-3">Waktu Pembuatan</th>
                    <th className="py-3 px-3">Total Biaya</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Kuitansi / Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedTransactions.map((t) => {
                    const isPaid = t.status === 'paid' || t.status === 'completed';
                    const isPending = t.status === 'pending_payment';

                    return (
                      <tr key={t.booking_id} className="hover:bg-white/5 transition-colors">
                        {/* Kode Transaksi */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-white block">
                            #{t.booking_id}
                          </span>
                        </td>

                        {/* Pakar */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-white block">{t.expert_name}</span>
                          <span className="text-[11px] text-amber-300 block">{t.expert_title}</span>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-300 text-[11px]">
                          {dayjs(t.created_at).format('DD MMM YYYY, HH:mm')} WIB
                        </td>

                        {/* Total Biaya */}
                        <td className="py-3.5 px-3 whitespace-nowrap font-mono font-bold text-amber-300">
                          Rp {Number(t.total_amount).toLocaleString('id-ID')}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isPaid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              Lunas
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Menunggu Bayar
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-400/30 uppercase">
                              {t.status}
                            </span>
                          )}
                        </td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() =>
                                alert(`Mengunduh kuitansi resmi untuk transaksi #${t.booking_id}`)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>Unduh Kuitansi</span>
                            </button>
                          ) : isPending ? (
                            <Link
                              to={`/payment?bookingId=${t.booking_id}`}
                              className="inline-block px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                            >
                              Bayar Sekarang
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada riwayat transaksi pembayaran yang sesuai filter.
          </div>
        )}
      </div>
    </div>
  );
};
