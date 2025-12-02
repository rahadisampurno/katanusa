import { CheckCircle } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router';
import Button from '../ui/Button';

interface SignupSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignupSuccessModal: React.FC<SignupSuccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 flex flex-col items-center text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className="mb-6 w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pendaftaran Berhasil!
        </h2>
        <p className="text-gray-600 mb-8">
          Selamat datang di KataNusa! Akun Anda telah berhasil dibuat. Silakan
          masuk untuk mulai menjelajahi budaya Nusantara.
        </p>

        <div className="w-full space-y-4">
          <Button
            className="w-full bg-[#1E315A] hover:bg-[#152440] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-[#1E315A]/20 transition-all"
            onClick={() => {
              onClose();
              navigate('/auth/login');
            }}
          >
            Masuk Sekarang
          </Button>

          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full text-[#1E315A] font-bold hover:text-[#152440] transition-colors py-2"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccessModal;
