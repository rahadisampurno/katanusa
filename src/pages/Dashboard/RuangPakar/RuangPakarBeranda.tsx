import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Video,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { Link } from 'react-router';
import { SuryaMajapahitIcon } from '../../../components/icons/NusantaraIcons';
import Button from '../../../components/ui/Button';
import auth from '../../../libs/auth';
import network from '../../../libs/network';

dayjs.locale('id');

interface ExpertDashboardData {
  profile: {
    id: string;
    slug: string;
    public_name: string;
    title: string;
    bio: string;
    community: string;
    region: string;
    domains: string[];
    hourly_rate: number;
    image_url: string;
    status: string;
    is_published: boolean;
  };
  upcomingSessions: Array<{
    id: string;
    booking_id: string;
    client_name: string;
    scheduled_at: string;
    status: string;
    notes: string | null;
    meeting_url: string | null;
  }>;
  pendingRequestsCount: number;
  stats: {
    completedSessions: number;
    balanceAvailable: number;
    balancePending: number;
  };
}

export const RuangPakarBeranda: React.FC = () => {
  const user = auth.getUserData();

  const { data, isLoading } = useQuery<ExpertDashboardData>({
    queryKey: ['expert-dashboard'],
    queryFn: async () => {
      const res = await network.get('/expert/dashboard');
      return res.data;
    },
  });

  const profile = data?.profile;
  const sessions = data?.upcomingSessions || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#172A53] via-[#101F40] to-[#0A1428] border border-[#d9e6f5] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#fff8e9] text-[#b85d19] border border-[#f5dfb8] flex items-center gap-1.5 shadow-xs">
                <SuryaMajapahitIcon className="w-3.5 h-3.5 text-[#b85d19]" />
                <span>Ruang Praktik Pakar Budaya</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eef7f1] text-[#23764b] border border-[#c4e6d2]">
                Terverifikasi Adat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              {profile?.public_name || user?.name || 'Pakar Terhormat'}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              {profile?.title || 'Pengampu & Penjaga Tradisi Nusantara'}. Mengayomi penikmat budaya, mewariskan kearifan leluhur dengan integritas adiluhung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/pakar/profil">
              <Button variant="outline" className="text-xs font-bold bg-white hover:bg-slate-50 text-[#17294b] border-[#cdd9e8] shadow-xs px-4 py-2.5 rounded-xl">
                Edit Profil Praktik
              </Button>
            </Link>
            <Link to="/dashboard/pakar/kalender">
              <Button variant="primary" className="kn-primary-cta text-xs font-bold bg-[#d71920] hover:bg-[#b81218] text-white shadow-md px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span>Atur Ketersediaan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ornamen Latar Belakang */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Ringkasan Praktik & Kesehatan Keuangan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718096] text-xs">
            <span>Sesi Terselesaikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#17294b]">{stats?.completedSessions ?? 0} Sesi</p>
          <span className="text-[11px] text-[#718096]">Total konsultasi adiluhung terlaksana</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718096] text-xs">
            <span>Apresiasi Tersedia (Ledger)</span>
            <Wallet className="w-4 h-4 text-[#ba1d28]" />
          </div>
          <p className="text-2xl font-bold text-[#ba1d28]">
            Rp {(stats?.balanceAvailable ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-[#718096]">Siap dicairkan ke rekening resmi</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718096] text-xs">
            <span>Apresiasi Tertahan (Escrow)</span>
            <Clock className="w-4 h-4 text-[#29415f]" />
          </div>
          <p className="text-2xl font-bold text-[#17294b]">
            Rp {(stats?.balancePending ?? 0).toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-[#718096]">Menunggu penyelesaian sesi mendatang</span>
        </div>
      </div>

      {/* Sesi Mendatang & Konsultasi Perlu Tindakan */}
      <div className="rounded-2xl bg-white border border-[#dce7f5] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f4f9] pb-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#d71920]" />
            <h3 className="text-sm font-bold text-[#17294b] uppercase tracking-wider">
              Sesi Konsultasi Terjadwal (7 Hari ke Depan)
            </h3>
          </div>
          <Link
            to="/dashboard/pakar/permintaan"
            className="text-xs text-[#d71920] hover:text-[#b81218] font-bold"
          >
            Lihat Semua Jadwal
          </Link>
        </div>

        {sessions.length > 0 ? (
          <div className="divide-y divide-[#f0f4f9]">
            {sessions.map((s) => (
              <div
                key={s.booking_id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#fff8e9] border border-[#f5dfb8] flex items-center justify-center text-[#b85d19] font-bold shrink-0">
                    {s.client_name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#17294b]">#{s.booking_id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eef7f1] text-[#23764b] border border-[#c4e6d2]">
                        Terkonfirmasi
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#17294b]">{s.client_name}</h4>
                    <div className="flex items-center gap-2 text-xs text-[#536176]">
                      <Clock className="w-3.5 h-3.5 text-[#718096]" />
                      <span>{dayjs(s.scheduled_at).format('dddd, DD MMMM YYYY - HH:mm')} WIB</span>
                    </div>
                    {s.notes && (
                      <p className="text-[11px] text-[#718096] italic pt-1">
                        Catatan pengantar: &ldquo;{s.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`Ruang temu pakar #${s.booking_id} akan dibuka saat sesi dimulai.`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#23764b] hover:bg-[#1b5c3a] text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                  >
                    <Video className="w-3.5 h-3.5 text-white" />
                    <span>Ruang Temu Pakar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#f4f8ff] text-[#29415f] flex items-center justify-center border border-[#dce7f5]">
              <Calendar className="w-6 h-6 text-[#29415f]" />
            </div>
            <p className="text-sm font-bold text-[#17294b]">Belum Ada Sesi Konsultasi Terjadwal</p>
            <p className="text-xs text-[#718096] max-w-sm">
              Sesi bimbingan budaya yang dipesan oleh penikmat dan pembelajar untuk 7 hari ke depan akan otomatis tercatat di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
