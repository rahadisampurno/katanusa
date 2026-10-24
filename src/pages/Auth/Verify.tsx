import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import auth from '../../libs/auth';
import network from '../../libs/network';

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const intentParam = searchParams.get('intent') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Verifikasi email · KataNusa';
  }, []);

  const performVerification = useCallback(
    async (verifyPayload: {
      email: string;
      code?: string;
      token?: string;
    }) => {
      setLoading(true);
      setError('');
      try {
        await network.post('/auth/verify-email', verifyPayload);
        await auth.fetchSession();
        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
          if (intentParam === 'expert_applicant') {
            navigate('/expert/apply');
          } else {
            navigate('/');
          }
        }, 1500);
      } catch (verificationError: unknown) {
        setLoading(false);
        setError(
          verificationError &&
            typeof verificationError === 'object' &&
            'response' in verificationError &&
            (
              verificationError as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message
            ? (
                verificationError as {
                  response: { data: { error: { message: string } } };
                }
              ).response.data.error.message
            : 'Verifikasi gagal. Pastikan kode atau tautan verifikasi benar.',
        );
      }
    },
    [intentParam, navigate],
  );

  useEffect(() => {
    if (tokenParam) {
      void performVerification({ email: emailParam, token: tokenParam });
    }
  }, [emailParam, performVerification, tokenParam]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code || code.length < 6) {
      setError(
        'Masukkan 6 digit kode verifikasi yang dikirimkan ke email Anda.',
      );
      return;
    }
    void performVerification({ email, code });
  };

  const verifyingFromLink = Boolean(tokenParam && loading && !success);

  return (
    <AuthShell
      variant="verify"
      storyEyebrow="Konfirmasi perjalanan"
      storyTitle="Satu kode untuk membuka banyak cerita."
      storyDescription="Kami memastikan setiap ruang belajar dan konsultasi di KataNusa memiliki pemilik yang jelas dan terlindungi."
      topAction={<Link to="/auth/login">Kembali ke halaman masuk</Link>}
    >
      <section className="auth-panel">
        <div className="auth-heading text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#eef7f1] text-[#358654]">
            <MailCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <p className="auth-kicker">Verifikasi email</p>
          <h1>Pastikan ini benar Anda</h1>
          <p>
            {email
              ? `Kode verifikasi dikirim ke ${email}.`
              : 'Masukkan email dan kode 6 digit yang Anda terima.'}
          </p>
        </div>

        {error ? (
          <div className="auth-alert mb-5" role="alert">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{error}</span>
          </div>
        ) : null}

        {verifyingFromLink ? (
          <div
            className="rounded-2xl border border-[#dce7f5] bg-[#f7faff] p-6 text-center"
            aria-live="polite"
          >
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto mb-3 h-8 w-8 animate-spin text-[#17294b]"
            />
            <h2 className="font-itim text-xl text-gray-900">
              Memverifikasi email Anda…
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tautan sedang diperiksa. Biarkan halaman ini tetap terbuka.
            </p>
          </div>
        ) : success ? (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto mb-3 h-9 w-9 text-emerald-600"
            />
            <h2 className="font-itim text-xl text-emerald-950">
              Email berhasil diverifikasi
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              Ruang KataNusa Anda siap. Kami sedang mengalihkan Anda…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!emailParam ? (
              <div className="auth-field">
                <label htmlFor="verify-email">Alamat email</label>
                <input
                  id="verify-email"
                  type="email"
                  autoComplete="email"
                  className="px-4 py-3"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  required
                />
              </div>
            ) : null}

            <div className="auth-field">
              <label htmlFor="verification-code">Kode verifikasi 6 digit</label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                className="auth-otp px-4 py-3"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ''))
                }
                placeholder="000000"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="auth-primary-button w-full rounded-xl py-3 text-base font-bold"
            >
              {loading ? 'Memverifikasi…' : 'Verifikasi dan lanjutkan'}
            </Button>
          </form>
        )}

        {!success ? (
          <p className="mt-6 text-center text-sm text-gray-600">
            Kode belum diterima? Periksa folder spam atau{' '}
            <Link to="/auth/signup" className="auth-inline-link">
              kembali ke pendaftaran
            </Link>
            .
          </p>
        ) : null}
      </section>
    </AuthShell>
  );
};

export default Verify;
