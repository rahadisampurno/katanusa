import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from '../../components/layout/Sidebar';
import network from '../../libs/network';

// Set locale
dayjs.locale('id');

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
  createdBy: any;
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

const Dashboard: React.FC = () => {
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch data
  // We fetch a larger limit to calculate metrics and chart data client-side
  // since we don't have dedicated dashboard endpoints yet.
  const { data: bookingData, isLoading } = useQuery<BookingResponse>({
    queryKey: ['dashboard-bookings'],
    queryFn: async () => {
      const response = await network.get('/booking', {
        params: {
          page: 1,
          limit: 100, // Fetch enough for metrics
        },
      });
      return response.data;
    },
  });

  // Calculate Metrics
  const bookings = bookingData?.data || [];
  const totalBookings = bookingData?.meta?.total || 0;

  // Total Paid Transactions (from the fetched set)
  // Note: This is an approximation based on fetched limit if total > limit
  const totalPaidTransactions = bookings.filter((b) => b.isPaid).length;

  // Monthly Revenue
  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();
  const monthlyRevenue = bookings
    .filter((b) => {
      const date = dayjs(b.created_at);
      return (
        b.isPaid && date.month() === currentMonth && date.year() === currentYear
      );
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day');
    const dayName = date.format('ddd'); // Sen, Sel, etc.

    const total = bookings
      .filter((b) => {
        return b.isPaid && dayjs(b.created_at).isSame(date, 'day');
      })
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return { name: dayName, total };
  });

  // Lazy Load Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && bookings.length > 0) {
          setTimeout(() => {
            setVisibleTransactions((prev) =>
              Math.min(prev + 3, bookings.length),
            );
          }, 500);
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return (): void => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [bookings.length]);

  return (
    <Sidebar title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow overflow-hidden flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">
              Total Jadwal Konsultasi
            </h2>
            <p className="text-4xl lg:text-6xl font-bold text-red-600 overflow-hidden text-ellipsis">
              {isLoading ? '...' : totalBookings}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow overflow-hidden flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">Total Transaksi</h2>
            <p className="text-4xl lg:text-6xl font-bold text-red-600 overflow-hidden text-ellipsis">
              {isLoading ? '...' : totalPaidTransactions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">Pendapatan Bulan Ini</h2>
            <p className="text-3xl lg:text-5xl font-bold text-red-600 overflow-hidden text-ellipsis">
              {isLoading
                ? '...'
                : new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(monthlyRevenue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow col-span-2">
            <h2 className="text-xl font-semibold mb-4">Transaksi 7 hari</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(value)
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#dc2626' }}
                    activeDot={{ r: 6, fill: '#dc2626' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Transaksi terbaru</h2>
            <div className="flex flex-col gap-6 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="w-full h-full flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : bookings.length > 0 ? (
                bookings.slice(0, visibleTransactions).map((transaction) => (
                  <div key={transaction.id} className="flex flex-col gap-1">
                    <h4 className="text-red-600 font-semibold text-sm">
                      {transaction.sessionType.label}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      <span className="font-medium text-gray-900">
                        {transaction.expert.name}
                      </span>{' '}
                      booked by{' '}
                      {transaction.createdBy?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {dayjs(transaction.created_at).format('DD MMM YYYY')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center my-auto">
                  Belum ada transaksi
                </p>
              )}

              {/* Lazy Load Loading Indicator */}
              {!isLoading && visibleTransactions < bookings.length && (
                <div
                  ref={observerTarget}
                  className="w-full py-4 flex justify-center"
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Dashboard;
