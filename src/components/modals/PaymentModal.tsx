import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import auth from '../../libs/auth';
import network from '../../libs/network';
import Button from '../ui/Button';

interface Expert {
  id: string;
  name: string;
  role: string;
  image: string;
}

interface SessionType {
  id: string;
  label: string;
  duration: string;
  price: number;
}

export interface BookingData {
  expert: Expert;
  date: string; // Formatted date string or dayjs object
  time: string;
  sessionType: SessionType;
  userData: any;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingData | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState<string>();
  const [customerEmail, setCustomerEmail] = useState<string>();
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >('bca_va');
  const [expandedMethod, setExpandedMethod] = useState<string | null>(
    'virtual_account',
  );

  useEffect(() => {
    if (import.meta.env.VITE_MIDTRANS_CLIENT_KEY) {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute(
        'data-client-key',
        import.meta.env.VITE_MIDTRANS_CLIENT_KEY,
      );
      document.body.appendChild(script);
      (window as any).snap = (window as any).snap || {};
    }
  }, []);

  const { mutate: bookExpert } = useMutation({
    mutationFn: async () =>
      await network.post('/booking', {
        ...bookingData,
        totalAmount,
        createdBy: auth.getUserData() ?? {},
      }),
    onSuccess: (response) => {
      console.log(response);
      (window as any).snap.pay(response.data.paymentResult.token);
      setIsLoading(false);
    },
    onError: (err) => {
      console.log(err);
      setIsLoading(false);
    },
  });

  const initBookingForm = useCallback(() => {
    const userData = auth.getUserData();
    if (userData) {
      setTimeout(() => {
        setCustomerName(userData?.user_metadata?.name || '');
        setCustomerEmail(userData?.email || '');
        setCustomerWhatsapp(userData?.user_metadata?.phone || '');
      }, 1000);
    }
  }, []);

  useEffect(() => {
    initBookingForm();
  }, [initBookingForm]);

  if (!isOpen || !bookingData) return null;

  const { expert, date, time, sessionType } = bookingData;

  const platformFee = 5000;
  const ppn = (sessionType.price + platformFee) * 0.11;
  const totalAmount = sessionType.price + platformFee + ppn;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const toggleMethod = (method: string): void => {
    if (expandedMethod === method) {
      setExpandedMethod(null);
    } else {
      setExpandedMethod(method);
    }
  };

  const handlePayment = (): void => {
    setIsLoading(true);
    bookExpert();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Metode Bayar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Column: Form & Methods */}
          <div className="flex-1 p-6 lg:p-8 space-y-8">
            {/* 1. Data Pemesan */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                1. Data Pemesan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                    placeholder="Nama Lengkap"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1E315A] focus:ring-1 focus:ring-[#1E315A] outline-none transition-all"
                      placeholder="Nomor WhatsApp"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Metode Pembayaran */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                2. Metode Pembayaran
              </h3>
              <div className="space-y-3">
                {/* Midtrans */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleMethod('qris')}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">Midtrans</span>
                    {expandedMethod === 'qris' ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedMethod === 'qris' && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="qris_gopay"
                          checked={selectedPaymentMethod === 'qris_gopay'}
                          onChange={() =>
                            setSelectedPaymentMethod('qris_gopay')
                          }
                          className="w-5 h-5 text-[#1E315A] focus:ring-[#1E315A]"
                        />
                        <span className="text-gray-700">Midtrans</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Virtual Account */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hidden">
                  <button
                    onClick={() => toggleMethod('virtual_account')}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">
                      Virtual Account
                    </span>
                    {expandedMethod === 'virtual_account' ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedMethod === 'virtual_account' && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                      {[
                        { id: 'bca_va', label: 'BCA Virtual Account' },
                        { id: 'bni_va', label: 'BNI Virtual Account' },
                        { id: 'mandiri_va', label: 'Mandiri Virtual Account' },
                      ].map((va) => (
                        <label
                          key={va.id}
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 flex items-center gap-3">
                            {/* Placeholder for Logo */}
                            <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-500 font-bold">
                              {va.id.split('_')[0].toUpperCase()}
                            </div>
                            <span className="text-gray-700 font-medium">
                              {va.label}
                            </span>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={va.id}
                            checked={selectedPaymentMethod === va.id}
                            onChange={() => setSelectedPaymentMethod(va.id)}
                            className="w-5 h-5 text-[#1E315A] focus:ring-[#1E315A]"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* E-Wallet */}
                <div className="border border-gray-200 rounded-xl overflow-hidden hidden">
                  <button
                    onClick={() => toggleMethod('ewallet')}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">E-Wallet</span>
                    {expandedMethod === 'ewallet' ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedMethod === 'ewallet' && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gopay"
                          checked={selectedPaymentMethod === 'gopay'}
                          onChange={() => setSelectedPaymentMethod('gopay')}
                          className="w-5 h-5 text-[#1E315A] focus:ring-[#1E315A]"
                        />
                        <span className="text-gray-700">GoPay</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:w-[400px] bg-gray-50 p-6 lg:p-8 border-l border-gray-100 rounded-br-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Order
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    #KN-2025-881
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Pakar
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {expert.name}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Waktu
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {date}, {time} WIB
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Tipe Sesi
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {sessionType.label} ({sessionType.duration})
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rincian Biaya</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Sesi</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(sessionType.price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Platform</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(platformFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">PPN (11%)</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(ppn)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-2">
                    <span className="font-bold text-gray-900">TOTAL BAYAR</span>
                    <span className="font-bold text-xl text-red-600">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-red-600/20 transition-all"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Bayar Sekarang'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
