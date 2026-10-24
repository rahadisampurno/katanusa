import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  History,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  User,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import auth from '../../../libs/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface KnowledgeDetailResponse {
  version: {
    version_id: string;
    version: number;
    status: string;
    cultural_classification: string;
    rag_allowed: boolean;
    rights_basis: string;
    rights_statement: string | null;
    extraction_metadata: {
      pageCount?: number;
      wordCount?: number;
      safetyFlags?: string[];
      sections?: Array<{
        locator: string;
        title: string;
        content: string;
        pageStart?: number;
        pageEnd?: number;
      }>;
    } | null;
    submitted_at: string;
    source_id: string;
    source_title: string;
    source_summary: string | null;
    community_name: string;
    domain_tags: string[];
    region_tags: string[];
    expert_profile_id: string;
    expert_name: string;
    expert_slug: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    claimed_by_reviewer_id: string | null;
    assignment_expires_at: string | null;
  };
  exclusions: Array<{
    id: string;
    locator: string;
    action: string;
    replacement_text: string | null;
    reason: string;
  }>;
  history: Array<{
    action: string;
    notes: string;
    created_at: string;
    actor_name: string;
  }>;
}

export const KnowledgeReviewDetail: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<KnowledgeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab in review workspace
  const [activeTab, setActiveTab] = useState<'content' | 'rights' | 'history'>('content');

  // File access modal
  const [authorizedFile, setAuthorizedFile] = useState<{
    file_name: string;
    mime_type: string;
    size_bytes: number;
    authorized_until: string;
  } | null>(null);
  const [fileAccessLoading, setFileAccessLoading] = useState(false);

  // Decision state
  const [outcome, setOutcome] = useState<'approved' | 'revision_required' | 'rejected' | 'suspended'>('approved');
  const [notes, setNotes] = useState('');
  const [riskFlags, setRiskFlags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Escalation modal state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  const fetchDetail = async () => {
    if (!versionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await network.get<KnowledgeDetailResponse>(
        `/reviewer/knowledge/${versionId}`
      );
      setDetail(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat berkas kurasi pengetahuan. Pastikan Anda memiliki klaim penugasan aktif.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [versionId]);

  const handleRequestFileAccess = async () => {
    if (!versionId) return;
    setFileAccessLoading(true);
    try {
      const res = await network.get<{
        access_authorized: boolean;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        authorized_until: string;
      }>(`/reviewer/knowledge/${versionId}/file-access`);
      setAuthorizedFile(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengakses berkas asli.');
    } finally {
      setFileAccessLoading(false);
    }
  };

  const handleReleaseAssignment = async () => {
    if (!versionId) return;
    if (!confirm('Apakah Anda yakin ingin melepaskan klaim materi ini?')) return;
    try {
      await network.post(`/reviewer/knowledge/${versionId}/release`);
      navigate('/reviewer/knowledge');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal melepaskan penugasan.');
    }
  };

  const handleEscalateSubmit = async () => {
    if (!versionId) return;
    if (escalateReason.trim().length < 5) {
      alert('Alasan eskalasi wajib diisi minimal 5 karakter.');
      return;
    }
    setEscalating(true);
    try {
      await network.post(`/reviewer/knowledge/${versionId}/escalate`, {
        reason: escalateReason.trim(),
      });
      setShowEscalateModal(false);
      setDecisionSuccess('Materi berhasil dieskalasi ke Dewan Adat.');
      fetchDetail();
      setTimeout(() => setDecisionSuccess(null), 5000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal melakukan eskalasi.');
    } finally {
      setEscalating(false);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!versionId) return;
    if (notes.trim().length < 5) {
      setDecisionError('Catatan pertimbangan kurasi wajib diisi minimal 5 karakter.');
      return;
    }

    setSubmitting(true);
    setDecisionError(null);
    try {
      const res = await network.post<{ message: string; outcome: string }>(
        `/reviewer/knowledge/${versionId}/decision`,
        {
          outcome,
          notes: notes.trim(),
          riskFlags,
        }
      );
      setDecisionSuccess(res.data.message || 'Keputusan kurasi berhasil disimpan.');
      setTimeout(() => {
        navigate('/reviewer/knowledge');
      }, 1500);
    } catch (err: any) {
      setDecisionError(err?.response?.data?.message || 'Gagal menyimpan keputusan kurasi.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRiskFlag = (flag: string) => {
    setRiskFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  if (loading) {
    return (
      <Sidebar title="Kurasi Materi Pengetahuan">
        <div className="py-24 text-center text-xs text-neutral-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#d71920] mb-3" />
          <span className="font-medium text-neutral-700">Memuat lembar kurasi materi pengetahuan...</span>
        </div>
      </Sidebar>
    );
  }

  if (error || !detail) {
    return (
      <Sidebar title="Kurasi Materi Pengetahuan">
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#2e2620]">Tidak Dapat Mengakses Lembar Kurasi</h2>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto">
            {error || 'Versi materi pengetahuan tidak ditemukan atau Anda belum mengklaim penugasan ini.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/reviewer/knowledge"
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-all inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Antrean</span>
            </Link>
          </div>
        </div>
      </Sidebar>
    );
  }

  const { version, exclusions, history } = detail;
  const sections = version.extraction_metadata?.sections || [];
  const safetyFlags = version.extraction_metadata?.safetyFlags || [];

  return (
    <Sidebar title={`Kurasi: ${version.source_title}`}>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Link
              to="/reviewer/knowledge"
              className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                  Versi {version.version}
                </span>
                <span className="text-xs font-bold text-[#d71920] uppercase tracking-wider">
                  {version.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2e2620] mt-0.5">
                {version.source_title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {version.assignment_expires_at && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Batas: {dayjs(version.assignment_expires_at).format('DD MMM, HH:mm')}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowEscalateModal(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-900 text-xs font-bold transition-all"
            >
              Eskalasi
            </button>
            <button
              type="button"
              onClick={handleReleaseAssignment}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 text-xs font-bold transition-all"
            >
              Lepas Klaim
            </button>
          </div>
        </div>

        {/* Safety Alert Flag if detected */}
        {safetyFlags.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Peringatan Keamanan Otomatis Terdeteksi:</span>
              <p className="text-amber-800">
                Dokumen memuat pola teks anomali ({safetyFlags.join(', ')}). Periksa dengan teliti teks
                ekstraksi di bawah sebelum memberikan persetujuan edukasi publik.
              </p>
            </div>
          </div>
        )}

        {decisionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{decisionSuccess}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 text-xs font-bold text-neutral-600 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'content' ? 'text-[#d71920]' : 'hover:text-neutral-900'
            }`}
          >
            <span>Teks & Struktur Ekstraksi ({sections.length} Bagian)</span>
            {activeTab === 'content' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d71920]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rights')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'rights' ? 'text-[#d71920]' : 'hover:text-neutral-900'
            }`}
          >
            <span>Otoritas, Hak Cipta & Berkas Asli</span>
            {activeTab === 'rights' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d71920]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'history' ? 'text-[#d71920]' : 'hover:text-neutral-900'
            }`}
          >
            <span>Riwayat Kurasi ({history.length})</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d71920]" />
            )}
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Content Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'content' && (
              <div className="space-y-4">
                {sections.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-[#ebdccc] text-center text-xs text-neutral-500">
                    Tidak ada bagian teks hasil ekstraksi yang ditemukan.
                  </div>
                ) : (
                  sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-[#ebdccc] shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold">
                          {sec.locator}
                        </span>
                        <span className="font-bold text-[#2e2620]">{sec.title}</span>
                      </div>
                      <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line bg-[#fffaf5] p-3.5 rounded-xl border border-neutral-100 font-serif">
                        {sec.content}
                      </div>
                    </div>
                  ))
                )}

                {/* Exclusions & Redactions */}
                {exclusions.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#ebdccc] shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Redaksi / Eksklusi yang Diterapkan oleh Pakar ({exclusions.length})
                    </h3>
                    <div className="space-y-2">
                      {exclusions.map((exc) => (
                        <div
                          key={exc.id}
                          className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex justify-between items-start"
                        >
                          <div>
                            <span className="font-mono font-semibold text-neutral-700">
                              {exc.locator}
                            </span>
                            <span className="text-neutral-500 ml-2">Alasan: {exc.reason}</span>
                          </div>
                          <span className="text-[11px] font-bold text-red-600 uppercase">
                            {exc.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rights' && (
              <div className="p-6 rounded-3xl bg-white border border-[#ebdccc] shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">KONTRIBUTOR PAKAR</span>
                    <span className="font-bold text-[#2e2620]">{version.expert_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">KOMUNITAS ADAT</span>
                    <span className="font-bold text-[#2e2620]">{version.community_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">KLASIFIKASI KETERBUKAAN</span>
                    <span className="font-bold text-[#d71920]">
                      {version.cultural_classification}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">DASAR HAK (RIGHTS BASIS)</span>
                    <span className="font-bold text-[#2e2620]">{version.rights_basis}</span>
                  </div>
                </div>

                {version.source_summary && (
                  <div className="pt-3 border-t border-neutral-100">
                    <span className="text-xs font-bold text-neutral-700 block mb-1">
                      Ringkasan Materi:
                    </span>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {version.source_summary}
                    </p>
                  </div>
                )}

                {version.rights_statement && (
                  <div className="p-3.5 rounded-2xl bg-[#fffbf7] border border-[#f5dfb8] text-xs">
                    <span className="font-bold text-[#2e2620] block mb-1">Pernyataan Hak Cipta & Mandat Adat:</span>
                    <p className="text-neutral-600 leading-relaxed">{version.rights_statement}</p>
                  </div>
                )}

                {/* Original File Inspection Section */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2e2620] block">Berkas Unggahan Asli</span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {version.file_name} ({(version.size_bytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestFileAccess}
                    disabled={fileAccessLoading}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{fileAccessLoading ? 'Mengotorisasi...' : 'Akses Berkas Asli (15 Menit)'}</span>
                  </button>
                </div>

                {authorizedFile && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Otorisasi Berkas Aktif</span>
                      <span className="font-mono text-[11px]">
                        Berlaku hingga: {dayjs(authorizedFile.authorized_until).format('HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-blue-800 text-[11px]">
                      Akses waktu-terbatas diberikan untuk verifikasi keaslian naskah. Dilarang
                      menyebarluaskan berkas non-publik di luar lingkungan dewan kurasi.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-6 rounded-3xl bg-white border border-[#ebdccc] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Kronologi Peristiwa & Keputusan Kurasi
                </h3>
                {history.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4">Belum ada riwayat tercatat.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#fffaf5] border border-neutral-200 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold font-mono text-[#d71920] uppercase">
                            {ev.action}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {dayjs(ev.created_at).format('DD MMM YYYY, HH:mm')}
                          </span>
                        </div>
                        <div className="text-neutral-700">{ev.notes}</div>
                        <div className="text-[11px] text-neutral-500">Oleh: {ev.actor_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Decision Control Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-[#ebdccc] shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#d71920]" />
                <h3 className="text-sm font-bold text-[#2e2620]">
                  Keputusan Kurasi Dewan Adat
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">Tindakan Kurasi</label>
                <div className="space-y-1.5">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      outcome === 'approved'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="approved"
                      checked={outcome === 'approved'}
                      onChange={() => setOutcome('approved')}
                      disabled={version.cultural_classification !== 'public_education'}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-emerald-800 block">
                        Setujui Materi (Approved)
                      </span>
                      <span className="text-[11px] text-neutral-500 leading-tight block">
                        Materi disetujui untuk rujukan Persona AI setelah binding diaktifkan.
                      </span>
                      {version.cultural_classification !== 'public_education' && (
                        <span className="text-[10px] text-red-600 block mt-1 font-semibold">
                          Dilarang disetujui: klasifikasi bukan edukasi publik.
                        </span>
                      )}
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      outcome === 'revision_required'
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="revision_required"
                      checked={outcome === 'revision_required'}
                      onChange={() => setOutcome('revision_required')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-orange-800 block">Minta Revisi Pakar</span>
                      <span className="text-[11px] text-neutral-500 leading-tight block">
                        Kembalikan ke kontributor dengan catatan perbaikan redaksi atau batasan.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      outcome === 'rejected'
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="rejected"
                      checked={outcome === 'rejected'}
                      onChange={() => setOutcome('rejected')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-red-800 block">Tolak Materi</span>
                      <span className="text-[11px] text-neutral-500 leading-tight block">
                        Materi melanggar prinsip kepemilikan adat atau tidak layak masuk korpus.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      outcome === 'suspended'
                        ? 'border-neutral-600 bg-neutral-100'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="suspended"
                      checked={outcome === 'suspended'}
                      onChange={() => setOutcome('suspended')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-neutral-800 block">Tangguhkan (Suspend)</span>
                      <span className="text-[11px] text-neutral-500 leading-tight block">
                        Penangguhan darurat atas laporan masyarakat atau sengketa adat.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Risk Flags Checkboxes */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold text-neutral-700 block">
                  Penanda Risiko Budaya (Risk Flags)
                </label>
                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input
                      type="checkbox"
                      checked={riskFlags.includes('sacred_knowledge_concern')}
                      onChange={() => toggleRiskFlag('sacred_knowledge_concern')}
                    />
                    <span>Kandungan sakral memerlukan izin tetua</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input
                      type="checkbox"
                      checked={riskFlags.includes('provenance_doubt')}
                      onChange={() => toggleRiskFlag('provenance_doubt')}
                    />
                    <span>Asal-usul transmisi memerlukan klarifikasi</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input
                      type="checkbox"
                      checked={riskFlags.includes('territorial_conflict')}
                      onChange={() => toggleRiskFlag('territorial_conflict')}
                    />
                    <span>Potensi klaim silang antar wilayah adat</span>
                  </label>
                </div>
              </div>

              {/* Reviewer Notes Textarea */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold text-neutral-700 block">
                  Catatan Pertimbangan Kurator Adat (Wajib, min. 5 karakter)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan justifikasi pertimbangan adat..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                />
              </div>

              {decisionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{decisionError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={submitting || notes.trim().length < 5}
                className="w-full py-2.5 rounded-xl bg-[#d71920] hover:bg-[#b81218] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Menyimpan Putusan...' : 'Simpan Putusan Kurasi'}
              </button>
            </div>
          </div>
        </div>

        {/* Escalation Dialog */}
        {showEscalateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2e2620]">Eskalasi ke Dewan Adat</h3>
                </div>
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <p className="text-neutral-600">
                  Eskalasi dilakukan ketika naskah memuat perselisihan batas wilayah adat, klaim silsilah sakral,
                  atau membutuhkan sidang majelis kurasi bersama.
                </p>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">
                    Alasan Eskalasi (Wajib, min. 5 karakter)
                  </label>
                  <textarea
                    rows={3}
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="Contoh: Perlu musyawarah dewan adat terkait babon keris..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleEscalateSubmit}
                  disabled={escalating || escalateReason.trim().length < 5}
                  className="px-4 py-2 rounded-xl bg-[#2e2620] hover:bg-neutral-800 text-white shadow-sm disabled:opacity-50"
                >
                  {escalating ? 'Mengirim...' : 'Kirim Eskalasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default KnowledgeReviewDetail;
