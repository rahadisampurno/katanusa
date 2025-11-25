import { Eye, EyeOff } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import SignupSuccessModal from '../../components/modals/SignupSuccessModal';
// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../../components/svgs/logo-katanusa-white.svg?react';
import Button from '../../components/ui/Button';
import auth from '../../libs/auth';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'umum' | 'pakar'>('umum');
  const [scientificWorkLink, setScientificWorkLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSignup = (e: React.FormEvent): void => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Semua kolom harus diisi');
      setIsLoading(false);
      return;
    }

    if (role === 'pakar' && !scientificWorkLink) {
      setError('Tautan karya ilmiah harus diisi untuk pendaftaran Pakar');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      setIsLoading(false);
      return;
    }

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock success - show modal
      setShowSuccessModal(true);
    }, 1500);
  };

  return (
    <>
      <div className="min-h-screen flex w-full">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1E315A] flex-col justify-between p-12 relative overflow-hidden">
          {/* Background Pattern Overlay (Optional) */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <Link to="/">
              <LogoKataNusaWhite className="h-12 w-auto" />
            </Link>
          </div>

          <div className="relative z-10 text-white max-w-lg">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Bergabung dengan Komunitas Kami
            </h1>
            <p className="text-xl text-gray-300">
              Daftar sekarang untuk mulai terhubung dengan pakar budaya dan
              memperluas wawasan Anda tentang Nusantara.
            </p>
          </div>

          <div className="relative z-10 text-gray-400 text-sm">
            © 2025 KataNusa. All rights reserved.
          </div>
        </div>

        {/* Right Panel - Signup Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-8 lg:p-24">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Buat Akun Baru
              </h2>
              <p className="text-gray-500">
                Lengkapi data diri Anda untuk mendaftar.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                  placeholder="Nama Lengkap Anda"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daftar Sebagai
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="umum"
                      checked={role === 'umum'}
                      onChange={(e) =>
                        setRole(e.target.value as 'umum' | 'pakar')
                      }
                      className="w-4 h-4 text-[#1E315A] focus:ring-[#1E315A] border-gray-300"
                    />
                    <span className="text-gray-700">Umum</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="pakar"
                      checked={role === 'pakar'}
                      onChange={(e) =>
                        setRole(e.target.value as 'umum' | 'pakar')
                      }
                      className="w-4 h-4 text-[#1E315A] focus:ring-[#1E315A] border-gray-300"
                    />
                    <span className="text-gray-700">Pakar</span>
                  </label>
                </div>
              </div>

              {role === 'pakar' && (
                <div>
                  <label
                    htmlFor="scientificWorkLink"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cantumkan tautan karya ilmiah Anda{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="scientificWorkLink"
                    type="url"
                    value={scientificWorkLink}
                    onChange={(e) => setScientificWorkLink(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-lg rounded-xl mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
              </Button>
            </form>

            <div className="mt-8 hidden">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Atau daftar dengan
                  </span>
                </div>
              </div>

              <div className="mt-6 hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Google
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-bold text-[#1E315A] hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SignupSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          auth.setAccessToken('mock_access_token');
          auth.setUserData({
            email: 'dena@katanusa.com',
            name: 'Dena Hardianto',
          });
          navigate('/');
        }}
      />
    </>
  );
};

export default Signup;
