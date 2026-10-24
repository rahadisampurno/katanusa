import type React from 'react';
import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useWorkspace } from '../../context/WorkspaceContext';

// Ruang Saya (Ordinary User / Learner Components)
import { RuangSayaBeranda } from './RuangSaya/RuangSayaBeranda';
import { RuangSayaKonsultasi } from './RuangSaya/RuangSayaKonsultasi';
import { RuangSayaPembayaran } from './RuangSaya/RuangSayaPembayaran';
import { RuangSayaKoleksi } from './RuangSaya/RuangSayaKoleksi';
import { RuangSayaNotifikasi } from './RuangSaya/RuangSayaNotifikasi';
import { RuangSayaProfil } from './RuangSaya/RuangSayaProfil';

// Ruang Pakar (Verified Expert Components)
import { RuangPakarBeranda } from './RuangPakar/RuangPakarBeranda';
import { RuangPakarPermintaan } from './RuangPakar/RuangPakarPermintaan';
import { RuangPakarKalender } from './RuangPakar/RuangPakarKalender';
import { RuangPakarLayanan } from './RuangPakar/RuangPakarLayanan';
import { RuangPakarProfil } from './RuangPakar/RuangPakarProfil';
import { RuangPakarKeuangan } from './RuangPakar/RuangPakarKeuangan';
import { RuangPakarUlasan } from './RuangPakar/RuangPakarUlasan';
import { RuangPakarMateri } from './RuangPakar/RuangPakarMateri';
import { RuangPakarKeselamatan } from './RuangPakar/RuangPakarKeselamatan';
import { RuangPakarAnalitik } from './RuangPakar/RuangPakarAnalitik';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canAccessExpert } = useWorkspace();
  const path = location.pathname;
  const notice = searchParams.get('notice');

  const isExpertPath = path.startsWith('/dashboard/pakar');

  const mfaNoticeBanner = notice === 'expert-mfa-required' ? (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#fffbf2] border border-[#f5dfb8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-[#78350f]">Autentikasi Dua Faktor (MFA) Diperlukan</h4>
          <p className="text-xs text-[#92400e] leading-relaxed">
            Sebagai Pakar Budaya, Anda wajib mengaktifkan MFA (AAL2) untuk membuka fitur operasional di Ruang Pakar.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/profil?setup=mfa"
        className="kn-primary-cta shrink-0 px-4 py-2.5 rounded-xl bg-[#d71920] hover:bg-[#b81218] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
      >
        <span>Aktifkan MFA Sekarang</span>
        <ArrowRight className="h-4 w-4 text-white" />
      </Link>
    </div>
  ) : null;

  // Rute /dashboard/profil selalu menampilkan Pengaturan Akun, Keamanan MFA, dan Privasi UU PDP
  if (path === '/dashboard/profil') {
    return (
      <Sidebar title="Profil, Privasi & Keamanan">
        {mfaNoticeBanner}
        <RuangSayaProfil />
      </Sidebar>
    );
  }

  const effectiveWorkspace = isExpertPath && canAccessExpert ? 'expert' : 'user';

  let content = <RuangSayaBeranda />;
  let title = 'Beranda Saya';

  if (effectiveWorkspace === 'expert') {
    if (path === '/dashboard/pakar/permintaan') {
      content = <RuangPakarPermintaan />;
      title = 'Permintaan & Konsultasi Sesi';
    } else if (path === '/dashboard/pakar/kalender') {
      content = <RuangPakarKalender />;
      title = 'Kalender & Ketersediaan';
    } else if (path === '/dashboard/pakar/layanan') {
      content = <RuangPakarLayanan />;
      title = 'Layanan & Apresiasi Budaya';
    } else if (path === '/dashboard/pakar/profil') {
      content = <RuangPakarProfil />;
      title = 'Profil Publik & Verifikasi';
    } else if (path === '/dashboard/pakar/keuangan') {
      content = <RuangPakarKeuangan />;
      title = 'Keuangan & Buku Besar Apresiasi';
    } else if (path === '/dashboard/pakar/ulasan') {
      content = <RuangPakarUlasan />;
      title = 'Ulasan & Reputasi';
    } else if (path === '/dashboard/pakar/materi') {
      content = <RuangPakarMateri />;
      title = 'Materi & Persona AI';
    } else if (path === '/dashboard/pakar/analitik') {
      content = <RuangPakarAnalitik />;
      title = 'Analitik Praktik & Wawasan';
    } else if (path === '/dashboard/pakar/keselamatan') {
      content = <RuangPakarKeselamatan />;
      title = 'Keselamatan & Bantuan Adat';
    } else {
      content = <RuangPakarBeranda />;
      title = 'Beranda Praktik Pakar';
    }
  } else {
    // Ruang Saya
    if (path === '/dashboard/konsultasi') {
      content = <RuangSayaKonsultasi />;
      title = 'Konsultasi Saya';
    } else if (path === '/dashboard/pembayaran') {
      content = <RuangSayaPembayaran />;
      title = 'Pembayaran & Dokumen';
    } else if (path === '/dashboard/koleksi') {
      content = <RuangSayaKoleksi />;
      title = 'Jelajah & Koleksi Budaya';
    } else if (path === '/dashboard/notifikasi') {
      content = <RuangSayaNotifikasi />;
      title = 'Pusat Notifikasi';
    } else {
      content = <RuangSayaBeranda />;
      title = 'Beranda Saya';
    }
  }

  return (
    <Sidebar title={title}>
      {mfaNoticeBanner}
      {content}
    </Sidebar>
  );
};

export default Dashboard;
