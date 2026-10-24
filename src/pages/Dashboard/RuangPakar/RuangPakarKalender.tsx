import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import network from '../../../libs/network';

const defaultSchedule = [
  { weekday: 1, day: 'Senin', enabled: true, start: '09:00', end: '17:00' },
  { weekday: 2, day: 'Selasa', enabled: true, start: '09:00', end: '17:00' },
  { weekday: 3, day: 'Rabu', enabled: true, start: '09:00', end: '17:00' },
  { weekday: 4, day: 'Kamis', enabled: true, start: '09:00', end: '17:00' },
  { weekday: 5, day: 'Jumat', enabled: true, start: '13:30', end: '17:00' },
  { weekday: 6, day: 'Sabtu', enabled: true, start: '10:00', end: '15:00' },
  { weekday: 0, day: 'Minggu', enabled: false, start: '09:00', end: '15:00' },
];

export const RuangPakarKalender: React.FC = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule);

  const [bufferTime, setBufferTime] = useState<number>(15);

  const { data } = useQuery<{
    availability: Array<{ weekday: number; startsAt: string; endsAt: string }>;
    settings: { bufferMinutes: number; bookingNoticeHours: number; bookingHorizonDays: number };
  }>({
    queryKey: ['expert-availability'],
    queryFn: async () => (await network.get('/expert/availability')).data,
  });

  useEffect(() => {
    if (!data) return;
    setWeeklySchedule(defaultSchedule.map((day) => {
      const stored = data.availability.find((entry) => entry.weekday === day.weekday);
      return stored
        ? { ...day, enabled: true, start: stored.startsAt.slice(0, 5), end: stored.endsAt.slice(0, 5) }
        : { ...day, enabled: false };
    }));
    setBufferTime(data.settings.bufferMinutes);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => network.put('/expert/availability', {
      availability: weeklySchedule
        .filter((item) => item.enabled)
        .map((item) => ({ weekday: item.weekday, startsAt: item.start, endsAt: item.end })),
      settings: {
        bufferMinutes: bufferTime,
        bookingNoticeHours: data?.settings.bookingNoticeHours ?? 24,
        bookingHorizonDays: data?.settings.bookingHorizonDays ?? 90,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability'] });
      setNotice('Jadwal ketersediaan konsultasi tersimpan di kalender operasional.');
      setTimeout(() => setNotice(''), 3000);
    },
    onError: () => setNotice('Jadwal belum dapat disimpan. Periksa rentang waktu yang dipilih.'),
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Kalender & Ketersediaan Sesi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Atur jam praktik bimbingan budaya, waktu jeda antar sesi, dan hari istirahat tradisi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Jadwal</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Pengaturan Jeda Sesi */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pengaturan Jeda Antar Sesi (Buffer Time)
          </h3>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <h4 className="text-xs font-bold text-white">Waktu Istirahat & Persiapan Sesi</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Jeda otomatis agar Anda memiliki waktu mencatat hasil konsultasi sebelum sesi berikutnya dimulai.
            </p>
          </div>
          <select
            value={bufferTime}
            onChange={(e) => setBufferTime(Number(e.target.value))}
            className="bg-[#0F1B38] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
          >
            <option value={10}>10 Menit</option>
            <option value={15}>15 Menit (Rekomendasi)</option>
            <option value={30}>30 Menit</option>
          </select>
        </div>
      </div>

      {/* Jadwal Mingguan */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Hari & Jam Praktik Rutin Mingguan
          </h3>
        </div>

        <div className="space-y-3">
          {weeklySchedule.map((item, idx) => (
            <div
              key={item.day}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                item.enabled
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/2 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => {
                    const next = [...weeklySchedule];
                    next[idx].enabled = e.target.checked;
                    setWeeklySchedule(next);
                  }}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-0 bg-slate-800 border-white/20"
                />
                <span className="text-xs font-bold text-white w-20">{item.day}</span>
              </div>

              {item.enabled ? (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="time"
                    value={item.start}
                    onChange={(e) => {
                      const next = [...weeklySchedule];
                      next[idx].start = e.target.value;
                      setWeeklySchedule(next);
                    }}
                    className="bg-[#0F1B38] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <span>sampai</span>
                  <input
                    type="time"
                    value={item.end}
                    onChange={(e) => {
                      const next = [...weeklySchedule];
                      next[idx].end = e.target.value;
                      setWeeklySchedule(next);
                    }}
                    className="bg-[#0F1B38] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <span className="text-slate-400 text-[11px] ml-1">WIB</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">Libur / Tidak Praktik</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
