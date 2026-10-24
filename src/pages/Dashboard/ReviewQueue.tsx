import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { TablePagination } from '../../components/ui/TablePagination';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import network from '../../libs/network';
import {
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../../components/icons/NusantaraIcons';

dayjs.locale('id');

interface ClaimItem {
  id: string;
  domain: string;
  basis: string;
  description: string;
  is_high_risk: boolean;
  verification_status?: string;
}

interface CredentialItem {
  id: string;
  issuer: string;
  credential_type: string;
  issued_on?: string;
  expires_on?: string;
  verification_status?: string;
}

interface ReferenceItem {
  id: string;
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

interface ReviewHistoryItem {
  stage: string;
  outcome: string;
  notes: string;
  created_at: string;
  reviewer_name?: string;
}

interface ApplicationQueueItem {
  id: string;
  user_id: string;
  stage: number;
  status: string;
  submitted_at: string;
  applicant_name: string;
  applicant_email: string;
  data: {
    legalName?: string;
    headline?: string;
    publicName?: string;
    title?: string;
    community?: string;
    region?: string;
    domains?: string[];
    bio?: string;
    phoneNumber?: string;
    portfolioUrl?: string;
    hourlyRate?: number;
    suku?: string;
  };
  claims?: ClaimItem[];
}

interface ApplicationDetailData {
  application: ApplicationQueueItem;
  assignment?: {
    id: string;
    stage: number;
    status: string;
    assigned_at: string;
    expires_at: string;
    remaining_seconds: number;
  };
  claims: ClaimItem[];
  credentials: CredentialItem[];
  references: ReferenceItem[];
  evidence: EvidenceItem[];
  reviews: ReviewHistoryItem[];
  high_risk_required: boolean;
  approval_count: number;
}

const STAGE_LABELS: Record<number, string> = {
  1: 'Tahap 1: Kelayakan & Data',
  2: 'Tahap 2: KYC & Identitas Legal',
  3: 'Tahap 3: Kredensial & Portofolio',
  4: 'Tahap 4: Otoritas Adat & Komunitas',
  5: 'Tahap 5: Referensi & Klarifikasi',
  6: 'Tahap 6: Keputusan Akhir Dewan',
};

const ReviewQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { applicationId: routeAppId } = useParams<{ applicationId?: string }>();

  const [selectedAppSummary, setSelectedAppSummary] = useState<ApplicationQueueItem | null>(null);
  const [detailData, setDetailData] = useState<ApplicationDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [decisionOutcome, setDecisionOutcome] = useState<'approved' | 'revision_required' | 'clarification_required' | 'rejected'>('approved');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Escalate modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  // Search & Filter state (Stages 1 to 6)
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5' | '6'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // 1. Fetch Queue
  const { data: queueData, isLoading, error, refetch } = useQuery<{ queue: ApplicationQueueItem[] }>({
    queryKey: ['expert-review-queue', stageFilter],
    queryFn: async () => {
      const url = stageFilter === 'all'
        ? '/reviewer/applications/queue'
        : `/reviewer/applications/queue?stage=${stageFilter}`;
      const res = await network.get<{ queue: ApplicationQueueItem[] }>(url);
      return res.data;
    },
  });

  const applications = queueData?.queue || [];

  // Function to fetch full detail after claim or if active
  const loadDetail = async (appId: string) => {
    try {
      setLoadingDetail(true);
      setSubmitError(null);
      const res = await network.get<ApplicationDetailData>(`/reviewer/applications/${appId}`);
      setDetailData(res.data);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal memuat rincian pengajuan. Pastikan penugasan aktif.';
      setSubmitError(msg || 'Gagal memuat detail.');
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // If routeAppId is provided in URL, auto select and load
  useEffect(() => {
    if (routeAppId) {
      loadDetail(routeAppId);
    }
  }, [routeAppId]);

  // 2. Claim Penugasan
  const claimMutation = useMutation({
    mutationFn: async (application: ApplicationQueueItem) => {
      await network.post(`/reviewer/applications/${application.id}/claim`);
      return application;
    },
    onSuccess: async (application) => {
      setSelectedAppSummary(application);
      setSubmitError(null);
      setSubmitSuccess(null);
      await loadDetail(application.id);
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Pengajuan tidak dapat diklaim. Mungkin sudah diklaim reviewer lain atau ada konflik kepentingan.';
      setSubmitError(msg || 'Gagal mengklaim pengajuan.');
      setSelectedAppSummary(null);
      setDetailData(null);
    },
  });

  // 3. Release Penugasan
  const releaseMutation = useMutation({
    mutationFn: async (appId: string) => {
      await network.post(`/reviewer/applications/${appId}/release`);
      return appId;
    },
    onSuccess: () => {
      setSubmitSuccess('Penugasan berhasil dilepaskan kembali ke antrean umum.');
      setSelectedAppSummary(null);
      setDetailData(null);
      queryClient.invalidateQueries({ queryKey: ['expert-review-queue'] });
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal melepaskan penugasan.';
      setSubmitError(msg || 'Gagal melepaskan penugasan.');
    },
  });

  // 4. Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: async (payload: {
      applicationId: string;
      stage: number;
      outcome: string;
      notes: string;
    }) => {
      const res = await network.post('/reviewer/applications/decision', payload);
      return res.data;
    },
    onSuccess: () => {
      setSubmitSuccess('Keputusan telaah kurator berhasil dicatat dan diaudit secara atomik.');
      setSubmitError(null);
      setDecisionNotes('');
      setSelectedAppSummary(null);
      setDetailData(null);
      queryClient.invalidateQueries({ queryKey: ['expert-review-queue'] });
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal mencatat keputusan. Pastikan Anda memiliki kapabilitas peninjau dan sesi AAL2 aktif.';
      setSubmitError(msg || 'Gagal mencatat keputusan.');
    },
  });

  // 5. Escalate Mutation
  const handleEscalate = async () => {
    if (!detailData) return;
    if (escalateReason.trim().length < 10) {
      setSubmitError('Alasan eskalasi wajib diisi minimal 10 karakter.');
      return;
    }
    setEscalating(true);
    setSubmitError(null);
    try {
      await network.post(`/reviewer/applications/${detailData.application.id}/escalate`, {
        reason: escalateReason.trim(),
      });
      setShowEscalateModal(false);
      setEscalateReason('');
      setSubmitSuccess('Pengajuan berhasil dieskalasi ke Dewan Kehormatan Adat.');
      setSelectedAppSummary(null);
      setDetailData(null);
      queryClient.invalidateQueries({ queryKey: ['expert-review-queue'] });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal mengeskalasi pengajuan.';
      setSubmitError(msg || 'Gagal mengeskalasi.');
    } finally {
      setEscalating(false);
    }
  };

  const handleSubmitDecision = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!detailData) return;
    if (decisionNotes.trim().length < 10) {
      setSubmitError('Catatan telaah wajib diisi minimal 10 karakter sebagai pertanggungjawaban audit.');
      return;
    }
    decisionMutation.mutate({
      applicationId: detailData.application.id,
      stage: detailData.application.stage,
      outcome: decisionOutcome,
      notes: decisionNotes.trim(),
    });
  };

  // Safe file access handler
  const handleAccessEvidence = async (objectId: string) => {
    if (!detailData) return;
    try {
      const res = await network.get<{ url: string; file_name: string }>(
        `/reviewer/applications/${detailData.application.id}/evidence/${objectId}/access`
      );
      if (res.data.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert('Gagal mengakses berkas bukti. Pastikan penugasan reviewer aktif.');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stageFilter, pageSize]);

  // Filtering
  const filteredApplications = applications.filter((app) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = app.applicant_name?.toLowerCase().includes(q) || app.data?.publicName?.toLowerCase().includes(q);
      const matchEmail = app.applicant_email?.toLowerCase().includes(q);
      const matchCommunity = (app.data?.community || app.data?.suku)?.toLowerCase().includes(q);
      const matchDomain = app.data?.domains?.some((d) => d.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchCommunity && !matchDomain) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <Sidebar title="Ruang Kurasi &amp; Dewan Peninjau Adat">
      <div className="flex flex-col gap-6">
        {/* Banner Penjelasan Tata Kelola Reviewer */}
        <div className="bg-[#fff8e9] border border-[#f5dfb8] rounded-2xl p-5 flex items-start gap-4 shadow-xs text-[#7a4c13]">
          <ShieldAlert className="w-6 h-6 text-[#b45309] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <h2 className="font-bold text-[#92400e] text-sm">
              Prinsip Tata Kelola KataNusa &amp; Ruang Kurasi Mandat Budaya
            </h2>
            <p className="text-[#78350f]">
              Peninjauan calon pakar wajib dijalankan dengan kredensial peninjau spesifik (<code>credential_reviewer</code> untuk tahap 1–3, <code>cultural_reviewer</code> untuk tahap 4–6) dan tingkat assurance <strong>AAL2</strong>. Keputusan terikat pada klaim penugasan aktif (berlaku 72 jam) dan mematuhi prinsip <em>two-person review</em> untuk klaim budaya berisiko tinggi.
            </p>
          </div>
        </div>

        {submitSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium">{submitSuccess}</p>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-medium">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Antrean Verifikasi (Queue) */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-xs border border-[#dce7f5] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#b91c1c]" />
                  <h2 className="text-base font-bold text-[#17294b]">Antrean Pengajuan Masuk</h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#fff8e9] text-[#b85d19] rounded-full border border-[#f5dfb8]">
                  {filteredApplications.length} Berkas
                </span>
              </div>

              {/* Filter Stages 1 - 6 */}
              <div className="space-y-3 mb-4 pb-4 border-b border-[#e2e8f0]">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f1f5f9] rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setStageFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      stageFilter === 'all'
                        ? 'bg-[#b91c1c] text-white font-bold shadow-xs'
                        : 'text-[#536176] hover:text-[#17294b]'
                    }`}
                  >
                    Semua
                  </button>
                  {[1, 2, 3, 4, 5, 6].map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setStageFilter(String(stg) as any)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        stageFilter === String(stg)
                          ? 'bg-[#b91c1c] text-white font-bold shadow-xs'
                          : 'text-[#536176] hover:text-[#17294b]'
                      }`}
                      title={STAGE_LABELS[stg]}
                    >
                      Tahap {stg}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, komunitas adat, domain..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-[#f8fafd] border border-[#cbd5e1] rounded-xl text-xs text-[#17294b] placeholder-[#94a3b8] focus:outline-none focus:border-[#b91c1c]"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#64748b] text-xs">
                  <Loader2 className="w-7 h-7 animate-spin mb-3 text-[#b91c1c]" />
                  <p>Memuat antrean berkas pengajuan...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-xs">
                  <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <h3 className="font-bold text-[#17294b] mb-1">Akses Peninjau Ditolak</h3>
                  <p className="text-[#64748b] max-w-sm mx-auto mb-3">
                    Pastikan akun Anda memiliki kapabilitas <code>credential_reviewer</code> atau <code>cultural_reviewer</code> dan telah login ber-MFA (AAL2).
                  </p>
                  <Button variant="outline" onClick={() => refetch()} className="text-xs">
                    Muat Ulang
                  </Button>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16 text-[#64748b] text-xs space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
                  <p className="font-bold text-[#17294b] text-sm">Tidak Ada Pengajuan Sesuai Filter</p>
                  <p className="text-[#64748b]">Seluruh berkas pada tahap ini telah ditinjau atau tidak ada antrean masuk.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {paginatedApplications.map((app) => {
                    const isSelected = detailData?.application?.id === app.id;

                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          claimMutation.mutate(app);
                        }}
                        className={`py-3.5 px-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-2 border ${
                          isSelected
                            ? 'bg-[#fff8f0] border-2 border-[#d97706] shadow-sm'
                            : 'bg-[#f8fbff] hover:bg-[#edf4fc] border-[#e2e8f0]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] flex items-center justify-center font-bold text-xs">
                              {app.applicant_name ? app.applicant_name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#17294b] text-xs">{app.applicant_name}</h4>
                              <p className="text-[11px] text-[#64748b]">{app.applicant_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#17294b] border border-[#cbd5e1]">
                              {STAGE_LABELS[app.stage] || `Tahap ${app.stage}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#64748b] pl-12">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#94a3b8]" />
                            <span>{dayjs(app.submitted_at).format('DD MMM, HH:mm')}</span>
                          </div>
                          {(app.data.community || app.data.suku) && (
                            <div className="flex items-center gap-1">
                              <span className="text-[#94a3b8]">Adat:</span>
                              <span className="text-[#17294b] font-medium">{app.data.community || app.data.suku}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredApplications.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredApplications.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[6, 12, 24]}
                />
              </div>
            )}
          </div>

          {/* 2. Panel Rincian Detail, Bukti & Putusan (Claim-bound Detail) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {loadingDetail ? (
              <div className="bg-white rounded-3xl shadow-xs border border-[#dce7f5] p-12 text-center text-xs text-[#64748b]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#b91c1c] mb-3" />
                <p>Membuka berkas detail dan memverifikasi penugasan aktif...</p>
              </div>
            ) : detailData ? (
              <div className="bg-white rounded-3xl shadow-xs border border-[#dce7f5] p-6 space-y-6">
                {/* Header Detail & Assignment Timer */}
                <div className="flex items-start justify-between border-b border-[#e2e8f0] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b45309]">
                      {STAGE_LABELS[detailData.application.stage]}
                    </span>
                    <h3 className="text-lg font-bold text-[#17294b] font-serif mt-0.5">
                      {detailData.application.data.publicName || detailData.application.applicant_name}
                    </h3>
                    <p className="text-xs text-[#64748b]">{detailData.application.data.title || 'Calon Pakar Budaya'}</p>
                  </div>

                  <div className="text-right space-y-1">
                    {detailData.assignment && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>SLA Penugasan: {Math.round(detailData.assignment.remaining_seconds / 3600)} Jam</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => releaseMutation.mutate(detailData.application.id)}
                      disabled={releaseMutation.isPending}
                      className="text-[11px] text-red-600 hover:text-red-800 underline block cursor-pointer"
                    >
                      {releaseMutation.isPending ? 'Melepaskan...' : 'Lepaskan Penugasan (Release)'}
                    </button>
                  </div>
                </div>

                {/* Second-Review Requirement Alert */}
                {detailData.high_risk_required && (
                  <div className="flex flex-col gap-2 rounded-xl border border-purple-200 bg-purple-50 p-3.5 text-xs text-purple-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <PerisaiTalawangIcon className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Klaim Berisiko Tinggi: Mewajibkan 2 kurator independen berbeda.</span>
                    </div>
                    <span className="w-fit shrink-0 rounded-full border border-purple-300 bg-purple-100 px-2 py-1 text-[11px] font-bold text-purple-800">
                      Persetujuan saat ini: {detailData.approval_count} / 2
                    </span>
                  </div>
                )}

                {/* Candidate Overview Data */}
                <div className="space-y-3 text-xs bg-[#f8fbff] p-4 rounded-2xl border border-[#e2e8f0]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-[#64748b] block text-[11px]">Nama Legal (KYC):</span>
                      <strong className="text-[#17294b]">{detailData.application.data.legalName || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[11px]">Nomor WhatsApp:</span>
                      <strong className="text-[#17294b]">{detailData.application.data.phoneNumber || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[11px]">Komunitas / Suku:</span>
                      <strong className="text-[#17294b]">{detailData.application.data.community || detailData.application.data.suku || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[11px]">Wilayah Pelestarian:</span>
                      <strong className="text-[#17294b]">{detailData.application.data.region || '-'}</strong>
                    </div>
                  </div>

                  {detailData.application.data.portfolioUrl && (
                    <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="text-[#64748b]">Tautan Portofolio:</span>
                      <a
                        href={detailData.application.data.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#b91c1c] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Buka Tautan Luar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {detailData.application.data.bio && (
                    <div className="pt-2 border-t border-[#e2e8f0]">
                      <span className="text-[#64748b] block mb-1">Biografi Tradisi:</span>
                      <p className="text-[#334155] leading-relaxed italic">{detailData.application.data.bio}</p>
                    </div>
                  )}
                </div>

                {/* Structured Claims List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#17294b] uppercase tracking-wider flex items-center justify-between">
                    <span>Klaim Keahlian Budaya ({detailData.claims.length})</span>
                    <span className="text-[10px] text-[#64748b] font-normal">Diverifikasi satu per satu</span>
                  </h4>
                  {detailData.claims.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] italic">Tidak ada klaim terdaftar.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailData.claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="p-3.5 rounded-xl bg-white border border-[#e2e8f0] text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#17294b]">{claim.domain}</span>
                            {claim.is_high_risk && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Berisiko Tinggi
                              </span>
                            )}
                          </div>
                          <p className="text-[#b45309] font-medium text-[11px]">Dasar: {claim.basis}</p>
                          <p className="text-[#536176] text-[11px] leading-relaxed">{claim.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence Documents Viewer */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[#17294b] uppercase tracking-wider">
                    Berkas Bukti Privat ({detailData.evidence.length})
                  </h4>
                  {detailData.evidence.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] italic">Tidak ada berkas bukti diunggah.</p>
                  ) : (
                    <div className="space-y-2">
                      {detailData.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#b91c1c] shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium text-[#17294b] truncate max-w-xs block">{ev.file_name}</span>
                              <span className="text-[10px] text-[#64748b]">
                                {ev.purpose} • {Math.round(Number(ev.size_bytes) / 1024)} KB •{' '}
                                <span className={ev.scan_status === 'clean' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                  Scan: {ev.scan_status}
                                </span>
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleAccessEvidence(ev.id)}
                            className="text-xs flex items-center gap-1 px-2.5 py-1"
                          >
                            <span>Buka Dokumen</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review History Timeline */}
                {detailData.reviews.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                    <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                      Riwayat Keputusan Kurator Sebelumnya
                    </h4>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {detailData.reviews.map((r, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#f8fafd] border border-[#e2e8f0] text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#17294b]">{r.stage}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#536176] border border-[#cbd5e1] capitalize">
                              {r.outcome.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[#334155] italic">{r.notes}</p>
                          <span className="text-[10px] text-[#94a3b8] block">
                            {dayjs(r.created_at).format('DD MMM YYYY, HH:mm')} oleh {r.reviewer_name || 'Kurator'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Keputusan Kurator Adat */}
                <form onSubmit={handleSubmitDecision} className="pt-4 border-t border-[#e2e8f0] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#17294b] text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#b91c1c]" />
                      <span>Lembar Putusan Kurasi Adat</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowEscalateModal(true)}
                      className="text-xs text-purple-700 hover:text-purple-900 underline font-semibold cursor-pointer"
                    >
                      Eskalasi ke Dewan Adat
                    </button>
                  </div>

                  {/* Outcome Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#536176] mb-1.5">Hasil Evaluasi</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('approved')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          decisionOutcome === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-[#536176] border-[#cbd5e1] hover:bg-[#f8fafd]'
                        }`}
                      >
                        Setujui (Approve)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('revision_required')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          decisionOutcome === 'revision_required'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-[#536176] border-[#cbd5e1] hover:bg-[#f8fafd]'
                        }`}
                      >
                        Minta Revisi
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('clarification_required')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          decisionOutcome === 'clarification_required'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-[#536176] border-[#cbd5e1] hover:bg-[#f8fafd]'
                        }`}
                      >
                        Klarifikasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('rejected')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          decisionOutcome === 'rejected'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-white text-[#536176] border-[#cbd5e1] hover:bg-[#f8fafd]'
                        }`}
                      >
                        Tolak
                      </button>
                    </div>
                  </div>

                  {/* Audited Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#536176] mb-1.5">
                      Catatan Pertanggungjawaban Kurasi (Audit Log) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Tuliskan justifikasi kepatuhan etika tradisi atau alasan keputusan (minimal 10 karakter)..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbd5e1] text-xs text-[#17294b] focus:outline-none focus:border-[#b91c1c]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={decisionMutation.isPending}
                      className="text-xs"
                    >
                      {decisionMutation.isPending ? 'Merekam Keputusan...' : 'Tetapkan Putusan Kurasi'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xs border border-[#dce7f5] p-12 text-center text-xs text-[#64748b] space-y-3">
                <FileCheck2 className="w-10 h-10 text-[#94a3b8] mx-auto" />
                <h4 className="font-bold text-[#17294b] text-sm">Pilih Pengajuan dari Antrean</h4>
                <p className="max-w-xs mx-auto text-[#64748b]">
                  Klik salah satu berkas di sebelah kiri untuk mengklaim penugasan dan memeriksa rincian bukti keabsahan budaya.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Eskalasi */}
        {showEscalateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#dce7f5] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-[#17294b] flex items-center gap-2">
                <PerisaiTalawangIcon className="w-5 h-5 text-purple-600" />
                <span>Eskalasi ke Dewan Kehormatan Adat</span>
              </h3>
              <p className="text-xs text-[#536176] leading-relaxed">
                Tindakan ini akan memindahkan penanganan berkas ke sidang pleno dewan kehormatan (misal: sengketa trah, klaim sakral khusus, atau penolakan masyarakat):
              </p>
              <textarea
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbd5e1] text-xs text-[#17294b] outline-none focus:border-[#b91c1c]"
                placeholder="Tuliskan pertimbangan perlunya eskalasi dewan (minimal 10 karakter)..."
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowEscalateModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEscalate}
                  disabled={escalating}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {escalating ? 'Mengeskalasi...' : 'Eskalasi Berkas'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default ReviewQueue;
