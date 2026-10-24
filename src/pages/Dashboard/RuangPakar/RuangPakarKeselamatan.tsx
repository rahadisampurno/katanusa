import {
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  LifeBuoy,
  PhoneCall,
  Send,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import Button from '../../../components/ui/Button';

export const RuangPakarKeselamatan: React.FC = () => {
  const [reportType, setReportType] = useState('hak_cipta');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
          Keselamatan Praktik & Bantuan Adat
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Pusat bantuan etika, pelaporan pelanggaran hak cipta tradisi, dan perlindungan integritas pakar.
        </p>
      </div>

      {submitted && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Laporan keselamatan Anda telah diterima. Tim Advokasi Adat KataNusa akan segera menindaklanjuti.</span>
        </div>
      )}

      {/* Pedoman Etika Budaya */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <FileCheck className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Piagam Etika Penjaga Tradisi Nusantara
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Sebagai Pakar Budaya KataNusa yang terverifikasi, Anda berhak dan berkewajiban:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300 pl-1">
            <li>Menyampaikan pengetahuan adat dengan jujur, berdasar silsilah atau rekam jejak yang dapat dipertanggungjawabkan.</li>
            <li>Melindungi pengetahuan sakral/rahasia adat yang dilarang dibuka untuk umum sesuai adat masyarakat setempat.</li>
            <li>Menolak segala bentuk pelecehan, pemaksaan, atau perlakuan tidak pantas saat sesi konsultasi berlangsung.</li>
            <li>Mendapatkan perlindungan hak cipta dan kekayaan intelektual komunal atas materi yang Anda bagikan.</li>
          </ul>
        </div>
      </div>

      {/* Form Pelaporan Insiden */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Laporkan Insiden Sesi atau Pelanggaran Materi
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Jenis Insiden / Pelanggaran:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-[#0F1B38] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-400"
            >
              <option value="hak_cipta">Penyalahgunaan Hak Cipta / Materi Pustaka Adat</option>
              <option value="perilaku">Perilaku Tidak Pantas dari Murid/Peserta Sesi</option>
              <option value="misquotation">Kutipan Keliru oleh Sistem AI Budaya</option>
              <option value="teknis">Kendala Teknis atau Ruang Pertemuan</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Rincian Insiden:</label>
            <textarea
              rows={4}
              required
              placeholder="Jelaskan secara rinci waktu kejadian, pihak terkait, dan bentuk kendala yang dialami..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F1B38] border border-white/10 rounded-xl p-3.5 text-xs text-white leading-relaxed focus:outline-hidden focus:border-amber-400 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Laporan Resmi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
