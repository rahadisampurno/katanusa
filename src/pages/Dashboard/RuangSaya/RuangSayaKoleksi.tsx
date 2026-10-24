import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  FolderHeart,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { TablePagination } from '../../../components/ui/TablePagination';
import Button from '../../../components/ui/Button';
import network from '../../../libs/network';

interface CollectionItem {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export const RuangSayaKoleksi: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const { data, isLoading } = useQuery<{ collections: CollectionItem[] }>({
    queryKey: ['me-collections'],
    queryFn: async () => {
      const res = await network.get('/me/collections');
      return res.data;
    },
  });

  const collections = data?.collections || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, pageSize]);

  const filtered = collections.filter((c) => {
    if (filterType === 'public' && !c.is_public) return false;
    if (filterType === 'private' && c.is_public) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Jelajah & Koleksi Budaya
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Penanda materi tradisi Nusantara, artikel adat tersimpan, dan pakar budaya favorit Anda.
          </p>
        </div>
        <Link to="/experts">
          <Button variant="primary" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
            Jelajah Katalog
          </Button>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({collections.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('public')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'public'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publik ({collections.filter((c) => c.is_public).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('private')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'private'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pribadi ({collections.filter((c) => !c.is_public).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari koleksi tersimpan..."
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

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Memuat koleksi budaya...
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginated.map((col) => (
              <div
                key={col.id}
                className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-3 hover:border-amber-400/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <FolderHeart className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                      {col.is_public ? 'Publik' : 'Pribadi'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{col.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3">
                      {col.description || 'Koleksi topik budaya'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-4 shadow-md">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        </div>
      ) : (
        <div className="py-16 rounded-2xl bg-[#132346]/50 border border-white/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Tidak Ada Koleksi Ditemukan</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Tidak ada koleksi budaya yang cocok dengan kata kunci atau filter yang Anda pilih.
            </p>
          </div>
          <Link to="/experts" className="inline-block">
            <Button variant="outline" className="text-xs font-bold text-amber-300 border-amber-400/30">
              Eksplorasi Katalog Sekarang
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
