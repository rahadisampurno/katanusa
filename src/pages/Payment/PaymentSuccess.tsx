import type React from 'react';
import { useNavigate } from 'react-router';
// @ts-expect-error - SVG import
import IconPaymentSuccess from '../../components/svgs/icon-payment-success.svg?react';
import Button from '../../components/ui/Button';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white w-full flex justify-center items-center h-screen">
      <div className=" max-w-md mx-auto p-8 flex flex-col items-center text-center relative animate-in fade-in zoom-in duration-300">
        <div className="mb-6 w-full flex justify-center">
          <IconPaymentSuccess className="w-64 h-auto" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Berhasil!
        </h2>
        <p className="text-gray-600 mb-8">
          Terima kasih telah mendukung ekosistem budaya Indonesia.
        </p>

        <div className="w-full space-y-4">
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-red-600/20 transition-all"
            onClick={() => {
              // Navigate to booking history or dashboard if available
              // For now, maybe just close or go to experts list
              navigate('/booking-history');
            }}
          >
            Lihat Booking Sesi Saya
          </Button>

          <button
            onClick={() => {
              navigate('/');
            }}
            className="w-full text-red-600 font-bold hover:text-red-700 transition-colors py-2"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
