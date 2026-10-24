import { useMutation } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button';
import network from '../../libs/network';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    mutateAsync: confirmPayment,
    isPending,
    isError,
    data: paymentResponse,
  } = useMutation({
    mutationKey: ['payment-success', searchParams],
    mutationFn: async () => {
      const orderId = searchParams.get('order_id');
      if (!orderId) throw new Error('Order ID tidak tersedia.');
      if (searchParams.get('provider') === 'mock') {
        return await network.post(`/payments/mock/${orderId}/complete`);
      }
      return await network.get(`/booking/${orderId}`);
    },
  });

  useEffect(() => {
    void confirmPayment();
  }, [confirmPayment]);

  const status =
    paymentResponse?.data?.status ?? paymentResponse?.data?.data?.status;
  const isPaid = status === 'paid' || status === 'completed';

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-white px-4 py-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-auto flex max-w-md flex-col items-center p-4 text-center animate-in fade-in zoom-in duration-300 sm:p-8">
        <div className="mb-6 w-full flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CircleCheck aria-hidden="true" className="h-20 w-20" strokeWidth={1.8} />
            <span className="sr-only">Pembayaran berhasil</span>
          </div>
        </div>

        {isPending ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Penyampaian Apresiasi Sedang Diproses
            </h2>
          </>
        ) : isError ? (
          <>
            <h2 className="text-2xl font-bold text-red-700 mb-2">
              Konfirmasi Apresiasi Belum Selesai
            </h2>
            <p className="text-gray-600 mb-8">
              Silakan periksa agenda bimbingan Anda atau coba beberapa saat lagi.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isPaid ? 'Apresiasi Berhasil Disampaikan!' : 'Penyampaian Apresiasi Sedang Diproses'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isPaid
                ? 'Matur nuwun / Terima kasih atas ketulusan Anda mendukung sanggar, bahasa daerah, dan pelestarian pusaka tradisi Nusantara.'
                : 'Status dukungan akan diperbarui setelah dikonfirmasi oleh sistem verifikasi.'}
            </p>
          </>
        )}

        <div className="w-full space-y-4">
          {isPending ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-red-600/20 transition-all"
                onClick={() => {
                  navigate('/booking-history');
                }}
              >
                Lihat Agenda Bimbingan Budaya
              </Button>

              <button
                onClick={() => {
                  navigate('/');
                }}
                className="w-full text-red-600 font-bold hover:text-red-700 transition-colors py-2"
              >
                Kembali ke Beranda
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
