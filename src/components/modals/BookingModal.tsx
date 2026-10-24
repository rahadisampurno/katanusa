import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { cn } from '../../libs/utils';
import Button from '../ui/Button';

// Set locale to Indonesian
dayjs.locale('id');

interface Expert {
  id: string;
  name: string;
  role: string;
  image: string;
  services?: Array<{
    id: string;
    serviceKey: string;
    label: string;
    duration: string;
    durationMinutes: number;
    price: number;
  }>;
  availability?: Array<{ weekday: number; startsAt: string; endsAt: string }>;
  bookingPolicy?: { bookingNoticeHours: number; bookingHorizonDays: number };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onProceed: (data: {
    date: string;
    time: string;
    sessionType: {
      id: string;
      label: string;
      duration: string;
      price: number;
    };
  }) => void;
}

const SESSION_TYPES = [
  {
    id: 'santai',
    label: 'Sesi Diskusi Santai',
    duration: '30 Menit',
    price: 100000,
  },
  {
    id: 'pendalaman',
    label: 'Sesi Pendalaman Materi',
    duration: '60 Menit',
    price: 180000,
  },
  {
    id: 'workshop',
    label: 'Workshop Privat',
    duration: '90 Menit + Materi PDF',
    price: 300000,
  },
];

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  expert,
  onProceed,
}) => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState<
    string | null
  >(expert.services?.[0]?.serviceKey ?? SESSION_TYPES[0].id);

  if (!isOpen) return null;

  const sessionTypes = expert.services?.length
    ? expert.services.map((service) => ({ ...service, id: service.serviceKey }))
    : SESSION_TYPES;
  const selectedSession = sessionTypes.find((s) => s.id === selectedSessionTypeId);

  const availableSlots = (() => {
    if (!selectedDate || !selectedSession || !expert.availability?.length) return [];
    const ranges = expert.availability.filter((entry) => entry.weekday === selectedDate.day());
    const slots: string[] = [];
    const durationMinutes = 'durationMinutes' in selectedSession
      ? Number(selectedSession.durationMinutes)
      : Number.parseInt(selectedSession.duration, 10) || 30;
    const noticeHours = expert.bookingPolicy?.bookingNoticeHours ?? 24;
    const earliest = dayjs().add(noticeHours, 'hour');
    for (const range of ranges) {
      const [startHour, startMinute] = range.startsAt.slice(0, 5).split(':').map(Number);
      const [endHour, endMinute] = range.endsAt.slice(0, 5).split(':').map(Number);
      let cursor = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      while (cursor + durationMinutes <= end) {
        const hour = String(Math.floor(cursor / 60)).padStart(2, '0');
        const minute = String(cursor % 60).padStart(2, '0');
        const candidate = selectedDate.hour(Math.floor(cursor / 60)).minute(cursor % 60).second(0);
        if (!candidate.isBefore(earliest)) slots.push(`${hour}:${minute}`);
        cursor += 30;
      }
    }
    return slots;
  })();

  // Calendar Logic
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = endOfMonth.date();
  const startDay = startOfMonth.day(); // 0 (Sunday) to 6 (Saturday)

  const generateCalendarDays = (): (dayjs.Dayjs | null)[] => {
    const days: (dayjs.Dayjs | null)[] = [];
    // Add empty slots for days before the start of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(currentDate.date(i));
    }
    return days;
  };

  const handlePrevMonth = (): void => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = (): void => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleProceed = (): void => {
    if (selectedDate && selectedTime && selectedSession) {
      onProceed({
        date: selectedDate.format('YYYY-MM-DD'),
        time: selectedTime,
        sessionType: selectedSession,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Pilih Waktu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Column: Selection */}
          <div className="flex-1 p-6 lg:p-8 space-y-8">
            {/* 1. Pilih Tanggal */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                1. Pilih Tanggal
              </h3>
              <div className="border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 font-medium text-lg">
                    <span>{currentDate.format('MMMM')}</span>
                    <span>{currentDate.format('YYYY')}</span>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-sm text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendarDays().map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} />;
                    const isSelected =
                      selectedDate && date.isSame(selectedDate, 'day');
                    const policy = expert.bookingPolicy ?? { bookingNoticeHours: 24, bookingHorizonDays: 90 };
                    const earliest = dayjs().add(policy.bookingNoticeHours, 'hour');
                    const latest = dayjs().add(policy.bookingHorizonDays, 'day');
                    const hasAvailability = expert.availability?.some((entry) => entry.weekday === date.day()) ?? true;
                    const disabled = date.endOf('day').isBefore(earliest) || date.startOf('day').isAfter(latest) || !hasAvailability;
                    return (
                      <button
                        key={date.toString()}
                        disabled={disabled}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all mx-auto',
                          disabled && 'cursor-not-allowed opacity-30',
                          isSelected
                            ? 'bg-[#1E315A] text-white font-bold shadow-md'
                            : 'hover:bg-gray-100 text-gray-700',
                        )}
                      >
                        {date.date()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 2. Pilih Jam */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                2. Pilih Jam Tersedia
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'px-6 py-3 rounded-xl border transition-all font-medium',
                      selectedTime === time
                        ? 'bg-[#1E315A] text-white border-[#1E315A] shadow-md'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {time}
                  </button>
                ))}
                {selectedDate && availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada slot yang cocok untuk layanan ini pada tanggal tersebut.</p>
                ) : null}
              </div>
            </section>

            {/* 3. Pilih Tipe Sesi */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                3. Pilih Tipe Sesi
              </h3>
              <div className="space-y-4">
                {sessionTypes.map((session) => (
                  <label
                    key={session.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="relative flex items-center mt-1">
                      <input
                        type="radio"
                        name="sessionType"
                        value={session.id}
                        checked={selectedSessionTypeId === session.id}
                        onChange={() => {
                          setSelectedSessionTypeId(session.id);
                          setSelectedTime(null);
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-[#1E315A] peer-checked:border-[6px] transition-all" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {session.label}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm">
                          {session.duration}
                        </span>
                      </div>
                      <div className="text-green-600 font-bold mt-1">
                        {formatPrice(session.price)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:w-[400px] bg-gray-50 p-6 lg:p-8 border-l border-gray-100 rounded-br-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {expert.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">
                    {expert.role}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Tanggal
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {selectedDate ? selectedDate.format('D MMMM YYYY') : '-'}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Jam
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {selectedTime || '-'}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Tipe Sesi
                  </label>
                  <div className="font-bold text-lg text-gray-900">
                    {selectedSession?.label || '-'}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <label className="text-sm text-gray-500 block mb-1">
                    Total Estimasi
                  </label>
                  <div className="font-bold text-2xl text-gray-900">
                    {selectedSession
                      ? formatPrice(selectedSession.price)
                      : 'Rp 0'}
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-red-600/20 transition-all"
              onClick={handleProceed}
              disabled={!selectedDate || !selectedTime}
            >
              Lanjut Ke Pembayaran
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
