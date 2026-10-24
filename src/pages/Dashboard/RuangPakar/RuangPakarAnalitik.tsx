import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type React from 'react';

export const RuangPakarAnalitik: React.FC = () => {
  const domainInterests = [
    { name: 'Filosofi & Nilai Kearifan Hidup', percentage: 42, count: 28 },
    { name: 'Seni Pertunjukan & Sastra Klasik', percentage: 31, count: 21 },
    { name: 'Kriya, Wastra & Tenun Tradisional', percentage: 18, count: 12 },
    { name: 'Hukum Adat & Tata Nilai Silsilah', percentage: 9, count: 6 },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
          Analitik Praktik & Wawasan Budaya
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Wawasan berkala untuk memahami minat generasi muda dan penikmat budaya terhadap tradisi yang Anda ampu.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Jam Bimbingan</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">48 Jam</p>
          <span className="text-[11px] text-emerald-400">+12% dari bulan sebelumnya</span>
        </div>

        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indeks Kepuasan Murid</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">4.9 / 5.0</p>
          <span className="text-[11px] text-slate-400">Dari seluruh sesi terverifikasi</span>
        </div>

        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tingkat Keterhadiran</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">98%</p>
          <span className="text-[11px] text-slate-400">Disiplin waktu sesi tepat</span>
        </div>
      </div>

      {/* Minat Domain Tradisi */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Distribusi Topik Tradisi Paling Diminati
          </h3>
        </div>

        <div className="space-y-3.5">
          {domainInterests.map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="text-slate-400 text-[11px]">
                  {item.count} Sesi ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-amber-500 to-amber-400 h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privasi Pemberitahuan */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          Seluruh data analitik dihitung secara agregat dan anonim dengan batas privasi (k-anonymity) guna melindungi privasi murid bimbingan Anda.
        </span>
      </div>
    </div>
  );
};
