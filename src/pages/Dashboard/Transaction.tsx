import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactPaginate from 'react-paginate';
import { PerisaiTalawangIcon } from '../../components/icons/NusantaraIcons';
import Sidebar from '../../components/layout/Sidebar';
import network from '../../libs/network';

dayjs.extend(isBetween);

// Types
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

interface Booking {
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
  data: Booking[];
  meta: Meta;
}

const Transaction: React.FC = () => {
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending'>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, startDate, endDate]);

  // Fetch Data
  const { data, isLoading, isError } = useQuery<BookingResponse>({
    queryKey: ['transactions', page, limit],
    queryFn: async () => {
      const response = await network.get('/booking', {
        params: {
          page,
          limit,
          scope: 'all',
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  // Helper Functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePageClick = (event: { selected: number }): void => {
    setPage(event.selected + 1);
  };

  const filteredItems =
    data?.data.filter((item) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'success'
          ? item.isPaid
          : !item.isPaid;

      const matchesDate =
        startDate && endDate
          ? dayjs(item.created_at).isBetween(startDate, endDate, 'day', '[]')
          : true;

      const matchesSearch = searchQuery.trim()
        ? item.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.expert?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.expert?.suku?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchesStatus && matchesDate && matchesSearch;
    }) || [];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / limit) : 0;

  return (
    <Sidebar title="Riwayat Sesi &amp; Apresiasi">
      <div className="space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#132346]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold font-itim text-white">
                Daftar Bimbingan &amp; Apresiasi Pelestarian
              </h2>
              <p className="text-xs text-slate-400">
                Semua catatan bimbingan tutur bahasa dan apresiasi pelestarian bersama peminat budaya
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kode booking, pakar, atau suku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 bg-[#1E315A] border border-white/10 rounded-xl text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400 w-full sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <select
                className="pl-9 pr-8 py-2 bg-[#1E315A] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-400 cursor-pointer w-full sm:w-44"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Semua Status Sesi</option>
                <option value="success">Terkonfirmasi &amp; Terjadwal</option>
                <option value="pending">Menunggu Konfirmasi</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10 pointer-events-none" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Filter Rentang Tanggal"
                className="pl-9 pr-4 py-2 bg-[#1E315A] border border-white/10 rounded-xl text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400 w-full sm:w-60"
                dateFormat="dd MMM yyyy"
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#132346]/90 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#0F1A34]/80 z-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs text-slate-400">Memuat riwayat sesi...</span>
            </div>
          )}

          {isError ? (
            <div className="flex items-center justify-center h-64 text-red-400 text-sm">
              Gagal memuat daftar riwayat bimbingan &amp; tali asih. Silakan coba beberapa saat lagi.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0F1A34] border-b border-white/10">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Kode Sesi Bimbingan
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Bentuk Sesi
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Apresiasi
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Status Sesi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-xs text-slate-300">
                            {dayjs(transaction.created_at).format('DD MMM YYYY, HH:mm')}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-semibold text-amber-300">
                            {transaction.bookingId}
                          </td>
                          <td className="px-6 py-4 text-xs text-white font-medium">
                            {transaction.sessionType.label}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-200">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                transaction.isPaid
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {transaction.isPaid ? '✓ Terkonfirmasi & Terjadwal' : 'Menunggu Konfirmasi'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-2">
                              <PerisaiTalawangIcon className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-white">
                              Belum Ada Riwayat Sesi Bimbingan
                            </p>
                            <p className="text-xs text-slate-400 max-w-sm">
                              Tidak ada riwayat sesi yang cocok dengan filter yang dipilih saat ini.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.meta.total > 0 && (
                <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F1A34]">
                  <div className="text-xs text-slate-400">
                    Menampilkan <span className="font-semibold text-white">{(page - 1) * limit + 1}</span> -{' '}
                    <span className="font-semibold text-white">{Math.min(page * limit, data.meta.total)}</span> dari{' '}
                    <span className="font-semibold text-amber-300">{data.meta.total}</span> hasil
                  </div>
                  <ReactPaginate
                    previousLabel={<ChevronLeft className="w-4 h-4" />}
                    nextLabel={<ChevronRight className="w-4 h-4" />}
                    breakLabel="..."
                    pageCount={pageCount}
                    forcePage={page - 1}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    containerClassName="flex items-center gap-1.5"
                    pageClassName="rounded-lg"
                    pageLinkClassName="px-3 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/10 text-slate-300 transition-colors"
                    activeLinkClassName="!bg-amber-500 !text-[#132346] !font-bold !border-amber-400"
                    previousLinkClassName="p-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/10 text-slate-300 flex items-center justify-center"
                    nextLinkClassName="p-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/10 text-slate-300 flex items-center justify-center"
                    disabledLinkClassName="opacity-30 cursor-not-allowed"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default Transaction;
