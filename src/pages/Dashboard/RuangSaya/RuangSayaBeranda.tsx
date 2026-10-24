import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FolderHeart,
  GraduationCap,
  MessageSquare,
  Receipt,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type React from 'react';
import { Link, useNavigate } from 'react-router';
import { MandalaKawungIcon, SuryaMajapahitIcon } from '../../../components/icons/NusantaraIcons';
import Button from '../../../components/ui/Button';
import network from '../../../libs/network';
import auth from '../../../libs/auth';

dayjs.locale('id');

interface MeDashboardData {
  user: {
    id: string;
    email: string;
    name: string;
    capabilities: string[];
  };
  nextSession: {
    id: string;
    booking_id: string;
    expert_name: string;
    expert_title: string;
    scheduled_at: string;
    status: string;
    meeting_url: string | null;
  } | null;
  pendingPaymentCount: number;
  expertApplication: {
    id: string;
    stage: number;
    status: string;
    rejection_reason: string | null;
    submitted_at: string | null;
    updated_at: string;
  } | null;
  stats: {
    totalSessions: number;
    completedSessions: number;
    savedCollections: number;
  };
}

interface ActionTask {
  id: string;
  type: string;
  title: string;
  description: string;
  actionUrl: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
}

export const RuangSayaBeranda: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.getUserData();

  const { data: dashboard, isLoading } = useQuery<MeDashboardData>({
    queryKey: ['me-dashboard'],
    queryFn: async () => {
      const res = await network.get('/me/dashboard');
      return res.data;
    },
  });

  const { data: tasksData } = useQuery<{ tasks: ActionTask[] }>({
    queryKey: ['me-tasks'],
    queryFn: async () => {
      const res = await network.get('/me/tasks');
      return res.data;
    },
  });

  const tasks = tasksData?.tasks || [];
  const app = dashboard?.expertApplication;
  const nextSession = dashboard?.nextSession;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#172A53] via-[#101F40] to-[#0A1428] border border-[#d9e6f5] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#eef7f1] text-[#23764b] border border-[#c4e6d2]">
                Ruang Belajar & Konsultasi Budaya
              </span>
              <span className="text-xs text-slate-400">• Akun Pribadi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              Selamat Datang, {user?.name || 'Sahabat Budaya'}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Pusat eksplorasi tradisi Nusantara, pendalaman nilai adiluhung bersama pakar adat terpercaya, dan ruang dialog budaya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/experts">
              <Button
                variant="primary"
                className="kn-primary-cta bg-[#d71920] hover:bg-[#b81218] text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/15 flex items-center gap-2 cursor-pointer text-sm"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>Jelajahi Pakar Budaya</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ornamen Latar Belakang */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 1. Action Center: Tugas & Hal yang Memerlukan Tindakan */}
      {tasks.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Pusat Tindakan & Perhatian ({tasks.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-[#0F1B38] border border-amber-400/20 p-4 flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{task.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{task.description}</p>
                </div>
                <div className="flex items-center justify-end">
                  <Link
                    to={task.actionUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs"
                  >
                    <span>{task.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2 Kolom Grid: Sesi Berikutnya & Status Pengajuan Pakar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Session Card */}
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sesi Konsultasi Mendatang
              </h3>
            </div>
            {nextSession && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Terkonfirmasi
              </span>
            )}
          </div>

          {nextSession ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500/20 to-red-600/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0">
                  {nextSession.expert_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-white truncate">
                    {nextSession.expert_name}
                  </h4>
                  <p className="text-xs text-amber-300 font-medium">{nextSession.expert_title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {dayjs(nextSession.scheduled_at).format('dddd, DD MMMM YYYY - HH:mm')} WIB
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panduan Kesiapan Sesi:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tautan ruang tatap muka interaktif akan aktif 10 menit sebelum sesi dimulai. Pastikan perangkat audio dan mikrofon Anda berfungsi.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to={`/dashboard/konsultasi?bookingId=${nextSession.booking_id}`}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                >
                  Buka Detail Sesi
                </Link>
                <Link
                  to="/dashboard/konsultasi"
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
                >
                  Semua Jadwal
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Belum Ada Sesi Mendatang</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Jadwalkan sesi konsultasi langsung dengan pakar budaya Nusantara untuk bimbingan tradisi dan adat.
                </p>
              </div>
              <Link to="/experts" className="inline-block mt-2">
                <Button variant="outline" className="text-xs font-bold text-amber-300 border-amber-400/30">
                  Cari Jadwal Pakar
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Expert Application Status Card (Hanya jika pengguna pernah mengajukan) */}
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <SuryaMajapahitIcon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Status Pengajuan Pakar Budaya
              </h3>
            </div>
            {app ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 capitalize">
                {app.status.replace(/_/g, ' ')}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-300">
                Terbuka
              </span>
            )}
          </div>

          {app ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Kemajuan Penelaahan Adat:</span>
                  <span className="font-bold text-amber-300">Tahap {app.stage} dari 8</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((app.stage + 1) / 9) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Status Kurasi:</span>
                </div>
                {app.status === 'draft' && (
                  <p className="text-[11px] text-slate-300">
                    Draf pengajuan kepakaran Anda tersimpan aman di server. Lengkapi bukti dan silsilah lalu kirimkan untuk penelaahan.
                  </p>
                )}
                {app.status === 'submitted' && (
                  <p className="text-[11px] text-slate-300">
                    Pengajuan Anda sedang dalam antrean kurasi kredensial dan musyawarah dewan adat. Estimasi proses telaah 3–7 hari kerja.
                  </p>
                )}
                {app.status === 'approved_pending_activation' && (
                  <p className="text-[11px] text-emerald-300 font-medium">
                    Selamat! Pengajuan Anda telah disetujui oleh Dewan Pakar. Silakan aktifkan profil dan konfirmasi kode etik budaya Anda.
                  </p>
                )}
                {app.status === 'revision_required' && (
                  <p className="text-[11px] text-amber-300 font-medium">
                    Dewan penelaah memerlukan perbaikan atau klarifikasi tambahan pada berkas portofolio Anda.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to={app.status === 'draft' || app.status === 'revision_required' ? '/expert/apply' : '/dashboard/application'}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                >
                  {app.status === 'draft'
                    ? 'Lanjutkan Pengisian'
                    : app.status === 'revision_required'
                    ? 'Perbaiki Pengajuan'
                    : app.status === 'approved_pending_activation'
                    ? 'Selesaikan Aktivasi Akun'
                    : 'Buka Timeline & Status'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                <SuryaMajapahitIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Miliki Keahlian Adat atau Tradisi?</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Daftarkan diri Anda sebagai Pakar Budaya KataNusa untuk berkontribusi menjaga dan mewariskan pengetahuan leluhur secara bermartabat.
                </p>
              </div>
              <Link to="/expert/apply" className="inline-block mt-2">
                <Button variant="outline" className="text-xs font-bold text-amber-300 border-amber-400/30">
                  Ajukan Jadi Pakar Budaya
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Lanjutkan Pembelajaran AI & Eksplorasi Cepat */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Eksplorasi Persona AI Budaya Nusantara
            </h3>
          </div>
          <Link
            to="/experts?type=ai"
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua Persona</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-slate-300">
          Berdiskusi interaktif dengan representasi AI persona budaya yang divalidasi oleh dewan adat:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <Link
            to="/experts/ki-anom-sugriwa"
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              K
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Ki Anom Sugriwa
              </h5>
              <p className="text-[11px] text-slate-400 truncate">Falsafah Pewayangan Jawa</p>
            </div>
          </Link>

          <Link
            to="/experts/bli-komang"
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              B
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Bli Komang
              </h5>
              <p className="text-[11px] text-slate-400 truncate">Adat & Tradisi Subak Bali</p>
            </div>
          </Link>

          <Link
            to="/experts/datuk-parpatiah"
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              D
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Datuk Parpatiah
              </h5>
              <p className="text-[11px] text-slate-400 truncate">Kearifan Minangkabau</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
