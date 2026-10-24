import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import network from '../../libs/network';
import {
  MandalaKawungIcon,
  PerisaiTalawangIcon,
  SuryaMajapahitIcon,
} from '../../components/icons/NusantaraIcons';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';

export interface ApplicationData {
  legalName?: string;
  publicName?: string;
  title?: string;
  bio?: string;
  community?: string;
  region?: string;
  domains?: string[];
  phoneNumber?: string;
  portfolioUrl?: string;
  evidenceLink?: string; // legacy fallback
  ethicalDeclaration?: boolean;
  hourlyRate?: number;
}

export interface ClaimItem {
  id?: string;
  domain: string;
  basis: string;
  description: string;
  is_high_risk: boolean;
  verification_status?: string;
}

export interface CredentialItem {
  id?: string;
  issuer: string;
  credential_type: string;
  issued_on?: string;
  expires_on?: string;
  stored_object_id?: string;
  verification_status?: string;
}

export interface ReferenceItem {
  id?: string;
  name: string;
  contact_ciphertext?: string;
  consent_status: string;
  verification_status?: string;
}

export interface EvidenceItem {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | string;
  purpose: string;
  classification: string;
  scan_status: string;
  claim_id?: string | null;
  created_at: string;
}

export interface ReviewItem {
  id: string;
  stage: string;
  outcome: string;
  notes: string;
  created_at: string;
}

const STAGES = [
  'Prinsip & Kelayakan',
  'Kontak & Keamanan',
  'Identitas Legal (KYC)',
  'Profil Publik & Gelar',
  'Keahlian & Klaim Budaya',
  'Kredensial, Portofolio & Bukti',
  'Konsen & Etika AI',
  'Kesiapan Sesi & Apresiasi',
  'Deklarasi & Kirim Pengajuan',
];

export const ApplyExpertPage: React.FC = () => {
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState<string>('');
  const [currentStage, setCurrentStage] = useState(0);
  const [status, setStatus] = useState<string>('draft');
  const [data, setData] = useState<ApplicationData>({
    domains: [],
    ethicalDeclaration: false,
    hourlyRate: 150000,
  });
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    public_profile: true,
    consultation: true,
    retrieval_rag: false,
  });

  const [loading, setLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const identityFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);

  // New claim draft state
  const [newClaim, setNewClaim] = useState<ClaimItem>({
    domain: '',
    basis: '',
    description: '',
    is_high_risk: false,
  });
  const [showAddClaim, setShowAddClaim] = useState(false);

  // New credential draft state
  const [newCred, setNewCred] = useState<CredentialItem>({
    issuer: '',
    credential_type: '',
    issued_on: '',
    expires_on: '',
  });
  const [showAddCred, setShowAddCred] = useState(false);

  // New reference draft state
  const [newRef, setNewRef] = useState<ReferenceItem>({
    name: '',
    contact_ciphertext: '',
    consent_status: 'pending',
  });
  const [showAddRef, setShowAddRef] = useState(false);

  // Domain tag input state
  const [domainTagInput, setDomainTagInput] = useState('');

  useEffect(() => {
    // Muat draf pengajuan tersimpan dari server
    network
      .get<{
        application: { id: string; stage: number; status: string; data: ApplicationData } | null;
        consents: Array<{ scope: string; granted: boolean; withdrawn_at: string | null }>;
        claims?: ClaimItem[];
        credentials?: CredentialItem[];
        references?: ReferenceItem[];
        evidence?: EvidenceItem[];
        reviews?: ReviewItem[];
      }>('/expert/application')
      .then((res) => {
        const app = res.data.application;
        if (app) {
          setApplicationId(app.id);
          setCurrentStage(app.stage || 0);
          setStatus(app.status || 'draft');
          if (app.data) {
            const raw = app.data;
            // Rekonsiliasi field terpisah
            const phoneNumber = raw.phoneNumber || (raw.evidenceLink && !raw.evidenceLink.startsWith('http') ? raw.evidenceLink : '');
            const portfolioUrl = raw.portfolioUrl || (raw.evidenceLink && raw.evidenceLink.startsWith('http') ? raw.evidenceLink : '');
            setData({
              ...raw,
              phoneNumber,
              portfolioUrl,
            });
          }
        }
        if (res.data.claims) setClaims(res.data.claims);
        if (res.data.credentials) setCredentials(res.data.credentials);
        if (res.data.references) setReferences(res.data.references);
        if (res.data.evidence) setEvidence(res.data.evidence);
        if (res.data.reviews) setReviews(res.data.reviews);

        if (res.data.consents) {
          const map: Record<string, boolean> = {};
          res.data.consents.forEach((c) => {
            map[c.scope] = c.granted && !c.withdrawn_at;
          });
          setConsents((prev) => ({ ...prev, ...map }));
        }
      })
      .catch((err) => {
        console.error('Gagal memuat draf pengajuan:', err);
      });
  }, []);

  const saveDraft = async (stageToSave = currentStage): Promise<string | null> => {
    try {
      setSavedNotice('Menyimpan draf...');
      const res = await network.post<{ applicationId: string; stage: number }>('/expert/application/save', {
        stage: stageToSave,
        data,
        claims,
        credentials,
        references,
      });
      if (res.data.applicationId) {
        setApplicationId(res.data.applicationId);
      }
      setSavedNotice('Draf tersimpan otomatis di server');
      setTimeout(() => setSavedNotice(''), 3000);
      return res.data.applicationId;
    } catch (err: unknown) {
      setSavedNotice('');
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : err instanceof Error ? err.message : 'Gagal menyimpan draf';
      setErrorNotice(msg || 'Gagal menyimpan draf');
      return null;
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!data.phoneNumber || data.phoneNumber.trim().length < 8) {
        errors.phoneNumber = 'Nomor WhatsApp / kontak aktif wajib diisi (minimal 8 digit).';
      }
    } else if (step === 2) {
      if (!data.legalName || data.legalName.trim().length < 3) {
        errors.legalName = 'Nama lengkap legal sesuai identitas resmi wajib diisi.';
      }
    } else if (step === 3) {
      if (!data.publicName || data.publicName.trim().length < 2) {
        errors.publicName = 'Nama publik atau gelar budayawan wajib diisi.';
      }
      if (!data.title || data.title.trim().length < 2) {
        errors.title = 'Gelar kehormatan / bidang kebudayaan wajib diisi.';
      }
      if (!data.bio || data.bio.trim().length < 20) {
        errors.bio = 'Biografi ringkas wajib diisi minimal 20 karakter.';
      }
    } else if (step === 4) {
      if (!data.community || data.community.trim().length < 2) {
        errors.community = 'Komunitas adat atau suku asal wajib diisi.';
      }
      if (!data.region || data.region.trim().length < 2) {
        errors.region = 'Wilayah pelestarian budaya wajib diisi.';
      }
      if (!data.domains || data.domains.length === 0) {
        errors.domains = 'Pilih atau tambahkan minimal 1 domain kebudayaan.';
      }
      if (claims.length === 0) {
        errors.claims = 'Wajib menambahkan minimal 1 klaim keahlian budaya terstruktur.';
      }
    } else if (step === 5) {
      if (data.portfolioUrl && !data.portfolioUrl.startsWith('http')) {
        errors.portfolioUrl = 'Tautan portofolio harus berupa URL yang valid (diawali https://).';
      }
    } else if (step === 7) {
      if (typeof data.hourlyRate !== 'number' || data.hourlyRate < 0) {
        errors.hourlyRate = 'Usulan apresiasi per jam tidak boleh bernilai negatif.';
      }
    } else if (step === 8) {
      if (!data.ethicalDeclaration) {
        errors.ethicalDeclaration = 'Anda wajib menyetujui deklarasi integritas dan etika kebudayaan.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async (): Promise<void> => {
    setErrorNotice('');
    if (!validateStep(currentStage)) {
      return;
    }
    const nextStage = Math.min(STAGES.length - 1, currentStage + 1);
    setCurrentStage(nextStage);
    await saveDraft(nextStage);
  };

  const handlePrev = (): void => {
    setErrorNotice('');
    setFieldErrors({});
    setCurrentStage((prev) => Math.max(0, prev - 1));
  };

  const handleConsentToggle = async (scope: string): Promise<void> => {
    const nextVal = !consents[scope];
    setConsents((prev) => ({ ...prev, [scope]: nextVal }));
    try {
      await network.post('/expert/application/consent', {
        scope,
        granted: nextVal,
      });
    } catch (err) {
      console.error('Gagal memperbarui konsen:', err);
    }
  };

  const handleUploadEvidence = async (file: File, purpose: 'identity_proof' | 'credential' | 'portfolio' | 'expert_evidence', claimId?: string): Promise<void> => {
    setUploading(true);
    setUploadProgress(10);
    setUploadError('');

    try {
      // Pastikan ada applicationId di backend terlebih dahulu
      let targetAppId = applicationId;
      if (!targetAppId) {
        const savedId = await saveDraft(currentStage);
        if (!savedId) throw new Error('Gagal menyimpan draf sebelum mengunggah berkas.');
        targetAppId = savedId;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', targetAppId);
      formData.append('purpose', purpose);
      if (claimId) {
        formData.append('claim_id', claimId);
      }

      setUploadProgress(40);

      const res = await network.post<{
        success: boolean;
        id: string;
        filename: string;
        size: number;
        mime_type: string;
        status: string;
      }>('/upload/evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(100);

      const newEv: EvidenceItem = {
        id: res.data.id,
        file_name: res.data.filename,
        mime_type: res.data.mime_type,
        size_bytes: res.data.size,
        purpose,
        classification: purpose === 'identity_proof' ? 'restricted' : 'confidential',
        scan_status: res.data.status === 'available' ? 'clean' : 'pending',
        claim_id: claimId || null,
        created_at: new Date().toISOString(),
      };

      setEvidence((prev) => [newEv, ...prev]);
      setUploading(false);
      setUploadProgress(0);
    } catch (err: unknown) {
      setUploading(false);
      setUploadProgress(0);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : err instanceof Error ? err.message : 'Gagal mengunggah berkas bukti';
      setUploadError(msg || 'Gagal mengunggah berkas');
    }
  };

  const handleDeleteEvidence = async (objectId: string): Promise<void> => {
    try {
      await network.delete(`/expert/application/evidence/${objectId}`);
      setEvidence((prev) => prev.filter((item) => item.id !== objectId));
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Gagal menghapus berkas bukti';
      setErrorNotice(msg || 'Gagal menghapus berkas');
    }
  };

  const handleAddClaim = (): void => {
    if (!newClaim.domain.trim() || !newClaim.basis.trim() || !newClaim.description.trim()) {
      alert('Mohon lengkapi domain, dasar keabsahan, dan deskripsi klaim.');
      return;
    }
    setClaims((prev) => [...prev, { ...newClaim }]);
    setNewClaim({ domain: '', basis: '', description: '', is_high_risk: false });
    setShowAddClaim(false);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.claims;
      return next;
    });
  };

  const handleDeleteClaim = async (index: number, claimId?: string): Promise<void> => {
    if (claimId) {
      try {
        await network.delete(`/expert/application/claims/${claimId}`);
      } catch (err) {
        console.error('Gagal menghapus klaim di server:', err);
      }
    }
    setClaims((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCredential = (): void => {
    if (!newCred.issuer.trim() || !newCred.credential_type.trim()) {
      alert('Mohon lengkapi penerbit dan jenis kredensial.');
      return;
    }
    setCredentials((prev) => [...prev, { ...newCred }]);
    setNewCred({ issuer: '', credential_type: '', issued_on: '', expires_on: '' });
    setShowAddCred(false);
  };

  const handleDeleteCredential = async (index: number, credId?: string): Promise<void> => {
    if (credId) {
      try {
        await network.delete(`/expert/application/credentials/${credId}`);
      } catch (err) {
        console.error('Gagal menghapus kredensial di server:', err);
      }
    }
    setCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddReference = (): void => {
    if (!newRef.name.trim()) {
      alert('Mohon isi nama tokoh / tetua adat yang mereferensikan.');
      return;
    }
    setReferences((prev) => [...prev, { ...newRef }]);
    setNewRef({ name: '', contact_ciphertext: '', consent_status: 'pending' });
    setShowAddRef(false);
  };

  const handleDeleteReference = (index: number): void => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDomainTag = (): void => {
    const tag = domainTagInput.trim();
    if (!tag) return;
    if (!data.domains?.includes(tag)) {
      setData((prev) => ({
        ...prev,
        domains: [...(prev.domains || []), tag],
      }));
    }
    setDomainTagInput('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.domains;
      return next;
    });
  };

  const handleRemoveDomainTag = (tag: string): void => {
    setData((prev) => ({
      ...prev,
      domains: (prev.domains || []).filter((d) => d !== tag),
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep(8)) return;
    setLoading(true);
    setErrorNotice('');
    try {
      await saveDraft(currentStage);
      await network.post('/expert/application/submit', {});
      setStatus('submitted');
      setLoading(false);
      navigate('/dashboard/application');
    } catch (err: unknown) {
      setLoading(false);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : 'Terjadi kesalahan saat mengirim pengajuan.';
      setErrorNotice(msg || 'Gagal mengirim pengajuan.');
    }
  };

  // Helper render status scan badge
  const renderScanStatusBadge = (scanStatus: string) => {
    if (scanStatus === 'clean') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3" />
          Scan Bersih
        </span>
      );
    }
    if (scanStatus === 'infected' || scanStatus === 'quarantined') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertTriangle className="w-3 h-3" />
          Karantina
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        Menunggu Scan
      </span>
    );
  };

  const latestReview = reviews[0];

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-[#0f172a] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">
            <PerisaiTalawangIcon className="w-4 h-4 text-amber-400" />
            Pengajuan Wewenang &amp; Pakar Terverifikasi
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3">
            Ajukan Diri Sebagai Penjaga Tradisi &amp; Pakar Budaya
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Status pakar di KataNusa merupakan kapabilitas profesional yang diverifikasi melalui bukti keabsahan,
            integritas etika tradisi, dan persetujuan peninjau independen—bukan sekadar peran yang dipilih sendiri.
          </p>
        </div>

        {/* Revision Required Alert Banner */}
        {latestReview && (status === 'revision_required' || status === 'clarification_required') && (
          <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-5 mb-8 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-amber-300 text-base">
                  Pengajuan Memerlukan Perbaikan / Klarifikasi
                </h3>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Dewan kurator telah menelaah draf Anda dan meminta perbaikan berikut sebelum proses verifikasi dapat dilanjutkan:
                </p>
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-amber-400/20 text-xs font-mono text-amber-100">
                  {latestReview.notes}
                </div>
                <p className="text-[11px] text-amber-300/80">
                  Silakan perbarui data atau unggah berkas rujukan tambahan di bawah, lalu kirimkan ulang pada tahap akhir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Submitted or Approved Banner */}
        {status === 'submitted' || status === 'under_review' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center my-8">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
              <PerisaiTalawangIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-300 mb-2">Pengajuan Anda Sedang Ditinjau</h2>
            <p className="text-gray-300 max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Pengajuan Anda telah diterima oleh Dewan Peninjau Kebudayaan KataNusa. Peninjauan mencakup kelengkapan
              identitas legal, validasi karya/bukti adat, dan kepatuhan etika tradisi. Anda dapat memantau status secara langsung.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="primary" onClick={() => navigate('/dashboard/application')}>
                Buka Timeline &amp; Status Pengajuan
              </Button>
              <Button variant="outline" onClick={() => navigate('/booking-history')}>
                Riwayat Sesi
              </Button>
            </div>
          </div>
        ) : status === 'approved_pending_activation' ? (
          <div className="bg-amber-500/10 border-2 border-amber-400/40 rounded-2xl p-8 text-center my-8">
            <div className="inline-flex p-3 rounded-full bg-amber-500/20 text-amber-400 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-amber-300 mb-2">Selamat! Pengajuan Anda Disetujui</h2>
            <p className="text-gray-300 max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Dewan Kurator Kebudayaan telah menyetujui kredensial dan keabsahan tradisi Anda. Langkah terakhir adalah menyelesaikan Checklist Aktivasi Akun Pakar (termasuk verifikasi AAL2 dan persetujuan konsen).
            </p>
            <Button variant="primary" onClick={() => navigate('/dashboard/application')}>
              Buka Checklist Aktivasi Akun Pakar
            </Button>
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Step Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Tahap {currentStage + 1} dari {STAGES.length}: <strong className="text-white">{STAGES[currentStage]}</strong></span>
                <span>{savedNotice && <span className="text-emerald-400 font-medium">{savedNotice}</span>}</span>
              </div>
              <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
                />
              </div>
            </div>

            {errorNotice && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Stage 0: Prinsip & Kelayakan */}
            {currentStage === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <MandalaKawungIcon className="w-5 h-5 text-amber-300" />
                  Prinsip Kelayakan &amp; Perlindungan Budaya
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Sebelum memulai proses pengajuan, Anda menyatakan dan memahami bahwa:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2.5">
                  <li>Berusia minimal 18 tahun dan cakap hukum untuk mengadakan sesi konsultasi kebudayaan.</li>
                  <li>Memiliki hubungan otentik, pengetahuan teruji, atau mandat adat atas bidang yang diwakili.</li>
                  <li>Menghormati batas-batas pengetahuan sakral atau rahasia adat yang tidak boleh dipublikasikan secara umum.</li>
                  <li>Partisipasi sebagai pakar tidak mewajibkan izin atas materi Anda untuk AI. Konsen AI dipisahkan secara tegas dan dapat ditarik kembali kapan saja.</li>
                  <li>Bukti identitas privat Anda dilindungi enkripsi dan hanya dapat ditelaah oleh verifikator kredensial terotorisasi.</li>
                </ul>
              </div>
            )}

            {/* Stage 1: Kontak & Keamanan Operasional */}
            {currentStage === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-300">Kontak Operasional &amp; Keamanan Sesi</h3>
                <p className="text-sm text-gray-300">
                  Nomor kontak operasional digunakan secara privat untuk koordinasi sesi bimbingan dan verifikasi keamanan dua faktor (MFA/AAL2). Nomor ini tidak dipublikasikan ke umum.
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Nomor WhatsApp / Kontak Resmi <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="+62 812-xxxx-xxxx"
                    value={data.phoneNumber || ''}
                    onChange={(e) => {
                      setData({ ...data, phoneNumber: e.target.value });
                      if (fieldErrors.phoneNumber) setFieldErrors({ ...fieldErrors, phoneNumber: '' });
                    }}
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.phoneNumber}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    Format: +62 atau 08xxxxxxxx. Pastikan nomor aktif menerima notifikasi jadwal.
                  </p>
                </div>
              </div>
            )}

            {/* Stage 2: Identitas Legal (KYC) */}
            {currentStage === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-300" />
                  Identitas Legal Privat (KYC)
                </h3>
                <p className="text-sm text-gray-300">
                  Data identitas legal ini bersifat rahasia dan hanya diakses oleh verifikator identitas terotorisasi.
                  Tidak ada dokumen biner yang dipublikasikan secara umum.
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Nama Lengkap Sesuai KTP / Paspor <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.legalName ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="Nama Lengkap Legal"
                    value={data.legalName || ''}
                    onChange={(e) => {
                      setData({ ...data, legalName: e.target.value });
                      if (fieldErrors.legalName) setFieldErrors({ ...fieldErrors, legalName: '' });
                    }}
                  />
                  {fieldErrors.legalName && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.legalName}</p>
                  )}
                </div>

                {/* Private Identity Evidence Upload */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Unggah Bukti Identitas Resmi (KTP / Paspor / SK Pengangkatan Adat)
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Format diterima: PDF, JPG, PNG (maksimal 10MB). Berkas akan dipindai keamanan secara otomatis dan disimpan dalam arsip terenkripsi.
                  </p>

                  <input
                    ref={identityFileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadEvidence(file, 'identity_proof');
                      if (e.target) e.target.value = '';
                    }}
                  />

                  <Button
                    variant="outline"
                    onClick={() => identityFileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 text-xs"
                    type="button"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>{uploading ? `Mengunggah (${uploadProgress}%)...` : 'Pilih Berkas Identitas Privat'}</span>
                  </Button>

                  {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}

                  {/* List of uploaded identity proofs */}
                  <div className="mt-4 space-y-2">
                    {evidence
                      .filter((ev) => ev.purpose === 'identity_proof')
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-medium text-white truncate max-w-xs">{ev.file_name}</span>
                            <span className="text-gray-400">({Math.round(Number(ev.size_bytes) / 1024)} KB)</span>
                            {renderScanStatusBadge(ev.scan_status)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: Profil Publik & Gelar Budaya */}
            {currentStage === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-300">Profil Publik &amp; Gelar Budaya</h3>
                <p className="text-sm text-gray-300">
                  Informasi ini akan ditampilkan kepada publik setelah profil Anda terverifikasi dan mendapat persetujuan kurasi.
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Nama Publik / Panggilan Budayawan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.publicName ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="Contoh: Ki Ageng Wisesa / Ambu Maya"
                    value={data.publicName || ''}
                    onChange={(e) => {
                      setData({ ...data, publicName: e.target.value });
                      if (fieldErrors.publicName) setFieldErrors({ ...fieldErrors, publicName: '' });
                    }}
                  />
                  {fieldErrors.publicName && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.publicName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Gelar Kehormatan / Peran Budaya <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.title ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="Contoh: Dalang Wayang Kulit / Maestro Tenun Ikat"
                    value={data.title || ''}
                    onChange={(e) => {
                      setData({ ...data, title: e.target.value });
                      if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Biografi Ringkas &amp; Perjalanan Tradisi <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.bio ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="Ceritakan perjalanan, silsilah pembelajaran, dan dedikasi Anda dalam pelestarian budaya..."
                    value={data.bio || ''}
                    onChange={(e) => {
                      setData({ ...data, bio: e.target.value });
                      if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: '' });
                    }}
                  />
                  {fieldErrors.bio && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.bio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Stage 4: Keahlian & Klaim Budaya Terstruktur */}
            {currentStage === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-amber-300">Lingkup Kebudayaan &amp; Tradisi</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Definisikan wilayah, komunitas adat, dan domain spesifik keahlian yang Anda wakili.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                      Komunitas Adat / Suku Asal <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.community ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                      placeholder="Contoh: Minangkabau / Dayak Kenyah / Jawa"
                      value={data.community || ''}
                      onChange={(e) => {
                        setData({ ...data, community: e.target.value });
                        if (fieldErrors.community) setFieldErrors({ ...fieldErrors, community: '' });
                      }}
                    />
                    {fieldErrors.community && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.community}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                      Wilayah / Daerah Pelestarian <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.region ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                      placeholder="Contoh: Tanah Datar, Sumatera Barat"
                      value={data.region || ''}
                      onChange={(e) => {
                        setData({ ...data, region: e.target.value });
                        if (fieldErrors.region) setFieldErrors({ ...fieldErrors, region: '' });
                      }}
                    />
                    {fieldErrors.region && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.region}</p>
                    )}
                  </div>
                </div>

                {/* Domain Tags */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Domain / Cabang Kebudayaan <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-white focus:border-amber-400 outline-none text-sm"
                      placeholder="Ketik domain (contoh: Seni Karawitan, Keris & Senjata Tradisional) lalu klik Tambah"
                      value={domainTagInput}
                      onChange={(e) => setDomainTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDomainTag();
                        }
                      }}
                    />
                    <Button variant="outline" type="button" onClick={handleAddDomainTag} className="text-xs">
                      Tambah
                    </Button>
                  </div>

                  {fieldErrors.domains && (
                    <p className="text-xs text-red-400 mb-2">{fieldErrors.domains}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(data.domains || []).map((dom) => (
                      <span
                        key={dom}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30"
                      >
                        {dom}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomainTag(dom)}
                          className="hover:text-red-400 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Structured Claims List */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                        Klaim Keahlian Budaya Terstruktur <span className="text-red-400">*</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Tiap klaim diverifikasi secara independen oleh kurator kredensial dan budaya.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowAddClaim(true)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Klaim</span>
                    </Button>
                  </div>

                  {fieldErrors.claims && (
                    <p className="text-xs text-red-400 mb-3">{fieldErrors.claims}</p>
                  )}

                  {/* Add Claim Modal / Form */}
                  {showAddClaim && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-amber-400/40 space-y-3 mb-4">
                      <h5 className="text-xs font-bold text-amber-300 uppercase">Tambah Klaim Baru</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Domain Spesifik</label>
                          <input
                            type="text"
                            placeholder="Contoh: Sastra Tutur Mpaa Ntumbu Langgogo"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newClaim.domain}
                            onChange={(e) => setNewClaim({ ...newClaim, domain: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Dasar Otoritas / Keabsahan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Pewaris Generasi ke-4 / Mandat Lembaga Adat"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newClaim.basis}
                            onChange={(e) => setNewClaim({ ...newClaim, basis: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Deskripsi &amp; Pengalaman</label>
                        <textarea
                          rows={2}
                          placeholder="Jelaskan peran, pengalaman, dan karya terkait klaim ini..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                          value={newClaim.description}
                          onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={newClaim.is_high_risk}
                          onChange={(e) => setNewClaim({ ...newClaim, is_high_risk: e.target.checked })}
                          className="rounded text-amber-400"
                        />
                        <span>Mencakup pengetahuan khusus / berisiko tinggi (memerlukan persetujuan ganda kurator adat)</span>
                      </label>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setShowAddClaim(false)} className="text-xs">
                          Batal
                        </Button>
                        <Button variant="primary" type="button" onClick={handleAddClaim} className="text-xs">
                          Simpan Klaim
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of claims */}
                  {claims.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-white/20 text-center text-xs text-gray-400">
                      Belum ada klaim terstruktur. Klik tombol di atas untuk menambahkan klaim keahlian budaya Anda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {claims.map((claim, idx) => (
                        <div
                          key={claim.id || idx}
                          className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{claim.domain}</span>
                              {claim.is_high_risk && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                  Klaim Berisiko Tinggi
                                </span>
                              )}
                            </div>
                            <p className="text-amber-300/90 font-medium">Dasar: {claim.basis}</p>
                            <p className="text-gray-300 leading-relaxed">{claim.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteClaim(idx, claim.id)}
                            className="self-end md:self-center p-1.5 text-red-400 hover:text-red-300 transition-colors"
                            title="Hapus klaim"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage 5: Kredensial, Portofolio & Bukti Privat */}
            {currentStage === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-amber-300">Bukti Keahlian, Portofolio &amp; Rekam Jejak</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Sediakan tautan karya ilmiah/publikasi, data kredensial, kontak referensi komunitas, dan unggah berkas bukti privat.
                  </p>
                </div>

                {/* 1. Tautan Portofolio Terpisah dari Nomor Kontak */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Tautan Karya Ilmiah / Portofolio / Liputan Resmi
                  </label>
                  <input
                    type="url"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.portfolioUrl ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    placeholder="https://..."
                    value={data.portfolioUrl || ''}
                    onChange={(e) => {
                      setData({ ...data, portfolioUrl: e.target.value });
                      if (fieldErrors.portfolioUrl) setFieldErrors({ ...fieldErrors, portfolioUrl: '' });
                    }}
                  />
                  {fieldErrors.portfolioUrl && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.portfolioUrl}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Tautan ke repositori riset, portal jurnal kebudayaan, arsip digital, atau dokumentasi video karya Anda.
                  </p>
                </div>

                {/* 2. Structured Credentials */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                        Kredensial &amp; Piagam Adat / Resmi
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Sertifikasi kompetensi, piagam penghargaan, atau surat penetapan lembaga adat.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowAddCred(true)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kredensial</span>
                    </Button>
                  </div>

                  {showAddCred && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-amber-400/40 space-y-3 mb-4">
                      <h5 className="text-xs font-bold text-amber-300 uppercase">Tambah Kredensial Baru</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Lembaga / Dewan Penerbit</label>
                          <input
                            type="text"
                            placeholder="Contoh: Dewan Adat Dayak / Kemendikbudristek"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newCred.issuer}
                            onChange={(e) => setNewCred({ ...newCred, issuer: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Jenis Kredensial</label>
                          <input
                            type="text"
                            placeholder="Contoh: Piagam Pelestari Budaya / Sertifikat Dalang"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newCred.credential_type}
                            onChange={(e) => setNewCred({ ...newCred, credential_type: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Tanggal Terbit</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newCred.issued_on}
                            onChange={(e) => setNewCred({ ...newCred, issued_on: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Tanggal Kedaluwarsa (Jika ada)</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newCred.expires_on}
                            onChange={(e) => setNewCred({ ...newCred, expires_on: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setShowAddCred(false)} className="text-xs">
                          Batal
                        </Button>
                        <Button variant="primary" type="button" onClick={handleAddCredential} className="text-xs">
                          Simpan Kredensial
                        </Button>
                      </div>
                    </div>
                  )}

                  {credentials.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {credentials.map((cred, idx) => (
                        <div
                          key={cred.id || idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{cred.credential_type}</span>
                            <span className="text-gray-400 ml-2">— Penerbit: {cred.issuer}</span>
                            {cred.issued_on && (
                              <span className="text-slate-400 ml-2">({cred.issued_on})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCredential(idx, cred.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Community References */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                        Referensi Tokoh Komunitas / Tetua Adat
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Tokoh masyarakat atau sesepuh adat yang dapat dikonfirmasi mengenai rekam jejak Anda.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowAddRef(true)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Referensi</span>
                    </Button>
                  </div>

                  {showAddRef && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-amber-400/40 space-y-3 mb-4">
                      <h5 className="text-xs font-bold text-amber-300 uppercase">Tambah Referensi Tokoh</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Nama Tokoh Adat / Akademisi</label>
                          <input
                            type="text"
                            placeholder="Contoh: Prof. Dr. Soedarto / Datu Mangku Alam"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newRef.name}
                            onChange={(e) => setNewRef({ ...newRef, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Kontak Telepon / Email (Privat)</label>
                          <input
                            type="text"
                            placeholder="+62 813-xxxx-xxxx"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-xs text-white"
                            value={newRef.contact_ciphertext}
                            onChange={(e) => setNewRef({ ...newRef, contact_ciphertext: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setShowAddRef(false)} className="text-xs">
                          Batal
                        </Button>
                        <Button variant="primary" type="button" onClick={handleAddReference} className="text-xs">
                          Simpan Referensi
                        </Button>
                      </div>
                    </div>
                  )}

                  {references.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {references.map((ref, idx) => (
                        <div
                          key={ref.id || idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{ref.name}</span>
                            {ref.contact_ciphertext && (
                              <span className="text-gray-400 ml-2">({ref.contact_ciphertext})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReference(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Private Evidence Files Upload */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                        Unggah Berkas Bukti &amp; Portofolio Privat
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Unggah dokumen karya, sertifikat, atau rekaman dokumentasi (PDF, PNG, JPG).
                      </p>
                    </div>
                  </div>

                  <input
                    ref={evidenceFileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadEvidence(file, 'portfolio');
                      if (e.target) e.target.value = '';
                    }}
                  />

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => evidenceFileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 text-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>{uploading ? `Mengunggah (${uploadProgress}%)...` : 'Unggah Berkas Portofolio / Karya'}</span>
                  </Button>

                  {/* List of evidence */}
                  <div className="mt-4 space-y-2">
                    {evidence
                      .filter((ev) => ev.purpose !== 'identity_proof')
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-medium text-white truncate max-w-xs">{ev.file_name}</span>
                            <span className="text-gray-400">({Math.round(Number(ev.size_bytes) / 1024)} KB)</span>
                            {renderScanStatusBadge(ev.scan_status)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stage 6: Konsen & Etika AI */}
            {currentStage === 6 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <SuryaMajapahitIcon className="w-5 h-5 text-amber-400" />
                  Persetujuan &amp; Konsen Granular
                </h3>
                <p className="text-sm text-gray-300">
                  KataNusa menjunjung etika pelestarian tinggi: konsen AI dipisahkan secara tegas dan dapat Anda tarik kapan saja.
                </p>

                <div className="space-y-3.5 bg-slate-900/60 p-5 rounded-xl border border-white/10">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.public_profile ?? true}
                      onChange={() => handleConsentToggle('public_profile')}
                      className="mt-1 w-4 h-4 text-amber-400 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-white">Publikasi Profil Terverifikasi</span>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Menampilkan profil dan keahlian Anda di direktori publik KataNusa setelah verifikasi selesai.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.consultation ?? true}
                      onChange={() => handleConsentToggle('consultation')}
                      className="mt-1 w-4 h-4 text-amber-400 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-white">Menerima Sesi Berbagi Ilmu &amp; Bimbingan Budaya</span>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Membuka kesempatan bagi generasi muda &amp; pembelajar untuk berdialog serta belajar langsung bersama Anda.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.retrieval_rag ?? false}
                      onChange={() => handleConsentToggle('retrieval_rag')}
                      className="mt-1 w-4 h-4 text-amber-400 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-white">Rujukan Edukasi AI Budaya (RAG)</span>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Mengizinkan karya terverifikasi Anda dijadikan sumber rujukan terpercaya oleh Asisten AI KataNusa dengan atribusi resmi (izin dapat ditarik kembali sewaktu-waktu).
                      </p>
                    </div>
                  </label>

                  {/* Product Decision 1.5: Model Training disembunyikan/dinonaktifkan */}
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/5 text-xs text-gray-400 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Perlindungan Integritas Model Dasar (Product Decision 1.5)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Sesuai piagam tata kelola KataNusa, materi artikel kurasi hanya menjadi rujukan retrieval (RAG) terikat dan tidak digunakan untuk melatih bobot model AI (Model Training). Program pelatihan model saat ini tidak diaktifkan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 7: Kesiapan Sesi & Apresiasi */}
            {currentStage === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-300">Kesiapan Sesi &amp; Usulan Apresiasi</h3>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-semibold">
                    Usulan Apresiasi Sesi Bimbingan per Jam (IDR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border ${fieldErrors.hourlyRate ? 'border-red-500' : 'border-white/20'} text-white focus:border-amber-400 outline-none`}
                    value={data.hourlyRate || 150000}
                    onChange={(e) => {
                      setData({ ...data, hourlyRate: Number(e.target.value) });
                      if (fieldErrors.hourlyRate) setFieldErrors({ ...fieldErrors, hourlyRate: '' });
                    }}
                  />
                  {fieldErrors.hourlyRate && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.hourlyRate}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    Bentuk apresiasi sukarela untuk sarana sanggar, pelestarian sastra tutur &amp; bahasa daerah, serta riset adat yang Anda laksanakan (Dapat diisi Rp0 jika pengabdian penuh).
                  </p>
                </div>
              </div>
            )}

            {/* Stage 8: Deklarasi & Kirim Pengajuan */}
            {currentStage === 8 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-amber-300">Deklarasi Integritas &amp; Pengiriman Akhir</h3>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 space-y-2.5 text-xs text-gray-300">
                  <p><strong className="text-white">Nama Publik:</strong> {data.publicName || '-'}</p>
                  <p><strong className="text-white">Gelar:</strong> {data.title || '-'}</p>
                  <p><strong className="text-white">Nomor WhatsApp:</strong> {data.phoneNumber || '-'}</p>
                  <p><strong className="text-white">Komunitas:</strong> {data.community || '-'}</p>
                  <p><strong className="text-white">Wilayah:</strong> {data.region || '-'}</p>
                  <p><strong className="text-white">Jumlah Klaim Keahlian:</strong> {claims.length} klaim terdaftar</p>
                  <p><strong className="text-white">Berkas Bukti Diunggah:</strong> {evidence.length} berkas</p>
                  <p><strong className="text-white">Usulan Apresiasi:</strong> Rp{data.hourlyRate?.toLocaleString('id-ID')} / jam</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={data.ethicalDeclaration ?? false}
                    onChange={(e) => {
                      setData({ ...data, ethicalDeclaration: e.target.checked });
                      if (fieldErrors.ethicalDeclaration) setFieldErrors({ ...fieldErrors, ethicalDeclaration: '' });
                    }}
                    className="mt-1 w-4 h-4 text-amber-400 rounded"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed">
                    Saya menyatakan dengan jujur bahwa seluruh data dan bukti yang saya berikan adalah benar, otentik,
                    dan tunduk pada Piagam Etika Kebudayaan KataNusa. Saya memahami bahwa keputusan verifikasi kepakaran dilakukan oleh Dewan Kurator independen.
                  </span>
                </label>
                {fieldErrors.ethicalDeclaration && (
                  <p className="text-xs text-red-400">{fieldErrors.ethicalDeclaration}</p>
                )}
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8">
              {currentStage > 0 ? (
                <Button variant="outline" onClick={handlePrev} type="button">
                  Sebelumnya
                </Button>
              ) : (
                <div />
              )}

              {currentStage < STAGES.length - 1 ? (
                <Button variant="primary" onClick={handleNext} type="button">
                  Simpan &amp; Lanjutkan
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading || !data.ethicalDeclaration}
                  type="button"
                >
                  {loading ? 'Mengirimkan...' : 'Kirim Pengajuan Resmi'}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ApplyExpertPage;
