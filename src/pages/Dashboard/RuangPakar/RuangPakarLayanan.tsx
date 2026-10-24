import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Heart,
  Save,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import network from '../../../libs/network';

export const RuangPakarLayanan: React.FC = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(150000);

  const { data: serviceData } = useQuery<{
    services: Array<{
      serviceKey: string;
      title: string;
      description: string;
      durationMinutes: number;
      priceMinor: number;
      isActive: boolean;
    }>;
  }>({
    queryKey: ['expert-services'],
    queryFn: async () => {
      const res = await network.get('/expert/services');
      const hourlyService = res.data?.services?.find((service: { serviceKey: string }) => service.serviceKey === 'pendalaman');
      if (hourlyService?.priceMinor) {
        setHourlyRate(hourlyService.priceMinor);
      }
      return res.data;
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      await network.put('/expert/services', {
        services: services.map((service) => ({
          serviceKey: service.serviceKey,
          title: service.title,
          description: service.description,
          durationMinutes: service.durationMinutes,
          priceMinor: Math.round((rate * service.multiplier) / 1000) * 1000,
          isActive: true,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-services'] });
      setNotice('Nilai apresiasi bimbingan budaya berhasil diperbarui.');
      setTimeout(() => setNotice(''), 3000);
    },
  });

  const services = [
    {
      serviceKey: 'santai',
      title: 'Sesi Diskusi Santai Budaya',
      durationMinutes: 30,
      description: 'Dialog interaktif pengantar tradisi, tanya jawab ringan adat Nusantara, dan konsultasi nilai kearifan.',
      multiplier: 0.67,
    },
    {
      serviceKey: 'pendalaman',
      title: 'Sesi Pendalaman Nilai & Tradisi',
      durationMinutes: 60,
      description: 'Bedah komprehensif filosofi adat, makna filosofis ritual, panduan silsilah, atau apresiasi seni pertunjukan.',
      multiplier: 1.0,
    },
    {
      serviceKey: 'workshop',
      title: 'Workshop Privat & Panduan Pustaka',
      durationMinutes: 90,
      description: 'Bimbingan intensif privat tatap muka disertai dokumen rangkuman panduan adat terkurasi.',
      multiplier: 1.67,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Layanan & Bentuk Apresiasi Budaya
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Penetapan bentuk sesi bimbingan tradisi dan nilai apresiasi untuk mendukung pelestarian pengetahuan leluhur.
          </p>
        </div>

        <button
          type="button"
          onClick={() => updateRateMutation.mutate(hourlyRate)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Nilai Dasar Apresiasi */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Heart className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Nilai Dasar Apresiasi Bimbingan (Per 60 Menit)
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">Standar Tali Asih & Apresiasi Sanggar</h4>
            <p className="text-[11px] text-slate-300 max-w-lg leading-relaxed">
              Dukungan apresiasi dari penikmat budaya diperuntukkan guna mendukung dedikasi pakar, pemeliharaan sanggar, dan kesinambungan pewarisan nilai adat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Rp</span>
            <input
              type="number"
              value={hourlyRate}
              step={10000}
              min={50000}
              max={2000000}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-32 bg-[#0F1B38] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Bentuk Sesi Konsultasi */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Wallet className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Paket Bimbingan & Sesi Konsultasi Tersedia
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {services.map((s) => {
            const calculatedPrice = Math.round((hourlyRate * s.multiplier) / 1000) * 1000;

            return (
              <div
                key={s.title}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{s.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-400/20">
                      {s.durationMinutes} Menit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                    {s.description}
                  </p>
                </div>

                <div className="text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className="text-[10px] text-slate-400 block">Nilai Apresiasi:</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    Rp {calculatedPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        {serviceData?.services.length ?? 0} versi layanan aktif tersimpan di sistem. Harga yang dipilih pengguna akan disalin ke pesanan agar histori tetap konsisten.
      </p>
    </div>
  );
};
