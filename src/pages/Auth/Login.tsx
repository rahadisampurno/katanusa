import { Eye, EyeOff } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
// @ts-expect-error - SVG import
import LogoKataNusaWhite from '../../components/svgs/logo-katanusa-white.svg?react';
import Button from '../../components/ui/Button';
import auth from '../../libs/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Email dan kata sandi harus diisi');
      setIsLoading(false);
      return;
    }

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);

      if (password !== 'bismillahjuara1') {
        alert('Password salah');
        return;
      }

      switch (email) {
        case 'dena@katanusa.com':
          auth.setUserData({
            email: 'dena@katanusa.com',
            name: 'Dena Hardianto',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        case 'rahadi@katanusa.com':
          auth.setUserData({
            email: 'rahadi@katanusa.com',
            name: 'Rahadi Sampurno',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        case 'rahma@katanusa.com':
          auth.setUserData({
            email: 'rahma@katanusa.com',
            name: 'Anisa Rahma',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        case 'danu@katanusa.com':
          auth.setUserData({
            email: 'danu@katanusa.com',
            name: 'Danu Ega Pratama',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        case 'agung@katanusa.com':
          auth.setUserData({
            email: 'agung@katanusa.com',
            name: 'M Agung Rizkyana',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        case 'budayago@katanusa.com':
          auth.setUserData({
            email: 'budayago@katanusa.com',
            name: 'BudayaGo',
          });
          auth.setAccessToken('mock-token');
          navigate('/');
          break;
        default:
          alert('Email tidak terdaftar');
          break;
      }
    }, 1500);
  };

  return (
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
            Jelajahi Kekayaan Budaya Nusantara
          </h1>
          <p className="text-xl text-gray-300">
            Bergabunglah dengan ribuan pengguna lainnya dan temukan pakar budaya
            terbaik untuk kebutuhan Anda.
          </p>
        </div>

        <div className="relative z-10 text-gray-400 text-sm">
          © 2025 KataNusa. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-8 lg:p-24">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang Kembali
            </h2>
            <p className="text-gray-500">
              Masuk untuk mengakses akun Anda dan mulai menjelajah.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

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
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#1E315A] hover:underline"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-lg rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-8 hidden">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Atau masuk dengan
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
            Belum punya akun?{' '}
            <Link
              to="/signup"
              className="font-bold text-[#1E315A] hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
