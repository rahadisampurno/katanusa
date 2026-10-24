import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  FileCheck,
  HelpCircle,
  Lock,
  Mail,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthShell, { type AuthStep } from '../../components/auth/AuthShell';
import { PerisaiTalawangIcon } from '../../components/icons/NusantaraIcons';
// @ts-expect-error - SVG import
import LogoKataNusa from '../../components/svgs/logo-katanusa.svg?react';
import Button from '../../components/ui/Button';
import PhotoUpload from '../../components/ui/PhotoUpload';
import auth from '../../libs/auth';
import network from '../../libs/network';

// Daftar Suku & Tradisi Nusantara Komprehensif per Wilayah
const SUKU_CATEGORIES = [
  {
    region: 'Sumatera',
    items: [
      'Aceh',
      'Batak Toba',
      'Batak Karo',
      'Batak Mandailing',
      'Minangkabau',
      'Melayu Riau & Pesisir',
      'Rejang',
      'Lampung',
      'Nias',
      'Mentawai',
    ],
  },
  {
    region: 'Jawa & Madura',
    items: [
      'Jawa',
      'Sunda',
      'Betawi',
      'Madura',
      'Baduy (Kanekes)',
      'Tengger',
      'Cirebon',
    ],
  },
  {
    region: 'Bali & Nusa Tenggara',
    items: [
      'Bali',
      'Sasak (Lombok)',
      'Bima / Mbojo',
      'Sumbawa',
      'Manggarai (Flores)',
      'Ngada / Bajawa',
      'Sumba',
      'Rote',
      'Dawan / Atoni (Timor)',
    ],
  },
  {
    region: 'Kalimantan',
    items: [
      'Dayak Ngaju',
      'Dayak Iban',
      'Dayak Kenyah / Kayan',
      'Dayak Ma\'anyan',
      'Banjar',
      'Kutai',
      'Paser',
    ],
  },
  {
    region: 'Sulawesi',
    items: [
      'Bugis',
      'Makassar',
      'Toraja',
      'Mandar',
      'Minahasa',
      'Gorontalo',
      'Kaili',
      'Buton',
      'Tolaki',
    ],
  },
  {
    region: 'Maluku',
    items: [
      'Ambon / Maluku Tengah',
      'Ternate & Tidore',
      'Kei (Evav)',
      'Tanimbar',
      'Seram',
    ],
  },
  {
    region: 'Papua',
    items: [
      'Asmat',
      'Dani / Hubula',
      'Biak',
      'Marind',
      'Mee',
      'Kamoro',
      'Sentani',
    ],
  },
];

// Domain Keahlian Budaya Terstandar
const INITIAL_DOMAINS = [
  'Seni Pertunjukan & Tari Tradisional',
  'Seni Musik, Karawitan & Instrumen Etnik',
  'Tradisi Lisan, Pantun & Sastra Rakyat',
  'Naskah Kuno, Filologi & Aksara Tradisi',
  'Adat Istiadat, Pranata Sosial & Hukum Adat',
  'Ritus, Upacara Daur Hidup & Kepercayaan Leluhur',
  'Arsitektur Vernakular & Rumah Adat',
  'Pengobatan Tradisional, Usadha & Herbal',
  'Kriya Tradisi, Anyaman, Batik & Tenun Ikat',
  'Tosan Aji, Senjata Tradisional & Tempa Pamor',
  'Kuliner & Gastronomi Warisan Nusantara',
  'Filsafat, Kosmologi & Ekologi Budaya',
];

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state: 1 = Pilih Jalur, 2 = Identitas & Akun, 3 = Dokumen Kepakaran (jika pakar), 4 = Verifikasi Email (atau 3 untuk pelajar)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [journeyIntent, setJourneyIntent] = useState<'learner' | 'expert_applicant'>('learner');

  // Step 2 Form States: Identitas Umum & Akun
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3 Form States (Khusus Jalur Pakar): Kepakaran & Dokumen Penunjang
  const [headline, setHeadline] = useState('');
  const [selectedSuku, setSelectedSuku] = useState('');
  const [customSuku, setCustomSuku] = useState('');
  const [sukuDropdownOpen, setSukuDropdownOpen] = useState(false);
  const [sukuSearchQuery, setSukuSearchQuery] = useState('');
  const sukuDropdownRef = useRef<HTMLDivElement>(null);
  const sukuSearchInputRef = useRef<HTMLInputElement>(null);

  const [domainsList, setDomainsList] = useState<string[]>(INITIAL_DOMAINS);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [showCustomDomainField, setShowCustomDomainField] = useState(false);

  // Custom Assessment Questions (Pertanyaan Khusus Kepakaran)
  const [lineageSource, setLineageSource] = useState('Silsilah Keluarga / Warisan Turun-Temurun');
  const [knowledgeSacredness, setKnowledgeSacredness] = useState('Terbuka untuk umum & edukasi luas');
  const [activeRole, setActiveRole] = useState('');

  interface UploadedEvidenceFile {
    url: string;
    filename: string;
    size?: number;
  }

  // Foto Profil, Biografi, Upload Dokumen & Portofolio (Maksimal 3 Berkas)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedEvidenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [pricingRate, setPricingRate] = useState<number>(150000);

  // Persetujuan & Konsen Granular (Default Unchecked)
  const [consentPublic, setConsentPublic] = useState(false);
  const [consentConsultation, setConsentConsultation] = useState(false);
  const [consentRag, setConsentRag] = useState(false);

  // Step Verifikasi: OTP Code
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // UI States
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Tutup dropdown suku saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sukuDropdownRef.current &&
        !sukuDropdownRef.current.contains(event.target as Node)
      ) {
        setSukuDropdownOpen(false);
      }
    };
    if (sukuDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sukuDropdownOpen]);

  // Fokuskan input pencarian suku saat dropdown dibuka
  useEffect(() => {
    if (sukuDropdownOpen) {
      setTimeout(() => {
        sukuSearchInputRef.current?.focus();
      }, 50);
    }
  }, [sukuDropdownOpen]);

  // Hitung mundur kirim ulang OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Gulir konten formulir ke posisi paling atas setiap kali berganti langkah
  useEffect(() => {
    const authContent = document.querySelector('.auth-content');
    if (authContent) {
      authContent.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentStep]);

  // Filter Kategori Suku berdasarkan kata kunci pencarian
  const filteredSukuCategories = useMemo(() => {
    const q = sukuSearchQuery.trim().toLowerCase();
    if (!q) return SUKU_CATEGORIES;

    return SUKU_CATEGORIES.map((cat) => {
      const regionMatches = cat.region.toLowerCase().includes(q);
      const filteredItems = cat.items.filter(
        (item) => item.toLowerCase().includes(q) || regionMatches
      );
      return {
        ...cat,
        items: filteredItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [sukuSearchQuery]);

  const specialOptions = useMemo(
    () => [
      { value: 'Nusantara Lintas Budaya', label: 'Nusantara Lintas Budaya / Multi-Etnis' },
      { value: 'Lainnya', label: 'Lainnya (Tuliskan Sendiri)' },
    ],
    []
  );

  const filteredSpecialOptions = useMemo(() => {
    const q = sukuSearchQuery.trim().toLowerCase();
    if (!q) return specialOptions;
    return specialOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [sukuSearchQuery, specialOptions]);

  const totalSukuMatches =
    filteredSukuCategories.reduce((acc, cat) => acc + cat.items.length, 0) +
    filteredSpecialOptions.length;

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains((prev) => prev.filter((d) => d !== domain));
      // Jika domain ini kustom (tidak ada di INITIAL_DOMAINS), otomatis hapus dari domainsList agar tidak mengotori UI
      if (!INITIAL_DOMAINS.includes(domain)) {
        setDomainsList((prev) => prev.filter((d) => d !== domain));
      }
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleAddCustomDomain = () => {
    const trimmed = newDomainInput.trim();
    if (!trimmed) return;
    if (!domainsList.includes(trimmed)) {
      setDomainsList([...domainsList, trimmed]);
    }
    if (!selectedDomains.includes(trimmed)) {
      setSelectedDomains([...selectedDomains, trimmed]);
    }
    setNewDomainInput('');
    setShowCustomDomainField(false);
  };

  // Handler Unggah Berkas Bukti (Maks. 3 Berkas)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const remainingSlots = 3 - uploadedFiles.length;
    if (remainingSlots <= 0) {
      setUploadError('Maksimal 3 berkas bukti yang dapat diunggah.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let filesToUpload = files;
    let limitNotice = '';
    if (files.length > remainingSlots) {
      filesToUpload = files.slice(0, remainingSlots);
      limitNotice = `Hanya ${remainingSlots} berkas pertama yang diunggah (maksimal 3 berkas).`;
    }

    // Validasi ukuran tiap berkas (maks 15MB)
    const oversizedFile = filesToUpload.find((f) => f.size > 15 * 1024 * 1024);
    if (oversizedFile) {
      setUploadError(`Berkas "${oversizedFile.name}" melebihi ukuran maksimal 15 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError(limitNotice);
    setIsUploadingFile(true);

    const newlyUploaded: UploadedEvidenceFile[] = [];
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await network.post<{
          success: boolean;
          url: string;
          filename: string;
          size: number;
        }>('/upload/evidence', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.data?.url) {
          newlyUploaded.push({
            url: res.data.url,
            filename: res.data.filename || file.name,
            size: res.data.size || file.size,
          });
        }
      }

      setUploadedFiles((prev) => [...prev, ...newlyUploaded]);
      if (limitNotice) {
        setTimeout(() => setUploadError(''), 5000);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Gagal mengunggah berkas. Silakan coba kembali.';
      setUploadError(msg);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveUploadedFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mutasi Pendaftaran Akun
  const signupMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) =>
      await network.post('/auth/signup', payload),
    onSuccess: () => {
      setError('');
      setResendCooldown(60);
      if (journeyIntent === 'expert_applicant') {
        setCurrentStep(4);
      } else {
        setCurrentStep(3);
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Gagal melakukan pendaftaran. Silakan coba kembali.';
      setError(msg);
    },
  });

  // Mutasi Verifikasi OTP Email
  const verifyMutation = useMutation({
    mutationFn: async (payload: { email: string; code: string }) =>
      await network.post('/auth/verify-email', payload),
    onSuccess: async (res) => {
      setIsVerifying(false);
      setVerifySuccess(true);
      await auth.fetchSession();
      setTimeout(() => {
        if (journeyIntent === 'expert_applicant') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 2500);
    },
    onError: (err: any) => {
      setIsVerifying(false);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Kode verifikasi salah atau telah kedaluwarsa.';
      setError(msg);
    },
  });

  // Mutasi Kirim Ulang OTP
  const resendMutation = useMutation({
    mutationFn: async (targetEmail: string) =>
      await network.post('/auth/resend-verify', { email: targetEmail }),
    onSuccess: () => {
      setSuccessNotice('Kode verifikasi baru telah dikirimkan ke email Anda.');
      setResendCooldown(60);
      setTimeout(() => setSuccessNotice(''), 4000);
    },
    onError: () => {
      setError('Gagal mengirim ulang kode. Silakan coba beberapa saat lagi.');
    },
  });

  // Handler Submit dari Step 2 (Identitas)
  const handleProceedFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Semua kolom bertanda bintang wajib diisi.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Format alamat email tidak valid.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }

    if (journeyIntent === 'expert_applicant') {
      setCurrentStep(3);
    } else {
      signupMutation.mutate({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
    }
  };

  // Handler Submit dari Step 3 (Kepakaran & Dokumen untuk Pakar)
  const handleProceedFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const effectiveSuku = selectedSuku === 'Lainnya' ? customSuku.trim() : selectedSuku;

    if (!headline.trim()) {
      setError('Gelar atau keahlian utama wajib diisi.');
      return;
    }

    if (!effectiveSuku) {
      setError('Pilih atau tuliskan afiliasi tradisi adat / suku asal kepakaran Anda.');
      return;
    }

    if (selectedDomains.length === 0) {
      setError('Pilih minimal satu domain kebudayaan yang Anda kuasai.');
      return;
    }

    if (!bio.trim() || bio.trim().length < 20) {
      setError('Tuliskan ringkasan rekam jejak atau biografi singkat Anda (minimal 20 karakter).');
      return;
    }

    if (uploadedFiles.length === 0 && !secondaryUrl.trim() && !evidenceDesc.trim()) {
      setError('Unggah minimal 1 dokumen bukti atau cantumkan tautan portofolio keahlian Anda.');
      return;
    }

    const expertData = {
      headline: headline.trim(),
      suku: effectiveSuku,
      domains: selectedDomains,
      bio: bio.trim(),
      photo_url: photoUrl,
      image_url: photoUrl,
      pricing_rate: Number(pricingRate) || 150000,
      custom_assessment: {
        lineage_source: lineageSource,
        knowledge_sacredness: knowledgeSacredness,
        active_community_role: activeRole.trim() || undefined,
      },
      claims:
        uploadedFiles.length > 0
          ? uploadedFiles.map((file, idx) => ({
              domain: selectedDomains[0] || 'Budaya Nusantara',
              basis: lineageSource,
              description: evidenceDesc.trim()
                ? `${evidenceDesc.trim()} (Berkas ${idx + 1}: ${file.filename})`
                : `Dokumen portofolio ${idx + 1}: ${file.filename}`,
              evidence_url: file.url,
            }))
          : [
              {
                domain: selectedDomains[0] || 'Budaya Nusantara',
                basis: lineageSource,
                description:
                  evidenceDesc.trim() || `Portofolio dan bukti kepakaran tradisi ${effectiveSuku}`,
                evidence_url: secondaryUrl.trim() || undefined,
              },
            ],
      documents: uploadedFiles,
      consents: {
        public_profile: consentPublic,
        consultation: consentConsultation,
        retrieval_rag: consentRag,
      },
    };

    signupMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      expertData,
    });
  };

  // Handler Verifikasi Kode OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Masukkan 6-digit kode verifikasi secara lengkap.');
      return;
    }
    setIsVerifying(true);
    verifyMutation.mutate({
      email: email.trim(),
      code: otpCode.trim(),
    });
  };

  // Konfigurasi Steps
  const stepsConfig: AuthStep[] =
    journeyIntent === 'expert_applicant'
      ? [
          { number: 1, label: 'Pilih Jalur', shortLabel: '1. Jalur' },
          { number: 2, label: 'Identitas & Akun', shortLabel: '2. Identitas' },
          { number: 3, label: 'Dokumen Kepakaran', shortLabel: '3. Dokumen' },
          { number: 4, label: 'Verifikasi Email', shortLabel: '4. Selesai' },
        ]
      : [
          { number: 1, label: 'Pilih Jalur', shortLabel: '1. Jalur' },
          { number: 2, label: 'Identitas & Akun', shortLabel: '2. Identitas' },
          { number: 3, label: 'Verifikasi Email', shortLabel: '3. Selesai' },
        ];

  return (
    <AuthShell
      variant="signup"
      storyEyebrow="Mulai Perjalanan Anda"
      storyTitle="Mari Merawat & Merayakan Budaya Bersama KataNusa."
      storyDescription="Daftarkan diri Anda untuk berdialog dengan AI Pakar, terhubung dengan maestro tradisi, atau berkontribusi sebagai penjaga warisan leluhur."
      storyImage="/assets/pakar-nyata/Sambutan-Nusantara-di-Senja-Tropis.webp"
      storyImageWebp="/assets/pakar-nyata/Sambutan-Nusantara-di-Senja-Tropis.webp"
      topAction={
        <div className="text-xs sm:text-sm text-gray-600">
          Sudah memiliki akun?{' '}
          <Link
            to="/auth/login"
            className="font-bold text-[#b91c1c] hover:underline"
          >
            Masuk
          </Link>
        </div>
      }
      steps={stepsConfig}
      currentStep={currentStep}
      wide={currentStep === 1 || currentStep === 3}
    >
      <section className="auth-panel">
        {/* Flash Alert Messages */}
        {error && (
          <div className="mb-5 bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-medium border border-red-200 flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-medium border border-emerald-200 flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>{successNotice}</div>
          </div>
        )}

          {/* ========================================================================= */}
          {/* STEP 1: PILIHAN TUJUAN (2 PILIHAN: BELAJAR vs AJUKAN DIRI PAKAR) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5">
              <div className="auth-heading text-center mb-1">
                <p className="auth-kicker">Langkah 1 dari {stepsConfig.length}</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-itim mb-1">
                  Pilih Tujuan Bergabung
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Tentukan jenis akun Anda untuk memulai pengalaman kebudayaan di KataNusa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Opsi 1: Belajar & Konsultasi */}
                <div
                  onClick={() => setJourneyIntent('learner')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    journeyIntent === 'learner'
                      ? 'border-[#b91c1c] bg-red-50/30 shadow-xs ring-1 ring-[#b91c1c]/25'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          journeyIntent === 'learner'
                            ? 'bg-[#b91c1c] text-white shadow-xs'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      {journeyIntent === 'learner' ? (
                        <span className="text-[11px] font-bold text-[#b91c1c] bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Terpilih
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400">Pengguna Umum</span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-1">Belajar &amp; Konsultasi</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Untuk pelajar, akademisi, dan masyarakat umum yang ingin mengeksplorasi tradisi Nusantara, berdialog dengan ragam AI Persona Budaya berbasis komunitas yang terus bertumbuh, dan memesan sesi bimbingan bersama para budayawan.
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-1.5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Akses AI Persona Budaya Komunitas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Reservasi Sesi Pakar Tradisi</span>
                    </div>
                  </div>
                </div>

                {/* Opsi 2: Ajukan Diri Sebagai Pakar */}
                <div
                  onClick={() => setJourneyIntent('expert_applicant')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    journeyIntent === 'expert_applicant'
                      ? 'border-[#b91c1c] bg-red-50/30 shadow-xs ring-1 ring-[#b91c1c]/25'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          journeyIntent === 'expert_applicant'
                            ? 'bg-[#b91c1c] text-white shadow-xs'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      {journeyIntent === 'expert_applicant' ? (
                        <span className="text-[11px] font-bold text-[#b91c1c] bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Terpilih
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400">Budayawan / Maestro</span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-1">Ajukan Diri Sebagai Pakar &amp; Penjaga Tradisi</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Untuk budayawan, penutur bahasa daerah, praktisi adat, dalang, sejarawan, atau maestro yang mendedikasikan ilmu untuk pelestarian tradisi dan bimbingan generasi penerus.
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-1.5 text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verifikasi Dewan Peninjau Budaya</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Bimbingan Tradisi &amp; Apresiasi Sanggar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button Container */}
              <div className="pt-3 flex justify-center">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto sm:min-w-[300px] py-3.5 px-6 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white transition-all cursor-pointer"
                >
                  <span>Lanjutkan ke Pengisian Identitas</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PENGISIAN FORM IDENTITAS UMUM & AKUN */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedFromStep2} className="flex flex-col gap-4">
              <div className="auth-heading mb-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-medium mb-2 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Ubah Pilihan Jalur</span>
                </button>
                <p className="auth-kicker">Langkah 2 dari {stepsConfig.length}</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-itim mb-1">
                  Data Identitas &amp; Akun
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">
                  {journeyIntent === 'expert_applicant'
                    ? 'Lengkapi data identitas umum sebelum melengkapi portofolio dokumen kepakaran.'
                    : 'Lengkapi identitas umum Anda untuk membuat akun belajar di KataNusa.'}
                </p>
              </div>

              {/* Input Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP / Identitas Resmi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              {/* Input Alamat Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Kode verifikasi 6 digit akan dikirimkan ke alamat email ini via Resend.
                </p>
              </div>

              {/* Input Nomor Telepon / WA */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor WhatsApp / Telepon <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Kata Sandi & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ulangi Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="sm:w-1/3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  ← Kembali
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={signupMutation.isPending}
                  className="sm:w-2/3 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {signupMutation.isPending ? (
                    'Mendaftarkan Akun...'
                  ) : journeyIntent === 'expert_applicant' ? (
                    <>
                      <span>Lanjut ke Dokumen Kepakaran</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Daftarkan Akun &amp; Lanjut Verifikasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 (KHUSUS PAKAR): DATA KEPAKARAN, ASESMEN KHUSUS & BERKAS BUKTI */}
          {/* ========================================================================= */}
          {currentStep === 3 && journeyIntent === 'expert_applicant' && (
            <form onSubmit={handleProceedFromStep3} className="flex flex-col gap-5">
              <div className="auth-heading mb-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-medium mb-2 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali ke Identitas Akun</span>
                </button>
                <p className="auth-kicker">Langkah 3 dari 4</p>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#b91c1c]" />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-itim">
                    Data Kepakaran &amp; Bukti Penunjang
                  </h1>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                  Lengkapi data profil adat, asesmen tradisi, dan unggah berkas portofolio Anda.
                </p>
              </div>

              {/* 1. Headline Gelar Kepakaran */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gelar &amp; Keahlian Utama (Headline) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Contoh: Dalang Wayang Kulit Gaya Surakarta, Kurator Naskah Kuno Sunda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              {/* 2. Afiliasi Tradisi Adat / Suku Asal (Searchable Combobox / List of Values) */}
              <div ref={sukuDropdownRef} className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Afiliasi Tradisi Adat / Suku Asal <span className="text-red-500">*</span>
                </label>

                {/* Combobox Trigger Button */}
                <button
                  type="button"
                  onClick={() => setSukuDropdownOpen((prev) => !prev)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm bg-white transition-all cursor-pointer ${
                    sukuDropdownOpen
                      ? 'border-red-600 ring-2 ring-red-100 shadow-xs'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={sukuDropdownOpen}
                >
                  <span
                    className={
                      selectedSuku
                        ? 'font-medium text-gray-900'
                        : 'text-gray-400'
                    }
                  >
                    {selectedSuku
                      ? selectedSuku === 'Lainnya'
                        ? 'Lainnya (Tuliskan Sendiri)'
                        : selectedSuku === 'Nusantara Lintas Budaya'
                        ? 'Nusantara Lintas Budaya / Multi-Etnis'
                        : selectedSuku
                      : '-- Pilih Suku / Tradisi Adat Nusantara --'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                    {selectedSuku && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSuku('');
                          setCustomSuku('');
                        }}
                        className="hover:text-red-600 p-0.5 rounded cursor-pointer"
                        title="Hapus pilihan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        sukuDropdownOpen ? 'rotate-180 text-red-600' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Searchable Dropdown Menu Popup */}
                {sukuDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Sticky Search Input Bar */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/90 backdrop-blur-xs">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          ref={sukuSearchInputRef}
                          type="text"
                          value={sukuSearchQuery}
                          onChange={(e) => setSukuSearchQuery(e.target.value)}
                          placeholder="Cari suku atau wilayah... (contoh: Dayak, Minang, Toraja)"
                          className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                        {sukuSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSukuSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable List of Suku Options */}
                    <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-gray-50">
                      {totalSukuMatches === 0 ? (
                        <div className="py-4 px-3 text-center">
                          <p className="text-xs text-gray-500 mb-2">
                            Suku <span className="font-semibold text-gray-700">"{sukuSearchQuery}"</span> tidak ditemukan dalam daftar standar.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSuku('Lainnya');
                              setCustomSuku(sukuSearchQuery);
                              setSukuDropdownOpen(false);
                              setSukuSearchQuery('');
                            }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            + Gunakan "{sukuSearchQuery}" sebagai Suku Kustom
                          </button>
                        </div>
                      ) : (
                        <>
                          {filteredSukuCategories.map((cat) => (
                            <div key={cat.region} className="py-1">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1">
                                Wilayah {cat.region}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                {cat.items.map((item) => {
                                  const isCurrent = selectedSuku === item;
                                  return (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSuku(item);
                                        setSukuDropdownOpen(false);
                                        setSukuSearchQuery('');
                                      }}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                        isCurrent
                                          ? 'bg-red-50 text-red-700 font-bold'
                                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                      }`}
                                    >
                                      <span>{item}</span>
                                      {isCurrent && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {filteredSpecialOptions.length > 0 && (
                            <div className="pt-1.5 pb-0.5">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1">
                                Pilihan Lainnya
                              </span>
                              <div className="flex flex-col gap-0.5">
                                {filteredSpecialOptions.map((opt) => {
                                  const isCurrent = selectedSuku === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSuku(opt.value);
                                        setSukuDropdownOpen(false);
                                        setSukuSearchQuery('');
                                      }}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                        isCurrent
                                          ? 'bg-red-50 text-red-700 font-bold'
                                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                      }`}
                                    >
                                      <span className={opt.value === 'Lainnya' ? 'text-amber-800 font-semibold' : ''}>
                                        {opt.label}
                                      </span>
                                      {isCurrent && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Input Suku Kustom jika memilih Lainnya */}
                {selectedSuku === 'Lainnya' && (
                  <div className="mt-2 animate-fadeIn">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Nama Suku / Tradisi Adat Kustom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customSuku}
                      onChange={(e) => setCustomSuku(e.target.value)}
                      placeholder="Ketikkan nama suku, komunitas adat, atau tradisi lokal Anda..."
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/30 focus:border-red-600 outline-none text-xs"
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* 3. Domain Keahlian Budaya (Multi-Select + Tambah Kustom) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Domain Keahlian Budaya (Pilih minimal satu) <span className="text-red-500">*</span>
                  </label>
                  {!showCustomDomainField && (
                    <button
                      type="button"
                      onClick={() => setShowCustomDomainField(true)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Domain Kustom</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {domainsList.map((dom) => {
                    const isSelected = selectedDomains.includes(dom);
                    const isCustom = !INITIAL_DOMAINS.includes(dom);
                    return (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => toggleDomain(dom)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? isCustom
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                        title={isCustom ? 'Domain Kustom (klik untuk batalkan/hapus)' : undefined}
                      >
                        <span>{dom}</span>
                        {isSelected && !isCustom && <span>✓</span>}
                        {isCustom && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDomain(dom);
                            }}
                            className="text-white/80 hover:text-white font-bold ml-0.5 text-xs"
                            title="Hapus domain kustom ini"
                          >
                            ✕
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Input Domain Kustom */}
                {showCustomDomainField && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl mb-2">
                    <input
                      type="text"
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomDomain();
                        }
                      }}
                      placeholder="Masukkan nama domain keahlian baru lalu tekan Enter..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-300 outline-none focus:border-red-600"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddCustomDomain}
                      className="text-xs py-1.5 px-3 rounded-lg font-bold"
                    >
                      Tambahkan
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomDomainField(false);
                        setNewDomainInput('');
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Asesmen Mandiri & Pertanyaan Khusus Kepakaran (Custom Question) */}
              <div className="bg-[#faf8f5] border border-[#e7ded5] rounded-2xl p-4 flex flex-col gap-3.5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#b91c1c]" />
                  <span className="text-xs font-bold text-gray-900">
                    Asesmen Khusus Kepakaran Budaya (Dewan Peninjau)
                  </span>
                </div>

                {/* Pertanyaan 1: Jalur Sanad / Silsilah */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    1. Bagaimana Anda memperoleh atau mewarisi otoritas keilmuan tradisi ini? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lineageSource}
                    onChange={(e) => setLineageSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:border-red-600 outline-none"
                    required
                  >
                    <option value="Silsilah Keluarga / Warisan Turun-Temurun">Silsilah Keluarga / Warisan Turun-Temurun (Hereditary)</option>
                    <option value="Perguruan / Padepokan / Sanggar Tradisi Resmi">Perguruan / Padepokan / Sanggar Tradisi Resmi</option>
                    <option value="Penetapan Lembaga / Pemangku Adat Setempat">Penetapan Lembaga / Pemangku Adat Setempat</option>
                    <option value="Riset Akademik & Pendidikan Formal Kebudayaan">Riset Akademik &amp; Pendidikan Formal Kebudayaan</option>
                    <option value="Praktisi Lapangan / Dedikasi Mandiri">Praktisi Lapangan / Dedikasi Mandiri</option>
                  </select>
                </div>

                {/* Pertanyaan 2: Tingkat Sakralitas */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    2. Batasan Akses &amp; Kaidah Sakralitas Pengetahuan yang Anda Ampu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={knowledgeSacredness}
                    onChange={(e) => setKnowledgeSacredness(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:border-red-600 outline-none"
                    required
                  >
                    <option value="Terbuka untuk umum & edukasi luas">Terbuka untuk umum &amp; edukasi pelestarian luas</option>
                    <option value="Memiliki kaidah & pantangan adat tertentu">Memiliki kaidah &amp; pantangan adat tertentu yang perlu dihormati</option>
                    <option value="Pengetahuan khusus/sakral (diajarkan dengan etika khusus)">Pengetahuan khusus/sakral (diajarkan dengan etika khusus)</option>
                  </select>
                </div>

                {/* Pertanyaan 3: Peran Komunitas */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    3. Peran Aktif Anda Saat Ini dalam Pelestarian Tradisi Tersebut
                  </label>
                  <input
                    type="text"
                    value={activeRole}
                    onChange={(e) => setActiveRole(e.target.value)}
                    placeholder="Contoh: Pengajar generasi muda sanggar, pengasuh naskah, pemimpin ritus..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              {/* Foto Profil & Potret Budaya Pakar */}
              <div className="bg-[#faf8f5] border border-[#e7ded5] rounded-2xl p-4">
                <PhotoUpload
                  value={photoUrl}
                  onChange={(url) => setPhotoUrl(url)}
                  label="Foto Profil & Potret Budaya (Opsional)"
                  hint="Unggah potret adat atau foto resmi Anda untuk ditampilkan di direktori pakar KataNusa (format JPG, PNG, WebP maks. 5 MB)."
                  shape="portrait"
                />
              </div>

              {/* 5. Biografi Singkat */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Biografi Singkat &amp; Rekam Jejak <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan latar belakang, perguruan/silsilah ilmu, pementasan, atau riset adat Anda..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              {/* 6. Upload Dokumen & Portofolio (Maksimal 3 Berkas) */}
              <div className="bg-[#faf8f5] border border-[#e7ded5] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#b91c1c]" />
                    <span className="text-xs font-bold text-gray-900">
                      Unggah Berkas Bukti &amp; Portofolio
                    </span>
                  </div>
                  <span className="text-[10px] text-[#b91c1c] font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    Maks. 3 Berkas ({uploadedFiles.length}/3)
                  </span>
                </div>

                {/* Input Berkas Hidden */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                />

                {/* Daftar Berkas yang Telah Diunggah */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={`${file.url}-${idx}`}
                        className="bg-white border border-emerald-300 rounded-xl p-3 flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {file.filename}
                            </p>
                            <p className="text-[10px] text-emerald-700 font-medium">
                              ✓ Berkas tersimpan ({file.size ? `${Math.round(file.size / 1024)} KB` : 'Tersimpan'})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Lihat Berkas
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedFile(idx)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropzone untuk Menambah Berkas (jika belum mencapai 3 berkas) */}
                {uploadedFiles.length < 3 ? (
                  <div
                    onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all bg-white hover:bg-red-50/20 ${
                      isUploadingFile ? 'border-red-400 bg-red-50/30 cursor-not-allowed' : 'border-gray-300 hover:border-[#b91c1c]'
                    }`}
                  >
                    {isUploadingFile ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Clock className="w-6 h-6 text-[#b91c1c] animate-spin mb-1.5" />
                        <span className="text-xs font-bold text-gray-900">Mengunggah berkas...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <Paperclip className="w-6 h-6 text-[#b91c1c] mb-1" />
                        <span className="text-xs font-bold text-gray-800">
                          {uploadedFiles.length === 0
                            ? 'Klik untuk Memilih Dokumen Bukti / Portofolio'
                            : `+ Tambah Berkas Lainnya (${3 - uploadedFiles.length} tersisa)`}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5">
                          Sertifikat keahlian, surat rekomendasi adat, atau portofolio (Maks. 15 MB/berkas)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-emerald-800 font-semibold">
                      ✓ Batas maksimal 3 berkas bukti telah terpenuhi.
                    </p>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                )}

                {/* Keterangan Dokumen / Rekomendasi Lembaga Adat (Form Description / Textarea) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-gray-700">
                      Keterangan Dokumen / Rekomendasi Lembaga Adat
                    </label>
                    <span className="text-[10px] text-gray-400">
                      Deskripsi berkas &amp; portofolio
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    placeholder="Tuliskan keterangan berkas, nomor sertifikat/piagam, nama lembaga adat yang merekomendasikan, atau rincian portofolio keahlian Anda..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs leading-relaxed resize-y min-h-[72px]"
                  />
                </div>

                {/* Tautan Tambahan (Opsional) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Tautan Tambahan (Opsional - Video Youtube / Dokumentasi Web)
                  </label>
                  <input
                    type="url"
                    value={secondaryUrl}
                    onChange={(e) => setSecondaryUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:border-red-600 text-xs"
                  />
                </div>
              </div>

              {/* 7. Apresiasi Sesi Bimbingan Tradisi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Apresiasi Sesi Bimbingan (Rp / Jam)
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Dukungan Sanggar &amp; Riset Tradisi
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    step={10000}
                    min={0}
                    value={pricingRate}
                    onChange={(e) => setPricingRate(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Bentuk apresiasi sukarela yang diajukan untuk mendukung operasional sanggar, pelestarian sastra tutur &amp; bahasa daerah, serta riset adat yang Anda laksanakan. Dapat diisi 0 jika bimbingan bersifat pengabdian penuh.
                </p>
              </div>

              {/* 8. Persetujuan Etika & Pelestarian Budaya */}
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-900 block">Persetujuan &amp; Komitmen Pelestarian Budaya</span>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={consentPublic}
                    onChange={(e) => setConsentPublic(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    Saya menyetujui profil kepakaran saya ditampilkan di katalog publik KataNusa setelah disetujui Dewan Budaya.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={consentConsultation}
                    onChange={(e) => setConsentConsultation(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    Saya bersedia meluangkan waktu untuk sesi berbagi ilmu, tutur bahasa daerah, dan bimbingan tradisi bersama generasi penerus.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={consentRag}
                    onChange={(e) => setConsentRag(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    Saya mengizinkan materi dan pengetahuan publik kami jadikan referensi edukasi oleh Asisten AI Budaya KataNusa (Izin ini bersifat sukarela dan dapat dibatalkan atau ditarik kembali sewaktu-waktu).
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="sm:w-1/3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  ← Kembali
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={signupMutation.isPending || isUploadingFile}
                  className="sm:w-2/3 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  {signupMutation.isPending ? (
                    'Mendaftarkan Akun & Berkas...'
                  ) : (
                    <>
                      <span>Daftarkan Akun &amp; Ajukan Berkas</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 (atau STEP 3 untuk Learner): VERIFIKASI EMAIL */}
          {/* ========================================================================= */}
          {((currentStep === 4 && journeyIntent === 'expert_applicant') ||
            (currentStep === 3 && journeyIntent === 'learner')) && (
            <div className="flex flex-col gap-5 max-w-md mx-auto py-2">
              <div className="auth-heading text-center mb-1">
                <div className="w-12 h-12 bg-red-50 text-[#b91c1c] rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <PerisaiTalawangIcon className="w-6 h-6" />
                </div>
                <p className="auth-kicker">Langkah Terakhir</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-itim mb-1">
                  Verifikasi Alamat Email
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Kode verifikasi 6 digit telah dikirimkan ke{' '}
                  <strong className="text-gray-900">{email}</strong>.
                </p>
              </div>

              {verifySuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-xs">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-bounce" />
                  <h3 className="text-base font-bold text-emerald-950 font-itim mb-1">
                    Email Berhasil Diverifikasi!
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                    {journeyIntent === 'expert_applicant'
                      ? 'Akun Anda telah aktif dan berkas pendaftaran pakar Anda telah berhasil masuk ke antrean Dewan Peninjau Budaya (Cultural Review Council). Mengalihkan ke Dasbor...'
                      : 'Akun Anda telah berhasil diaktifkan. Selamat menjelajahi khazanah kebudayaan Nusantara bersama KataNusa! Mengalihkan ke Beranda...'}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengalihkan dalam beberapa detik...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 text-center mb-1.5">
                      Masukkan 6 Digit Kode Verifikasi
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.4em] text-2xl font-mono py-2.5 rounded-xl border-2 border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition-all shadow-inner"
                      autoFocus
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isVerifying || otpCode.length < 6}
                    className="w-full py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      'Memverifikasi Kode...'
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verifikasi &amp; Aktifkan Akun</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                    <span className="text-gray-500">Tidak menerima kode?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || resendMutation.isPending}
                      onClick={() => resendMutation.mutate(email)}
                      className={`font-semibold flex items-center gap-1 ${
                        resendCooldown > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700 cursor-pointer'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {resendCooldown > 0 ? (
                        <span>Kirim ulang ({resendCooldown}s)</span>
                      ) : (
                        <span>Kirim Ulang Kode</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
      </section>
    </AuthShell>
  );
};

export default Signup;
