import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface LedgerEntry {
  id: string;
  amount: number;
  direction: string;
  description: string;
  status: string;
  created_at: string;
}

interface FinanceData {
  balance: {
    available: number;
    held: number;
    totalPayout: number;
  };
  entries: LedgerEntry[];
}

export const RuangPakarKeuangan: React.FC = () => {
  const [directionFilter, setDirectionFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ['expert-finance'],
    queryFn: async () => {
      const res = await network.get('/expert/finance');
      return res.data;
    },
  });

  const balance = data?.balance;
  const entries = data?.entries || [];

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [directionFilter, search, pageSize]);

  const filteredEntries = entries.filter((e) => {
    if (directionFilter !== 'all' && e.direction !== directionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchId = e.id?.toLowerCase().includes(q);
      if (!matchDesc && !matchId) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Keuangan & Buku Besar Apresiasi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Akuntansi ganda (double-entry ledger) untuk pelaporan apresiasi budaya yang transparan, amanah, dan akuntabel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Pencairan dana apresiasi memerlukan verifikasi identitas tingkat AAL2 (MFA).')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all shrink-0"
        >
          Tarik Apresiasi (AAL2)
        </button>
      </div>

      {/* Saldo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Saldo Apresiasi Tersedia</span>
          <p className="text-2xl font-bold text-amber-300">
            Rp {(balance?.available ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-emerald-400">Siap untuk dicairkan</span>
        </div>

        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Saldo Tertahan (Escrow)</span>
          <p className="text-2xl font-bold text-white">
            Rp {(balance?.held ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-slate-400">Dilepas setelah sesi selesai</span>
        </div>

        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <span className="text-xs text-slate-400">Total Apresiasi Tersalurkan</span>
          <p className="text-2xl font-bold text-emerald-400">
            Rp {(balance?.totalPayout ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-slate-400">Akumulasi pencairan berhasil</span>
        </div>
      </div>

      {/* Rincian Buku Besar (Ledger Entries) Table */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mutasi Buku Besar (Double-Entry Ledger)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total <strong className="text-white">{filteredEntries.length}</strong> catatan mutasi
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Direction Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setDirectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Mutasi ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('credit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === 'credit'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan / Kredit ({entries.filter((e) => e.direction === 'credit').length})
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('debit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                directionFilter === 'debit'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Penarikan / Debit ({entries.filter((e) => e.direction === 'debit').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari keterangan mutasi..."
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
            Memuat catatan buku besar...
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Waktu & Tanggal</th>
                    <th className="py-3 px-3">Keterangan Mutasi</th>
                    <th className="py-3 px-3">Aliran</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedEntries.map((e) => {
                    const isCredit = e.direction === 'credit';

                    return (
                      <tr key={e.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                          <div>
                            <span className="block font-medium">
                              {dayjs(e.created_at).format('DD MMMM YYYY')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {dayjs(e.created_at).format('HH:mm')} WIB
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{e.description}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {e.id.slice(0, 8)}...</span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCredit
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            <span>{isCredit ? 'Kredit Masuk' : 'Debit Keluar'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold">
                          <span className={isCredit ? 'text-emerald-400' : 'text-red-400'}>
                            {isCredit ? '+' : '-'} Rp {Number(e.amount).toLocaleString('id-ID')}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                            {e.status}
                          </span>
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
              totalItems={filteredEntries.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada mutasi buku besar yang sesuai kriteria filter.
          </div>
        )}
      </div>
    </div>
  );
};
