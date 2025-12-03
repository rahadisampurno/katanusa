import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactPaginate from 'react-paginate';
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

  // Filters State (Client-side for now as API only supports page/limit)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'success' | 'pending'
  >('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;

  // Fetch Data
  const { data, isLoading, isError } = useQuery<BookingResponse>({
    queryKey: ['bookings', page, limit],
    queryFn: async () => {
      const response = await network.get('/booking', {
        params: {
          page,
          limit,
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

  const getStatusColor = (isPaid: boolean): string => {
    return isPaid
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (isPaid: boolean): string => {
    return isPaid ? 'success' : 'pending';
  };

  const handlePageClick = (event: { selected: number }): void => {
    setPage(event.selected + 1);
  };

  // Client-side filtering (applied to the fetched page)
  // Note: Ideally filtering should be server-side.
  // Since the prompt specified only page/limit for the API,
  // we filter the displayed data.
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

      return matchesStatus && matchesDate;
    }) || [];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / limit) : 0;

  return (
    <Sidebar title="Transaction History">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none bg-white w-full sm:w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="relative z-10">
              <CalendarIcon className="absolute left-3 top-1/2 z-10 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                }}
                placeholderText="Filter by Date Range"
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none w-full sm:w-64"
                dateFormat="dd MMM yyyy"
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          )}

          {isError ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              Failed to load transactions. Please try again.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Booking Session
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {dayjs(transaction.created_at).format(
                              'DD MMM YYYY',
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {transaction.bookingId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {transaction.sessionType.label}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.isPaid)}`}
                            >
                              {getStatusText(transaction.isPaid)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.meta.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                  <div className="text-sm text-gray-500">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, data.meta.total)}
                    </span>{' '}
                    of <span className="font-medium">{data.meta.total}</span>{' '}
                    results
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
                    containerClassName="flex items-center gap-2"
                    pageClassName="rounded-md"
                    pageLinkClassName="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 text-gray-600 transition-colors"
                    activeLinkClassName="!bg-red-600 !text-white !border-red-600"
                    previousClassName="rounded-md"
                    previousLinkClassName="p-1 block border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    nextClassName="rounded-md"
                    nextLinkClassName="p-1 block border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    breakClassName="text-gray-400"
                    disabledClassName="opacity-50 cursor-not-allowed"
                    renderOnZeroPageCount={null}
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
