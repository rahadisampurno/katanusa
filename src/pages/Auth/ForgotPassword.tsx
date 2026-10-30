import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { getApiErrorMessage } from '../../libs/apiError';
import network from '../../libs/network';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: requestReset } = useMutation({
    mutationFn: async (payload: { email: string }) =>
      await network.post('/auth/password-reset/request', payload),
    onSuccess: () => {
      setIsLoading(false);
      setIsSuccess(true);
    },
    onError: (err: unknown) => {
      setIsLoading(false);
      setError(
        getApiErrorMessage(
          err,
          'Gagal memproses permintaan pemulihan kata sandi.',
        ),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Alamat email harus diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Format email belum valid (contoh: nama@domain.com).');
      return;
    }

    setIsLoading(true);
    requestReset({ email: trimmed });
  };

  return (
    <AuthShell
      variant="verify"
      storyEyebrow="Pemulihan Akun"
      storyTitle="Temukan kembali jalan ke ruang Anda."
      storyDescription="Kami akan mengirimkan tautan pemulihan kata sandi ke alamat email yang terdaftar agar perjalanan budaya Anda tetap lancar."
      topAction={
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17294b] hover:text-[#b91c1c] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Masuk</span>
        </Link>
      }
    >
      <section className="auth-panel">
        {isSuccess ? (
          <div className="space-y-6 text-center py-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                Periksa Kotak Masuk Anda
              </h1>
              <p className="text-sm leading-relaxed text-gray-600">
                Jika alamat <strong className="text-gray-900">{email}</strong> terdaftar
                di KataNusa, kami telah mengirimkan tautan untuk mengatur ulang
                kata sandi Anda.
              </p>
              <p className="text-xs text-gray-500 pt-1">
                Jangan lupa memeriksa folder spam jika email tidak muncul dalam
                beberapa menit.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Kirim ulang dengan email lain
              </button>

              <Link
                to="/auth/login"
                className="block text-center text-sm font-semibold text-[#b91c1c] hover:underline"
              >
                Kembali ke halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <p className="auth-kicker">Akses Akun</p>
              <h1>Lupa kata sandi?</h1>
              <p>
                Masukkan email akun KataNusa Anda. Kami akan mengirimkan tautan
                untuk membuat kata sandi baru.
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
                <label htmlFor="email">Alamat email terdaftar</label>
                <div className="auth-field__control">
                  <Mail className="auth-field__icon" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-field__input px-4 py-3"
                    placeholder="nama@email.com"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="auth-primary-button w-full rounded-xl py-3 text-base font-bold flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mengirim tautan...</span>
                  </>
                ) : (
                  'Kirim tautan pemulihan'
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#b91c1c] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Ingat kata sandi? Masuk</span>
                </Link>
              </div>
            </form>
          </>
        )}
      </section>
    </AuthShell>
  );
};

export default ForgotPassword;
