import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startRegistration } from '@simplewebauthn/browser';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Lock,
  Mail,
  MonitorSmartphone,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import PhotoUpload from '../../../components/ui/PhotoUpload';
import { TablePagination } from '../../../components/ui/TablePagination';
import auth from '../../../libs/auth';
import network from '../../../libs/network';

dayjs.locale('id');

interface ConsentItem {
  id: string;
  scope: string;
  version: string;
  granted: boolean;
  withdrawn_at: string | null;
  created_at: string;
}

interface DataRightsRequest {
  id: string;
  request_type: string;
  status: string;
  due_at: string;
  created_at: string;
}

interface AccountSession {
  id: string;
  assuranceLevel: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface PasskeyItem {
  id: string;
  label: string;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export const RuangSayaProfil: React.FC = () => {
  const queryClient = useQueryClient();
  const user = auth.getUserData();
  const [notice, setNotice] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [mfaMethodId, setMfaMethodId] = useState('');
  const [otpAuthUri, setOtpAuthUri] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const { data: dashboardData } = useQuery<{
    user: { id: string; email: string; name: string; avatar_url?: string | null };
  }>({
    queryKey: ['me-dashboard'],
    queryFn: async () => {
      const res = await network.get('/me/dashboard');
      return res.data;
    },
  });

  const currentUser = dashboardData?.user || user;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardData?.user?.avatar_url) {
      setAvatarUrl(dashboardData.user.avatar_url);
    }
  }, [dashboardData?.user?.avatar_url]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('notice') === 'expert-mfa-required' || params.get('setup') === 'mfa') {
      setNotice(
        'Sebagai Pakar Budaya terverifikasi, silakan aktifkan Autentikasi Dua Faktor (MFA) di bawah untuk membuka akses operasional ke Ruang Pakar.',
      );
      setTimeout(() => {
        const mfaEl = document.getElementById('mfa-setup-section');
        if (mfaEl) {
          mfaEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, []);

  const updateAvatarMutation = useMutation({
    mutationFn: async (newAvatar: string | null) => {
      await network.put('/me/profile', { avatar_url: newAvatar });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['expert-profile-details'] });
      setNotice('Foto profil berhasil diperbarui.');
      setTimeout(() => setNotice(''), 3000);
    },
  });

  const { data: privacyData } = useQuery<{
    consents: ConsentItem[];
    dataRightsRequests: DataRightsRequest[];
  }>({
    queryKey: ['me-privacy'],
    queryFn: async () => {
      const res = await network.get('/me/privacy');
      return res.data;
    },
  });

  const toggleConsentMutation = useMutation({
    mutationFn: async ({ scope, granted }: { scope: string; granted: boolean }) => {
      await network.post('/me/privacy/consent', { scope, granted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-privacy'] });
      setNotice('Preferensi konsen privasi berhasil diperbarui.');
      setTimeout(() => setNotice(''), 3000);
    },
  });

  const requestDataExportMutation = useMutation({
    mutationFn: async () => network.post('/me/privacy/requests', { requestType: 'export' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-privacy'] });
      setNotice('Permintaan salinan data diterima dan kini dapat dipantau di halaman ini.');
    },
    onError: () => setNotice('Permintaan belum dapat diproses. Masuk ulang lalu coba kembali.'),
  });

  const { data: sessionData } = useQuery<{ sessions: AccountSession[] }>({
    queryKey: ['account-sessions'],
    queryFn: async () => (await network.get('/auth/sessions')).data,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => network.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-sessions'] });
      setNotice('Sesi perangkat berhasil dicabut.');
    },
  });

  const { data: passkeyData } = useQuery<{ passkeys: PasskeyItem[] }>({
    queryKey: ['account-passkeys'],
    queryFn: async () => (await network.get('/auth/passkeys')).data,
  });

  // Session Search, Filter & Pagination
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'current' | 'other'>('all');
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionPageSize, setSessionPageSize] = useState(5);

  useEffect(() => {
    setSessionPage(1);
  }, [sessionSearch, sessionFilter, sessionPageSize]);

  const allSessions = sessionData?.sessions ?? [];
  const filteredSessions = allSessions.filter((s) => {
    if (sessionFilter === 'current' && !s.isCurrent) return false;
    if (sessionFilter === 'other' && s.isCurrent) return false;
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      const matchAgent = s.userAgent?.toLowerCase().includes(q);
      const matchAal = s.assuranceLevel?.toLowerCase().includes(q);
      if (!matchAgent && !matchAal) return false;
    }
    return true;
  });

  const sessionTotalPages = Math.ceil(filteredSessions.length / sessionPageSize) || 1;
  const paginatedSessions = filteredSessions.slice(
    (sessionPage - 1) * sessionPageSize,
    sessionPage * sessionPageSize
  );

  const revokePasskeyMutation = useMutation({
    mutationFn: async (credentialId: string) => network.delete(`/auth/passkeys/${credentialId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-passkeys'] });
      setNotice('Passkey berhasil dicabut.');
    },
    onError: () => setNotice('Passkey belum dapat dicabut. Pastikan sesi AAL2 masih baru.'),
  });

  const consents = privacyData?.consents || [];
  const getConsentState = (scope: string) => {
    const item = consents.find((c) => c.scope === scope && !c.withdrawn_at);
    return Boolean(item?.granted);
  };

  const startMfaEnrollment = async (): Promise<void> => {
    try {
      const response = await network.post('/auth/mfa/totp/enroll', { password: currentPassword });
      setMfaMethodId(response.data.methodId);
      setOtpAuthUri(response.data.otpAuthUri);
      setNotice('Secret autentikator dibuat. Tambahkan URI ke aplikasi autentikator lalu konfirmasi kodenya.');
    } catch {
      setNotice('Autentikasi ulang gagal. Periksa kata sandi Anda.');
    }
  };

  const confirmMfaEnrollment = async (): Promise<void> => {
    try {
      const response = await network.post('/auth/mfa/totp/confirm', {
        methodId: mfaMethodId,
        code: mfaCode,
      });
      setRecoveryCodes(response.data.recoveryCodes ?? []);
      setOtpAuthUri('');
      setMfaCode('');
      setNotice('MFA berhasil diaktifkan. Simpan recovery codes, lalu masuk ulang untuk memperoleh sesi AAL2.');
    } catch {
      setNotice('Kode autentikator tidak valid.');
    }
  };

  const registerPasskey = async (): Promise<void> => {
    try {
      const optionsResponse = await network.post('/auth/passkeys/register/options');
      const credential = await startRegistration({ optionsJSON: optionsResponse.data.options });
      await network.post('/auth/passkeys/register/verify', {
        challengeId: optionsResponse.data.challengeId,
        response: credential,
        label: 'Perangkat utama',
      });
      setNotice('Passkey berhasil ditambahkan. Anda dapat menggunakannya untuk masuk dengan AAL2.');
    } catch {
      setNotice('Passkey gagal ditambahkan. Masuk ulang bila sesi autentikasi sudah terlalu lama.');
    }
  };

  return (
    <div className="kn-profile-page space-y-6 max-w-5xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
          Profil, Privasi & Keamanan Akun
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Kelola data pribadi Anda, kendali konsen privasi sesuai UU PDP, dan keamanan otentikasi.
        </p>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 1. Informasi Akun */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <User className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Informasi Akun Pribadi
          </h3>
        </div>

        <div className="border-b border-white/10 pb-4">
          <PhotoUpload
            value={avatarUrl}
            onChange={(newUrl) => {
              setAvatarUrl(newUrl);
              updateAvatarMutation.mutate(newUrl);
            }}
            label="Foto Profil Akun"
            hint="Format JPG, PNG, atau WebP (maks. 5 MB). Foto profil ini ditampilkan di ruang bimbingan dan interaksi budaya."
            shape="circle"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
            <span className="font-bold text-white text-sm">{currentUser?.name || 'Pelajar Budaya'}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400 block text-[11px]">Alamat Email:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{currentUser?.email || 'peserta@katanusa.id'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Terverifikasi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pusat Kendali Konsen Granular (UU Pelindungan Data Pribadi) */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pusat Kendali Konsen & Privasi Data (UU PDP)
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Konsen Rujukan AI Persona Budaya</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mengizinkan materi pertanyaan atau rangkuman edukasi Anda menjadi rujukan pencarian pengetahuan AI Persona Budaya KataNusa.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={getConsentState('retrieval_rag')}
                onChange={(e) =>
                  toggleConsentMutation.mutate({
                    scope: 'retrieval_rag',
                    granted: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Konsen Pelatihan Model AI (Training)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Materi Anda tidak akan pernah digunakan untuk melatih bobot model AI fondasi tanpa persetujuan eksplisit Anda.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={getConsentState('model_training')}
                onChange={(e) =>
                  toggleConsentMutation.mutate({
                    scope: 'model_training',
                    granted: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>
        </div>

        {/* Hak Subjek Data */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => requestDataExportMutation.mutate()}
            disabled={requestDataExportMutation.isPending}
            className="text-xs font-semibold text-slate-200 border-white/20 hover:bg-white/5 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{requestDataExportMutation.isPending ? 'Mencatat permintaan…' : 'Minta Salinan Data Pribadi'}</span>
          </Button>
          {privacyData?.dataRightsRequests?.[0] ? (
            <p className="text-[11px] text-slate-300">
              Permintaan terakhir: {privacyData.dataRightsRequests[0].request_type} ·{' '}
              <span className="font-semibold text-amber-300">{privacyData.dataRightsRequests[0].status}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* 3. Keamanan Sesi & Kata Sandi */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Keamanan Otentikasi & Sesi
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">Tingkat Jaminan Keamanan (AAL)</h4>
            <p className="text-[11px] text-slate-300">
              Sesi Anda aktif pada {user?.assuranceLevel ?? 'AAL1'}. Tindakan sensitif dan Ruang Pakar memerlukan AAL2.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Aman
          </span>
        </div>

        <div id="mfa-setup-section" className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Authenticator MFA</h4>
          </div>
          {!mfaMethodId && recoveryCodes.length === 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Konfirmasi kata sandi saat ini"
                className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <Button type="button" onClick={startMfaEnrollment} disabled={!currentPassword} className="text-xs">
                Aktifkan MFA
              </Button>
            </div>
          ) : null}
          {otpAuthUri ? (
            <div className="space-y-3 text-xs text-slate-200">
              <p>Salin URI berikut ke aplikasi autentikator. Jangan bagikan URI ini.</p>
              <code className="block break-all rounded-lg bg-slate-950 p-3">{otpAuthUri}</code>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ''))}
                  placeholder="Kode 6 digit"
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                />
                <Button type="button" onClick={confirmMfaEnrollment} disabled={mfaCode.length !== 6} className="text-xs">
                  Konfirmasi
                </Button>
              </div>
            </div>
          ) : null}
          {recoveryCodes.length > 0 ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              <p className="font-bold">Recovery codes—ditampilkan satu kali:</p>
              <div className="mt-2 grid grid-cols-1 gap-2 font-mono sm:grid-cols-2">
                {recoveryCodes.map((code) => <span key={code}>{code}</span>)}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Passkey</h4>
            <p className="mt-1 text-[11px] text-slate-300">
              Gunakan sidik jari, Face ID, PIN perangkat, atau security key untuk login tahan phishing.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={registerPasskey} className="w-full shrink-0 text-xs sm:w-auto">
            Tambah passkey
          </Button>
        </div>

        {passkeyData?.passkeys.length ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white">Passkey terdaftar</h4>
            {passkeyData.passkeys.map((passkey) => (
              <div key={passkey.id} className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
                <div>
                  <p className="font-semibold text-white">{passkey.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {passkey.deviceType ?? 'Perangkat tidak dikenali'} · dibuat {dayjs(passkey.createdAt).format('D MMM YYYY')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => revokePasskeyMutation.mutate(passkey.id)}
                  disabled={revokePasskeyMutation.isPending}
                  className="text-xs"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Cabut
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Perangkat & sesi aktif ({allSessions.length})</h4>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-0.5 bg-[#0F1B38] rounded-lg border border-white/10 w-fit text-[11px]">
              <button
                type="button"
                onClick={() => setSessionFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  sessionFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({allSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('current')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  sessionFilter === 'current'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sesi Ini
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('other')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  sessionFilter === 'other'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Perangkat Lain ({allSessions.filter((s) => !s.isCurrent).length})
              </button>
            </div>
          </div>

          {/* Search input if more than 3 sessions */}
          {allSessions.length > 3 && (
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari browser atau tingkat jaminan..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1 bg-[#0F1B38] border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
              />
              {sessionSearch && (
                <button
                  type="button"
                  onClick={() => setSessionSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {filteredSessions.length > 0 ? (
            <div className="space-y-2">
              <div className="divide-y divide-white/10">
                {paginatedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-white">
                          {session.userAgent || 'Perangkat tidak dikenali'}
                        </p>
                        {session.isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                            Sesi Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Jaminan: <strong className="text-amber-300 font-mono">{session.assuranceLevel}</strong> · Terakhir aktif{' '}
                        {dayjs(session.lastActiveAt).format('D MMM YYYY, HH:mm')} WIB
                      </p>
                    </div>

                    {!session.isCurrent ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => revokeSessionMutation.mutate(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        className="shrink-0 text-xs py-1 px-2.5"
                      >
                        Cabut sesi
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>

              {filteredSessions.length > sessionPageSize && (
                <TablePagination
                  currentPage={sessionPage}
                  totalPages={sessionTotalPages}
                  totalItems={filteredSessions.length}
                  pageSize={sessionPageSize}
                  onPageChange={setSessionPage}
                  onPageSizeChange={setSessionPageSize}
                  pageSizeOptions={[5, 10]}
                />
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Tidak ada sesi yang cocok dengan filter atau pencarian Anda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
