import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Filter,
  MessageSquare,
  Search,
  Star,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface ReviewItem {
  id: string;
  rating: number;
  feedback_text: string | null;
  expert_response: string | null;
  created_at: string;
}

export const RuangPakarUlasan: React.FC = () => {
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | 'low'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<{ reviews: ReviewItem[] }>({
    queryKey: ['expert-reviews'],
    queryFn: async () => {
      const res = await network.get('/expert/reviews');
      return res.data;
    },
  });

  const reviews = data?.reviews || [];

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter, search, pageSize]);

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter === '5' && r.rating !== 5) return false;
    if (ratingFilter === '4' && r.rating !== 4) return false;
    if (ratingFilter === '3' && r.rating !== 3) return false;
    if (ratingFilter === 'low' && r.rating > 2) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = r.feedback_text?.toLowerCase().includes(q);
      const matchResponse = r.expert_response?.toLowerCase().includes(q);
      if (!matchText && !matchResponse) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
          Ulasan & Reputasi Praktik Budaya
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Umpan balik penikmat budaya setelah mengikuti sesi bimbingan adat secara terverifikasi.
        </p>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Ulasan & Apresiasi Murid
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total <strong className="text-white">{filteredReviews.length}</strong> ulasan terverifikasi
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Rating Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ratingFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ratingFilter === '5'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5 Bintang ({reviews.filter((r) => r.rating === 5).length})
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ratingFilter === '4'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4 Bintang ({reviews.filter((r) => r.rating === 4).length})
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ratingFilter === '3'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 Bintang ({reviews.filter((r) => r.rating === 3).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari ulasan atau respons..."
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
            Memuat ulasan murid...
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Penilaian</th>
                    <th className="py-3 px-3">Umpan Balik Murid</th>
                    <th className="py-3 px-3">Tanggapan Pakar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        {dayjs(r.created_at).format('DD MMMM YYYY')}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-white ml-1">{r.rating}.0</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 max-w-sm">
                        {r.feedback_text ? (
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            &ldquo;{r.feedback_text}&rdquo;
                          </p>
                        ) : (
                          <span className="text-slate-500 italic">Tanpa ulasan teks</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        {r.expert_response ? (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/20 text-xs text-amber-300">
                            <span className="font-bold text-[10px] uppercase block text-amber-400">
                              Respon Anda:
                            </span>
                            <p className="text-slate-300 text-[11px] mt-0.5">{r.expert_response}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Belum ditanggapi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReviews.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada ulasan yang cocok dengan kriteria pencarian dan filter.
          </div>
        )}
      </div>
    </div>
  );
};
