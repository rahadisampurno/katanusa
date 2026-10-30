import { useMutation } from '@tanstack/react-query';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { getApiErrorMessage, getApiErrorStatus } from '../../libs/apiError';
import auth from '../../libs/auth';
import network from '../../libs/network';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaChallenge, setMfaChallenge] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);

  useEffect(() => {
    document.title = mfaChallenge
      ? 'Verifikasi keamanan · KataNusa'
      : 'Masuk · KataNusa';
  }, [mfaChallenge]);

  // Deteksi kapabilitas passkey di peramban pengguna
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setIsPasskeySupported(available))
        .catch(() => setIsPasskeySupported(false));
    }
  }, []);

  const checkCapsLock = (event: React.KeyboardEvent) => {
    if (event.getModifierState) {
      setCapsLockActive(event.getModifierState('CapsLock'));
    }
  };

  const handleSuccessfulAuth = async (mfaEnrollmentRequired?: boolean) => {
    await auth.fetchSession();
    const user = auth.getUserData();
    const caps = auth.getCapabilities();
    const isAdmin = caps.includes('admin') || user?.role === 'admin';
    const isReviewer = caps.some((c) =>
      ['credential_reviewer', 'cultural_reviewer', 'knowledge_reviewer'].includes(c)
    );
    const isExpert = caps.includes('expert_verified') || user?.role === 'pakar';

    if (isAdmin) {
      localStorage.setItem('active_workspace', 'admin');
    } else if (isReviewer) {
      localStorage.setItem('active_workspace', 'reviewer');
    } else if (isExpert) {
      localStorage.setItem('active_workspace', 'expert');
    }

    if (mfaEnrollmentRequired) {
      navigate('/dashboard/profil?setup=mfa&notice=expert-mfa-required');
    } else if (
      rawReturnUrl &&
      rawReturnUrl.startsWith('/') &&
      !rawReturnUrl.startsWith('//')
    ) {
      navigate(rawReturnUrl);
    } else if (isAdmin) {
      navigate('/admin');
    } else if (isReviewer) {
      navigate('/reviewer/applications');
    } else if (isExpert) {
      navigate('/dashboard/pakar');
    } else {
      navigate('/dashboard');
    }
  };

  const { mutate: submitLogin } = useMutation({
    mutationFn: async () =>
      await network.post('/auth/login', {
        email: email.trim(),
        password,
      }),
    onSuccess: async (response) => {
      if (response.data.mfaRequired) {
        setMfaChallenge(response.data.challengeToken);
        setIsLoading(false);
        return;
      }
      await handleSuccessfulAuth(response.data.mfaEnrollmentRequired);
    },
    onError: (loginError: unknown) => {
      const msg = getApiErrorMessage(loginError, '');

      if (
        msg.toLowerCase().includes('kredensial') ||
        msg.toLowerCase().includes('sandi') ||
        msg.toLowerCase().includes('password') ||
        msg.toLowerCase().includes('email') ||
        getApiErrorStatus(loginError) === 401
      ) {
        setError(
          'Email atau kata sandi tidak cocok. Silakan periksa kembali atau gunakan fitur lupa kata sandi.',
        );
      } else {
        setError(msg || 'Gagal masuk. Silakan coba kembali.');
      }
      setIsLoading(false);
    },
  });

  const handleLogin = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email dan kata sandi harus diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email belum valid (contoh: nama@domain.com).');
      return;
    }

    setIsLoading(true);
    submitLogin();
  };

  const handleMfa = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await network.post('/auth/mfa/verify', {
        challengeToken: mfaChallenge,
        ...(useRecoveryCode
          ? { recoveryCode: mfaCode.trim() }
          : { totpCode: mfaCode }),
      });
      await handleSuccessfulAuth();
    } catch {
      setError('Kode autentikator tidak valid atau sudah kedaluwarsa.');
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    try {
      const optionsResponse = await network.post(
        '/auth/passkeys/login/options',
      );
      const credential = await startAuthentication({
        optionsJSON: optionsResponse.data.options,
      });
      await network.post('/auth/passkeys/login/verify', {
        challengeId: optionsResponse.data.challengeId,
        response: credential,
      });
      await handleSuccessfulAuth();
    } catch {
      setError('Passkey tidak dapat diverifikasi atau proses dibatalkan.');
      setIsLoading(false);
    }
  };

  if (mfaChallenge) {
    return (
      <AuthShell
        variant="verify"
        storyEyebrow="Satu langkah lagi"
        storyTitle="Jaga ruang belajar Anda tetap aman."
        storyDescription="Verifikasi singkat ini memastikan perjalanan budaya Anda hanya dapat diakses oleh Anda."
        topAction={<Link to="/">Kembali ke beranda</Link>}
      >
        <section className="auth-panel">
          <div className="auth-heading text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#fbf2ef] text-[#b91c1c]">
              <ShieldCheck aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="auth-kicker">Keamanan akun</p>
            <h1>Verifikasi keamanan</h1>
            <p>
              {useRecoveryCode
                ? 'Masukkan salah satu recovery code yang belum pernah digunakan.'
                : 'Masukkan kode 6 digit dari aplikasi autentikator Anda.'}
            </p>
          </div>

          <form onSubmit={handleMfa} className="space-y-5">
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
              <label htmlFor="mfa-code">
                {useRecoveryCode ? 'Recovery code' : 'Kode autentikator'}
              </label>
              <input
                id="mfa-code"
                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                pattern={useRecoveryCode ? undefined : '[0-9]*'}
                autoComplete="one-time-code"
                maxLength={useRecoveryCode ? 32 : 6}
                value={mfaCode}
                onChange={(event) =>
                  setMfaCode(
                    useRecoveryCode
                      ? event.target.value.trimStart()
                      : event.target.value.replace(/\D/g, ''),
                  )
                }
                className="auth-otp px-4 py-3"
                placeholder={useRecoveryCode ? 'Recovery code' : '000000'}
                autoFocus
                required
              />
            </div>

            <button
              type="button"
              className="w-full text-center text-sm font-semibold text-[#b91c1c] underline underline-offset-4"
              onClick={() => {
                setUseRecoveryCode((current) => !current);
                setMfaCode('');
                setError('');
              }}
            >
              {useRecoveryCode
                ? 'Gunakan kode aplikasi autentikator'
                : 'Tidak bisa mengakses autentikator? Gunakan recovery code'}
            </button>

            <Button
              type="submit"
              disabled={
                isLoading ||
                (useRecoveryCode
                  ? mfaCode.trim().length < 8
                  : mfaCode.length !== 6)
              }
              className="auth-primary-button w-full rounded-xl py-3 text-base font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memverifikasi…</span>
                </>
              ) : (
                'Lanjutkan dengan aman'
              )}
            </Button>
          </form>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="login"
      storyEyebrow="Kembali ke KataNusa"
      storyTitle="Lanjutkan perjalanan di antara cerita Nusantara."
      storyDescription="Temui pakar, simpan pengetahuan, dan lanjutkan percakapan budaya Anda dari satu ruang yang hangat."
    >
      <section className="auth-panel">
        <div className="auth-heading">
          <p className="auth-kicker">Akses Ruang Anda</p>
          <h1>Selamat datang kembali!</h1>
          <p>
            Masuk untuk melanjutkan perjalanan dan cerita budaya bersama KataNusa.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
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
            <label htmlFor="email">Alamat email</label>
            <div className="auth-field__control">
              <Mail className="auth-field__icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="auth-field__input px-4 py-2.5"
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="flex items-center justify-between">
              <label htmlFor="password">Kata sandi</label>
              <Link
                to="/auth/forgot-password"
                className="text-xs font-semibold text-[#b91c1c] hover:text-[#991b1b] hover:underline transition-colors"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="auth-field__control">
              <LockKeyhole
                className="auth-field__icon"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={checkCapsLock}
                onKeyUp={checkCapsLock}
                className="auth-field__input py-2.5 pr-12"
                placeholder="Masukkan kata sandi"
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
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>

            {capsLockActive && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Caps Lock sedang aktif. Periksa huruf besar/kecil Anda.</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="auth-primary-button w-full rounded-xl py-2.5 text-base font-bold flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Membuka ruang Anda…</span>
              </>
            ) : (
              'Masuk ke KataNusa'
            )}
          </Button>
        </form>

        {isPasskeySupported && (
          <>
            <div className="my-3.5 flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              <span>atau gunakan akses perangkat</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-[#dcd4ca] py-2.5 text-gray-700 hover:bg-[#faf8f5] hover:border-gray-400 transition-colors"
              disabled={isLoading}
              onClick={handlePasskeyLogin}
            >
              <span className="flex items-center justify-center gap-2">
                <Fingerprint aria-hidden="true" className="h-5 w-5 text-[#b91c1c]" />
                Masuk dengan passkey
              </span>
            </Button>
          </>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          Belum memiliki akun?{' '}
          <Link
            to="/auth/signup"
            className="auth-inline-link font-semibold text-[#b91c1c] hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </section>
    </AuthShell>
  );
};

export default Login;
