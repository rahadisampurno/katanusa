import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Button from '../../../components/ui/Button';
import network from '../../../libs/network';
import auth from '../../../libs/auth';
import {
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../../../components/icons/NusantaraIcons';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface ApplicationData {
  legalName?: string;
  publicName?: string;
  title?: string;
  bio?: string;
  community?: string;
  region?: string;
  domains?: string[];
  phoneNumber?: string;
  portfolioUrl?: string;
  hourlyRate?: number;
}

interface ClaimItem {
  id?: string;
  domain: string;
  basis: string;
  description: string;
  is_high_risk: boolean;
  verification_status?: string;
}

interface CredentialItem {
  id?: string;
  issuer: string;
  credential_type: string;
  issued_on?: string;
  expires_on?: string;
  verification_status?: string;
}

interface ReferenceItem {
  id?: string;
  name: string;
  contact_ciphertext?: string;
  consent_status: string;
  verification_status?: string;
}

interface EvidenceItem {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | string;
  purpose: string;
  classification: string;
  scan_status: string;
  created_at: string;
}

interface ReviewItem {
  id: string;
  stage: string;
  outcome: string;
  notes: string;
  created_at: string;
}

interface ApplicationResponse {
  application: {
    id: string;
    stage: number;
    status: string;
    data: ApplicationData;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    updated_at: string;
  } | null;
  claims?: ClaimItem[];
  credentials?: CredentialItem[];
  references?: ReferenceItem[];
  evidence?: EvidenceItem[];
  reviews?: ReviewItem[];
}

const STAGES_TIMELINE = [
  { id: 1, name: 'Kelayakan Dasar', desc: 'Pemeriksaan integritas & data kontak' },
  { id: 2, name: 'Identitas Legal (KYC)', desc: 'Validasi dokumen resmi privat' },
  { id: 3, name: 'Kredensial & Rekam Jejak', desc: 'Verifikasi portofolio & karya' },
  { id: 4, name: 'Otoritas & Adat Nusantara', desc: 'Telaah dewan adat atas mandat tradisi' },
  { id: 5, name: 'Referensi & Musyawarah', desc: 'Konfirmasi tetua & perbincangan kurator' },
  { id: 6, name: 'Keputusan & Aktivasi', desc: 'Persetujuan akhir dewan kurator' },
];

export const CandidateApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.getUserData();
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<ApplicationResponse | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Activation checklist state
  const [agreeCodeOfConduct, setAgreeCodeOfConduct] = useState(false);
  const [confirmRagConsent, setConfirmRagConsent] = useState(true);
  const [activating, setActivating] = useState(false);

  // Appeal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealGrounds, setAppealGrounds] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Withdraw state
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await network.get<ApplicationResponse>('/expert/application');
      setAppData(res.data);
    } catch (err) {
      console.error('Gagal memuat status pengajuan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const handleActivate = async () => {
    if (!agreeCodeOfConduct) {
      setActionError('Anda wajib menyetujui Piagam Etika & Kode Etik Pakar Budaya.');
      return;
    }
    if (user?.assuranceLevel !== 'AAL2') {
      setActionError('Aktivasi akun pakar mewajibkan Autentikasi Dua Faktor (AAL2). Silakan aktifkan MFA di menu Profil.');
      return;
    }

    setActivating(true);
    setActionError('');
    setActionSuccess('');

    try {
      await network.post('/expert/application/activate', {});
      setActionSuccess('Selamat! Akun Pakar Budaya Anda telah aktif. Mengalihkan ke Ruang Pakar...');
      setTimeout(() => {
        navigate('/dashboard/pakar');
      }, 2000);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal mengaktifkan akun pakar.';
      setActionError(msg || 'Gagal mengaktifkan akun.');
      setActivating(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setActionError('');
    try {
      await network.post('/expert/application/withdraw', {});
      setShowWithdrawConfirm(false);
      await fetchApplication();
      setActionSuccess('Pengajuan pakar berhasil ditarik.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal menarik pengajuan.';
      setActionError(msg || 'Gagal menarik pengajuan.');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAppeal = async () => {
    if (appealGrounds.trim().length < 20) {
      setActionError('Alasan banding minimal 20 karakter.');
      return;
    }
    setSubmittingAppeal(true);
    setActionError('');
    try {
      await network.post('/expert/application/appeal', { grounds: appealGrounds });
      setShowAppealModal(false);
      setAppealGrounds('');
      await fetchApplication();
      setActionSuccess('Banding berhasil diajukan dan akan ditinjau dewan kehormatan.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal mengajukan banding.';
      setActionError(msg || 'Gagal mengajukan banding.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const app = appData?.application;
  const claims = appData?.claims || [];
  const credentials = appData?.credentials || [];
  const references = appData?.references || [];
  const evidence = appData?.evidence || [];
  const reviews = appData?.reviews || [];
  const latestReview = reviews[0];

  // Helper render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">
            <Clock className="w-3.5 h-3.5" />
            Draf Belum Dikirimkan
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Clock className="w-3.5 h-3.5" />
            Pengajuan Diterima — Menunggu Antrean Kurasi
          </span>
        );
      case 'completeness_review':
      case 'identity_review':
      case 'credential_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sedang Ditinjau: Verifikasi Kredensial &amp; KYC
          </span>
        );
      case 'cultural_review':
      case 'interview_or_reference_check':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <PerisaiTalawangIcon className="w-3.5 h-3.5" />
            Sedang Ditinjau: Telaah Otoritas Budaya &amp; Musyawarah Adat
          </span>
        );
      case 'revision_required':
      case 'clarification_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Memerlukan Perbaikan / Klarifikasi Tambahan
          </span>
        );
      case 'approved_pending_activation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Disetujui — Menunggu Aktivasi Akun
          </span>
        );
      case 'activated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Akun Pakar Terverifikasi Aktif
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-400/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Pengajuan Belum Memenuhi Kriteria
          </span>
        );
      case 'appealed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <RotateCcw className="w-3.5 h-3.5" />
            Banding Sedang Ditinjau Dewan Kehormatan
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-600 text-gray-300">
            Pengajuan Ditarik
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">
              <PerisaiTalawangIcon className="w-4 h-4" />
              <span>Portal Penjaga Tradisi Nusantara</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">
              Status &amp; Timeline Verifikasi Kepakaran
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/expert/apply">
              <Button variant="outline" className="text-xs">
                {app?.status === 'draft' ? 'Lanjutkan Pengisian' : 'Edit / Lihat Draf Pengajuan'}
              </Button>
            </Link>
            {app?.status === 'activated' && (
              <Link to="/dashboard/pakar">
                <Button variant="primary" className="text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Buka Ruang Pakar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Global Notices */}
        {actionError && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            <Clock className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
            Memuat status pengajuan kepakaran...
          </div>
        ) : !app ? (
          <div className="rounded-2xl bg-[#1e293b] border border-white/10 p-10 text-center space-y-4">
            <SuryaMajapahitIcon className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Anda Belum Mengajukan Diri Sebagai Pakar</h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              KataNusa membuka kesempatan bagi para penjaga tradisi, akademisi, sastrawan, dan budayawan adat Nusantara untuk berjejaring dan berbagi ilmu adiluhung.
            </p>
            <Link to="/expert/apply" className="inline-block pt-2">
              <Button variant="primary" className="text-sm">
                Mulai Pengajuan Pakar Budaya
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Main Status Card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1e293b] to-[#132346] border border-white/10 p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Status Pengajuan Terkini
                  </span>
                  <div className="flex items-center gap-3">
                    {renderStatusBadge(app.status)}
                  </div>
                </div>

                <div className="text-xs text-gray-400 md:text-right space-y-1">
                  {app.submitted_at ? (
                    <p>Dikirimkan pada: <strong className="text-white">{dayjs(app.submitted_at).format('DD MMMM YYYY, HH:mm')} WIB</strong></p>
                  ) : (
                    <p>Terakhir disimpan: <strong className="text-white">{dayjs(app.updated_at).format('DD MMMM YYYY, HH:mm')} WIB</strong></p>
                  )}
                  <p className="text-amber-300/80">SLA Kurasi: 3 – 5 Hari Kerja Musyawarah Adat</p>
                </div>
              </div>

              {/* Revision Required Card */}
              {latestReview && (app.status === 'revision_required' || app.status === 'clarification_required') && (
                <div className="mt-6 p-5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <span>Catatan Perbaikan dari Dewan Kurator</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-900/90 border border-amber-400/20 font-mono text-amber-100 whitespace-pre-wrap">
                    {latestReview.notes}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-400 text-[11px]">
                      Ditinjau pada: {dayjs(latestReview.created_at).format('DD MMM YYYY, HH:mm')}
                    </span>
                    <Link to="/expert/apply">
                      <Button variant="primary" className="text-xs">
                        Perbaiki Pengajuan Sekarang
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Approved Pending Activation Banner */}
              {app.status === 'approved_pending_activation' && (
                <div className="mt-6 p-6 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-xs space-y-4">
                  <div className="flex items-center gap-2.5 font-bold text-emerald-300 text-base">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <span>Selamat! Kredensial dan Kepakaran Budaya Anda Telah Disetujui</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Dewan Kurator Kebudayaan telah memvalidasi rekam jejak dan otoritas tradisi Anda. Untuk membuka Ruang Pakar, menerima jadwal bimbingan, dan mengaktifkan profil publik, selesaikan checklist aktivasi di bawah ini:
                  </p>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3.5">
                    {/* 1. MFA Check */}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded-full ${user?.assuranceLevel === 'AAL2' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user?.assuranceLevel === 'AAL2' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="text-xs flex-1">
                        <span className="font-bold text-white">Autentikasi Dua Faktor (MFA / AAL2)</span>
                        <p className="text-gray-400 mt-0.5">
                          {user?.assuranceLevel === 'AAL2'
                            ? 'MFA terverifikasi aktif pada akun Anda.'
                            : 'MFA wajib diaktifkan sebelum aktivasi akun pakar untuk melindungi keamanan sesi dan materi budaya.'}
                        </p>
                        {user?.assuranceLevel !== 'AAL2' && (
                          <Link to="/dashboard/profil" className="inline-block mt-1 text-amber-400 hover:underline font-semibold">
                            Aktifkan MFA di Pengaturan Profil →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* 2. Code of Conduct */}
                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-white/10">
                      <input
                        type="checkbox"
                        checked={agreeCodeOfConduct}
                        onChange={(e) => setAgreeCodeOfConduct(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-400 rounded"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-white">Persetujuan Piagam Etika &amp; Kode Etik Pakar Budaya</span>
                        <p className="text-gray-400 mt-0.5">
                          Saya bersumpah menjunjung tinggi adab tradisi, menghormati rahasia adat sakral, tidak menyebarkan kebencian, dan menjaga keluhuran pengetahuan leluhur Nusantara.
                        </p>
                      </div>
                    </label>

                    {/* 3. Granular Profile RAG confirmation */}
                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-white/10">
                      <input
                        type="checkbox"
                        checked={confirmRagConsent}
                        onChange={(e) => setConfirmRagConsent(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-400 rounded"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-white">Penegasan Konsen Rujukan AI Budaya (RAG)</span>
                        <p className="text-gray-400 mt-0.5">
                          Karya terkurasi Anda akan dihubungkan ke profil pakar terverifikasi sebagai rujukan edukasi AI terikat dengan atribusi resmi (dapat ditarik sewaktu-waktu).
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      onClick={handleActivate}
                      disabled={activating || !agreeCodeOfConduct || user?.assuranceLevel !== 'AAL2'}
                      className="text-xs flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{activating ? 'Mengaktifkan Akun...' : 'Selesaikan Aktivasi Akun Pakar'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejection / Appeal Banner */}
              {app.status === 'rejected' && (
                <div className="mt-6 p-5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span>Pengajuan Belum Memenuhi Kriteria Kebudayaan</span>
                  </div>
                  {app.rejection_reason && (
                    <div className="p-3.5 rounded-lg bg-slate-900/90 border border-red-400/20 text-red-100">
                      {app.rejection_reason}
                    </div>
                  )}
                  <p className="text-gray-300">
                    Jika Anda memiliki bukti keabsahan baru atau merasa ada kekeliruan dalam proses penelaahan, Anda berhak mengajukan permohonan banding ke Dewan Kehormatan Adat KataNusa.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAppealModal(true)}
                    className="text-xs border-red-400/40 text-red-300 hover:bg-red-500/10"
                  >
                    Ajukan Permohonan Banding
                  </Button>
                </div>
              )}

              {/* Withdrawal action for candidate */}
              {['draft', 'submitted', 'completeness_review', 'identity_review', 'credential_review', 'cultural_review', 'revision_required'].includes(app.status) && (
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span>Ingin membatalkan pengajuan ini?</span>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="text-red-400 hover:text-red-300 transition-colors underline"
                  >
                    Tarik Pengajuan
                  </button>
                </div>
              )}
            </div>

            {/* 2. Visual Stage Timeline */}
            <div className="rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <MandalaKawungIcon className="w-4 h-4 text-amber-400" />
                <span>Tahapan Evaluasi &amp; Musyawarah Kurator Adat</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {STAGES_TIMELINE.map((stg) => {
                  const isCurrent = app.stage === stg.id || (stg.id === 6 && app.status === 'approved_pending_activation');
                  const isPassed = app.stage > stg.id || app.status === 'activated';

                  return (
                    <div
                      key={stg.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-slate-900/40 border-white/5 text-gray-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-[11px] uppercase tracking-wider">
                            Tahap {stg.id}
                          </span>
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                          )}
                        </div>
                        <h4 className="font-bold text-white text-xs leading-snug">{stg.name}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-normal">{stg.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Summary of Candidate Profile & Structured Claims */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Overview */}
              <div className="rounded-2xl bg-[#1e293b] border border-white/10 p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider border-b border-white/10 pb-3">
                  Ringkasan Profil Kepakaran
                </h3>
                <div className="space-y-2.5 text-xs text-gray-300">
                  <p><strong className="text-white">Nama Publik:</strong> {app.data?.publicName || '-'}</p>
                  <p><strong className="text-white">Gelar Budaya:</strong> {app.data?.title || '-'}</p>
                  <p><strong className="text-white">Komunitas Adat:</strong> {app.data?.community || '-'}</p>
                  <p><strong className="text-white">Wilayah Pelestarian:</strong> {app.data?.region || '-'}</p>
                  <p><strong className="text-white">Nomor WhatsApp:</strong> {app.data?.phoneNumber || '-'}</p>
                  {app.data?.portfolioUrl && (
                    <p className="flex items-center gap-1.5">
                      <strong className="text-white">Portofolio:</strong>
                      <a href={app.data.portfolioUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1">
                        <span>Buka Tautan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                  <div className="pt-2">
                    <strong className="text-white block mb-1.5">Domain Keahlian:</strong>
                    <div className="flex flex-wrap gap-1.5">
                      {(app.data?.domains || []).map((dom) => (
                        <span key={dom} className="px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Structured Claims */}
              <div className="rounded-2xl bg-[#1e293b] border border-white/10 p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider border-b border-white/10 pb-3">
                  Klaim Keahlian Terdaftar ({claims.length})
                </h3>
                {claims.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada klaim terstruktur.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {claims.map((c, i) => (
                      <div key={c.id || i} className="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{c.domain}</span>
                          {c.is_high_risk && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Berisiko Tinggi
                            </span>
                          )}
                        </div>
                        <p className="text-amber-300/80 text-[11px]">Dasar: {c.basis}</p>
                        <p className="text-gray-300 text-[11px] leading-relaxed">{c.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Evidence and Documents Uploaded */}
            <div className="rounded-2xl bg-[#1e293b] border border-white/10 p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider border-b border-white/10 pb-3">
                Berkas Bukti &amp; Dokumen Privat Tersimpan ({evidence.length})
              </h3>
              {evidence.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Tidak ada berkas bukti yang diunggah.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evidence.map((ev) => (
                    <div key={ev.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-xs">{ev.file_name}</p>
                          <p className="text-[11px] text-gray-400">
                            Tujuan: {ev.purpose} • {Math.round(Number(ev.size_bytes) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 ml-2">
                        {ev.scan_status === 'clean' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Scan Bersih
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Diproses
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Appeal */}
        {showAppealModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-white/20 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>Pengajuan Banding Kepakaran</span>
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Jelaskan dasar pertimbangan, sanggahan terhadap catatan kurator, atau bukti baru yang mengonfirmasi mandat tradisi Anda:
              </p>
              <textarea
                rows={5}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-xs text-white outline-none focus:border-amber-400"
                placeholder="Tuliskan argumen banding secara lengkap dan santun..."
                value={appealGrounds}
                onChange={(e) => setAppealGrounds(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowAppealModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button variant="primary" onClick={handleAppeal} disabled={submittingAppeal} className="text-xs">
                  {submittingAppeal ? 'Mengirimkan Banding...' : 'Kirim Permohonan Banding'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Withdraw Confirmation */}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-white/20 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Konfirmasi Penarikan Pengajuan</span>
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Apakah Anda yakin ingin menarik pengajuan ini? Tindakan ini akan menghentikan proses kurasi dan membatalkan penugasan reviewer yang sedang berjalan.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowWithdrawConfirm(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {withdrawing ? 'Menarik...' : 'Ya, Tarik Pengajuan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CandidateApplicationPage;
