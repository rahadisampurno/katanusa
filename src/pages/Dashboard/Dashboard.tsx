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

const data = [
  { name: 'Sen', total: 4000 },
  { name: 'Sel', total: 3000 },
  { name: 'Rab', total: 2000 },
  { name: 'Kam', total: 2780 },
  { name: 'Jum', total: 1890 },
  { name: 'Sab', total: 2390 },
  { name: 'Min', total: 3490 },
];

const recentTransactions = [
  {
    id: 1,
    package: 'Paket Konsultasi Basic',
    date: '2025-12-01',
    createdBy: 'Farah just booked',
  },
  {
    id: 2,
    package: 'Paket Konsultasi Premium',
    date: '2025-12-01',
    createdBy: 'Budi just booked',
  },
  {
    id: 3,
    package: 'Paket Konsultasi Enterprise',
    date: '2025-11-30',
    createdBy: 'Siti just booked',
  },
  {
    id: 4,
    package: 'Paket Konsultasi Basic',
    date: '2025-11-29',
    createdBy: 'Rudi just booked',
  },
  {
    id: 5,
    package: 'Paket Konsultasi Premium',
    date: '2025-11-28',
    createdBy: 'Ani just booked',
  },
  {
    id: 6,
    package: 'Paket Konsultasi Basic',
    date: '2025-11-27',
    createdBy: 'Joko just booked',
  },
  {
    id: 7,
    package: 'Paket Konsultasi Premium',
    date: '2025-11-26',
    createdBy: 'Maya just booked',
  },
  {
    id: 8,
    package: 'Paket Konsultasi Enterprise',
    date: '2025-11-25',
    createdBy: 'Bayu just booked',
  },
  {
    id: 9,
    package: 'Paket Konsultasi Basic',
    date: '2025-11-24',
    createdBy: 'Dina just booked',
  },
  {
    id: 10,
    package: 'Paket Konsultasi Premium',
    date: '2025-11-23',
    createdBy: 'Reza just booked',
  },
];

const Dashboard: React.FC = () => {
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            setVisibleTransactions((prev) =>
              Math.min(prev + 3, recentTransactions.length),
            );
          }, 500); // Simulate loading delay
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
  }, []);

  return (
    <Sidebar title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow overflow-hidden flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">
              Total Jadwal Konsultasi
            </h2>
            <p className="text-4xl lg:text-6xl font-bold text-red-600 overflow-hidden text-ellipsis">
              120
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow overflow-hidden flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">Total Transaksi</h2>
            <p className="text-4xl lg:text-6xl font-bold text-red-600 overflow-hidden text-ellipsis">
              10
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow flex flex-col gap-1">
            <h2 className="text-xl font-semibold mb-2">
              Pendapatan Bulan Ini (ribuan)
            </h2>
            <p className="text-4xl lg:text-5xl font-bold text-red-600 overflow-hidden text-ellipsis">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(50)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md transition-shadow col-span-2">
            <h2 className="text-xl font-semibold mb-4">Transaksi 7 hari</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
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
                  <Tooltip />
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Transaksi terbaru</h2>
            <div className="flex flex-col gap-6 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {recentTransactions
                .slice(0, visibleTransactions)
                .map((transaction) => (
                  <div key={transaction.id} className="flex flex-col gap-1">
                    <h4 className="text-red-600 font-semibold text-sm">
                      {transaction.package}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      <span className="font-medium text-gray-900">
                        {transaction.createdBy.split(' just ')[0]}
                      </span>{' '}
                      just {transaction.createdBy.split(' just ')[1]}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {transaction.date}
                    </p>
                  </div>
                ))}
              {visibleTransactions < recentTransactions.length && (
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
