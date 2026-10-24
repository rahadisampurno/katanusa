import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  Receipt,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  deep_link: string | null;
  severity: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const RuangSayaNotifikasi: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<{ notifications: NotificationItem[] }>({
    queryKey: ['me-notifications'],
    queryFn: async () => {
      const res = await network.get('/me/notifications');
      return res.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await network.patch(`/me/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-notifications'] });
    },
  });

  const notifications = data?.notifications || [];

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, readFilter, search, pageSize]);

  const filteredNotifs = notifications.filter((n) => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (readFilter === 'unread' && n.is_read) return false;
    if (readFilter === 'read' && !n.is_read) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchSummary = n.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredNotifs.length / pageSize) || 1;
  const paginatedNotifs = filteredNotifs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Pusat Notifikasi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pemberitahuan terkini terkait sesi konsultasi adat, pembayaran, kurasi kepakaran, dan keamanan akun.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Pemberitahuan Masuk
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-white">{filteredNotifs.length}</strong> pemberitahuan
          </span>
        </div>

        {/* Filters & Search Bar */}
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Kategori ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sessions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'sessions'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sesi ({notifications.filter((n) => n.category === 'sessions').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('payments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'payments'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pembayaran ({notifications.filter((n) => n.category === 'payments').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('curation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'curation'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kurasi ({notifications.filter((n) => n.category === 'curation').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'security'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Keamanan ({notifications.filter((n) => n.category === 'security').length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter (All / Unread / Read) */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
              <button
                type="button"
                onClick={() => setReadFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readFilter === 'all'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setReadFilter('unread')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readFilter === 'unread'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belum Dibaca ({notifications.filter((n) => !n.is_read).length})
              </button>
              <button
                type="button"
                onClick={() => setReadFilter('read')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readFilter === 'read'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sudah Dibaca
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari isi notifikasi..."
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
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat notifikasi...
          </div>
        ) : filteredNotifs.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Judul & Ringkasan</th>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedNotifs.map((n) => {
                    const isUnread = !n.is_read;

                    return (
                      <tr
                        key={n.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isUnread ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Kategori Icon & Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                            {n.category}
                          </span>
                        </td>

                        {/* Judul & Ringkasan */}
                        <td className="py-3.5 px-3 max-w-sm">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{n.title}</h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {n.summary}
                          </p>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[11px] text-slate-400">
                          {dayjs(n.created_at).format('DD MMM YYYY, HH:mm')} WIB
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isUnread ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Baru
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-white/5">
                              Dibaca
                            </span>
                          )}
                        </td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-amber-300 transition-all cursor-pointer"
                              title="Tandai sudah dibaca"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Tandai Dibaca</span>
                            </button>
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
              totalItems={filteredNotifs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada notifikasi yang cocok dengan filter atau pencarian.
          </div>
        )}
      </div>
    </div>
  );
};
