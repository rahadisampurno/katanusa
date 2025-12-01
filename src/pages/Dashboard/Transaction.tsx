/* eslint-disable import/no-extraneous-dependencies */
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import ReactPaginate from 'react-paginate';
import Sidebar from '../../components/layout/Sidebar';
import 'react-datepicker/dist/react-datepicker.css';

dayjs.extend(isBetween);

// Types
interface Transaction {
  id: string;
  date: string;
  transactionId: string;
  bookingSession: string;
  fee: number;
  status: 'success' | 'pending' | 'failed';
}

// Mock Data
const generateMockData = (count: number): Transaction[] => {
  const statuses: ('success' | 'pending' | 'failed')[] = [
    'success',
    'pending',
    'failed',
  ];
  const sessions = [
    'Konsultasi Karir',
    'Review CV',
    'Mock Interview',
    'Mentoring 1-on-1',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `tr-${i + 1}`,
    date: dayjs()
      .subtract(Math.floor(Math.random() * 30), 'day')
      .format('YYYY-MM-DD'),
    transactionId: `TRX-${Math.floor(Math.random() * 1000000)}`,
    bookingSession: sessions[Math.floor(Math.random() * sessions.length)],
    fee: Math.floor(Math.random() * 500000) + 50000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const mockTransactions = generateMockData(50);

const Transaction: React.FC = () => {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [filteredTransactions, setFilteredTransactions] =
    useState<Transaction[]>(mockTransactions);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'success' | 'pending'
  >('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const handleFilterChange = useCallback(() => {
    let result = transactions;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filter by date range
    if (startDate && endDate) {
      result = result.filter((t) =>
        dayjs(t.date).isBetween(startDate, endDate, 'day', '[]'),
      );
    }

    setTimeout(() => {
      setFilteredTransactions(result);
      setCurrentPage(0); // Reset to first page on filter change
    }, 3000);
  }, [statusFilter, startDate, endDate, transactions]);

  // Filter Logic
  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  // Pagination Logic
  const offset = currentPage * itemsPerPage;
  const currentItems = filteredTransactions.slice(
    offset,
    offset + itemsPerPage,
  );
  const pageCount = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handlePageClick = (event: { selected: number }): void => {
    setCurrentPage(event.selected);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {currentItems.length > 0 ? (
                  currentItems.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {dayjs(transaction.date).format('DD MMM YYYY')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.bookingSession}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(transaction.fee)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
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
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{offset + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(offset + itemsPerPage, filteredTransactions.length)}
                </span>{' '}
                of{' '}
                <span className="font-medium">
                  {filteredTransactions.length}
                </span>{' '}
                results
              </div>
              <ReactPaginate
                previousLabel={<ChevronLeft className="w-4 h-4" />}
                nextLabel={<ChevronRight className="w-4 h-4" />}
                breakLabel="..."
                pageCount={pageCount}
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
        </div>
      </div>
    </Sidebar>
  );
};

export default Transaction;
