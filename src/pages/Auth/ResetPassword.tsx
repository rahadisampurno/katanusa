import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { getApiErrorMessage } from '../../libs/apiError';
import network from '../../libs/network';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsRecoveryCode, setNeedsRecoveryCode] = useState(false);

  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const { mutate: confirmReset } = useMutation({
    mutationFn: async (payload: {
      token: string;
      newPassword: string;
      recoveryCode?: string;
    }) => await network.post('/auth/password-reset/confirm', payload),
    onSuccess: () => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    },
    onError: (err: unknown) => {
      setIsLoading(false);
      const msg = getApiErrorMessage(err, 'Gagal memperbarui kata sandi.');

      if (msg.toLowerCase().includes('recovery code')) {
        setNeedsRecoveryCode(true);
      }
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token pemulihan tidak ditemukan atau tidak valid.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi baru harus minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    confirmReset({
      token,
      newPassword,
      recoveryCode: recoveryCode ? recoveryCode.trim() : undefined,
    });
  };

  if (!token) {
    return (
      <AuthShell
        variant="verify"
        storyEyebrow="Pemulihan Akun"
        storyTitle="Tautan tidak dapat digunakan."
        storyDescription="Tautan pemulihan kata sandi tidak memuat kode verifikasi yang diperlukan. Silakan ajukan permohonan baru."
        topAction={<Link to="/auth/login">Masuk ke KataNusa</Link>}
      >
        <section className="auth-panel text-center py-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Tautan Tidak Valid
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Tautan pemulihan kata sandi ini tidak lengkap atau telah kedaluwarsa.
          </p>
          <Link
            to="/auth/forgot-password"
            className="inline-block rounded-xl bg-[#b91c1c] px-6 py-3 text-sm font-bold text-white hover:bg-[#991b1b] transition-colors"
          >
            Minta tautan baru
          </Link>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="verify"
      storyEyebrow="Keamanan Akun"
      storyTitle="Amankan kembali ruang budaya Anda."
      storyDescription="Pilih kata sandi baru yang kuat dan mudah Anda ingat untuk melindungi data dan interaksi Anda di KataNusa."
      topAction={<Link to="/auth/login">Masuk ke KataNusa</Link>}
    >
      <section className="auth-panel">
        {isSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                Kata Sandi Berhasil Diperbarui!
              </h1>
              <p className="text-sm leading-relaxed text-gray-600">
                Kata sandi untuk akun <strong className="text-gray-900">{email || 'Anda'}</strong>{' '}
                telah berhasil diperbarui. Anda akan dialihkan ke halaman masuk dalam beberapa detik...
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/auth/login"
                className="inline-block w-full rounded-xl bg-[#b91c1c] py-3 text-sm font-bold text-white hover:bg-[#991b1b] transition-colors"
              >
                Masuk Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <p className="auth-kicker">Kata Sandi Baru</p>
              <h1>Atur kata sandi baru</h1>
              <p>
                {email
                  ? `Masukkan kata sandi baru untuk akun ${email}.`
                  : 'Masukkan kata sandi baru yang aman untuk akun Anda.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="auth-alert" role="alert">
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="auth-field">
                <label htmlFor="newPassword">Kata sandi baru</label>
                <div className="auth-field__control">
                  <LockKeyhole
                    className="auth-field__icon"
                    aria-hidden="true"
                  />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    className="auth-field__input py-3 pr-12"
                    placeholder="Minimal 8 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-field__toggle"
                    aria-label={
                      showPassword
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Konfirmasi kata sandi</label>
                <div className="auth-field__control">
                  <LockKeyhole
                    className="auth-field__icon"
                    aria-hidden="true"
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    className="auth-field__input py-3 pr-12"
                    placeholder="Ulangi kata sandi baru"
                    required
                  />
                </div>
              </div>

              {capsLockActive && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Caps Lock aktif. Periksa huruf besar/kecil Anda.</span>
                </div>
              )}

              {needsRecoveryCode && (
                <div className="auth-field pt-2">
                  <label htmlFor="recoveryCode" className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#b91c1c]" />
                    <span>Recovery Code (Akun Berprivilege)</span>
                  </label>
                  <input
                    id="recoveryCode"
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="auth-field__input px-4 py-3"
                    placeholder="Masukkan salah satu recovery code Anda"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Akun staf atau berprivilege memerlukan recovery code untuk
                    pemulihan kata sandi.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="auth-primary-button w-full rounded-xl py-3 text-base font-bold flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menyimpan kata sandi...</span>
                  </>
                ) : (
                  'Simpan kata sandi baru'
                )}
              </Button>
            </form>
          </>
        )}
      </section>
    </AuthShell>
  );
};

export default ResetPassword;
