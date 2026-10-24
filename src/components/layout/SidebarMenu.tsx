import {
  Bell,
  BookOpen,
  Calendar,
  Compass,
  FileText,
  FolderHeart,
  LayoutDashboard,
  LifeBuoy,
  BarChart3,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wallet,
} from 'lucide-react';
import type React from 'react';
import { Link, useLocation } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext';
import { cn } from '../../libs/utils';

interface SidebarMenuProps {
  isCollapsed: boolean;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const activePath = location.pathname;
  const { workspace } = useWorkspace();
  const currentWorkspace = activePath.startsWith('/admin')
    ? 'admin'
    : activePath.startsWith('/dashboard/pakar')
    ? 'expert'
    : activePath.startsWith('/reviewer') || activePath === '/dashboard/reviews'
    ? 'reviewer'
    : workspace;

  // Menu untuk Ruang Saya (Ordinary User / Learner Workspace)
  const userMenuItems = [
    { name: 'Beranda Saya', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Konsultasi Saya', icon: Calendar, path: '/dashboard/konsultasi' },
    { name: 'Pembayaran & Dokumen', icon: Receipt, path: '/dashboard/pembayaran' },
    { name: 'Jelajah & Koleksi', icon: FolderHeart, path: '/dashboard/koleksi' },
    { name: 'Pusat Notifikasi', icon: Bell, path: '/dashboard/notifikasi' },
    { name: 'Profil & Privasi', icon: User, path: '/dashboard/profil' },
  ];

  // Menu untuk Ruang Pakar (Verified Expert Workspace)
  const expertMenuItems = [
    { name: 'Beranda Pakar', icon: LayoutDashboard, path: '/dashboard/pakar' },
    { name: 'Permintaan & Konsultasi', icon: Calendar, path: '/dashboard/pakar/permintaan' },
    { name: 'Kalender & Ketersediaan', icon: BookOpen, path: '/dashboard/pakar/kalender' },
    { name: 'Layanan & Apresiasi', icon: Wallet, path: '/dashboard/pakar/layanan' },
    { name: 'Profil Publik & Verifikasi', icon: ShieldCheck, path: '/dashboard/pakar/profil' },
    { name: 'Keuangan & Ledger', icon: Receipt, path: '/dashboard/pakar/keuangan' },
    { name: 'Ulasan & Reputasi', icon: Star, path: '/dashboard/pakar/ulasan' },
    { name: 'Materi & Persona AI', icon: Sparkles, path: '/dashboard/pakar/materi' },
    { name: 'Analitik Praktik', icon: BarChart3, path: '/dashboard/pakar/analitik' },
    { name: 'Keselamatan & Bantuan', icon: LifeBuoy, path: '/dashboard/pakar/keselamatan' },
  ];

  // Menu untuk Ruang Kurasi (Reviewer Workspace)
  const reviewerMenuItems = [
    { name: 'Antrean Kurasi Calon Pakar', icon: ShieldCheck, path: '/dashboard/reviews' },
    { name: 'Kurasi Pengetahuan RAG', icon: Sparkles, path: '/reviewer/knowledge' },
    { name: 'Katalog Budaya', icon: Compass, path: '/experts' },
  ];

  // Menu untuk Ruang Super Admin (Platform Governance)
  const adminMenuItems = [
    { name: 'Pusat Kendali (Overview)', icon: LayoutDashboard, path: '/admin' },
    { name: 'Pengajuan Calon Pakar', icon: FileText, path: '/admin/applications' },
    { name: 'Pakar Terverifikasi', icon: ShieldCheck, path: '/admin/experts' },
    { name: 'Staf Reviewer & Penugasan', icon: User, path: '/admin/reviewers' },
    { name: 'Tata Kelola Pengetahuan', icon: BookOpen, path: '/admin/knowledge' },
    { name: 'AI Persona', icon: Sparkles, path: '/admin/personas' },
    { name: 'Jejak Audit & Keamanan', icon: ShieldAlert, path: '/admin/audit' },
  ];

  let currentItems = userMenuItems;
  if (currentWorkspace === 'admin') {
    currentItems = adminMenuItems;
  } else if (currentWorkspace === 'expert') {
    currentItems = expertMenuItems;
  } else if (currentWorkspace === 'reviewer') {
    currentItems = reviewerMenuItems;
  }

  return (
    <div className="kn-menu">
      <nav aria-label="Navigasi dashboard">
        <ul className="kn-menu__list">
          {currentItems.map((item) => {
            const exactOnlyPaths = ['/dashboard', '/dashboard/pakar', '/admin'];
            const isActive = exactOnlyPaths.includes(item.path)
              ? activePath === item.path
              : activePath === item.path || activePath.startsWith(`${item.path}/`);

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'kn-menu__link group',
                    isActive && 'is-active',
                  )}
                >
                  <item.icon
                    className="kn-menu__icon"
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tautan pintasan ke Katalog Budaya Publik */}
      {workspace !== 'reviewer' && (
        <div className="kn-menu__public">
          <Link
            to="/experts"
            title={isCollapsed ? 'Katalog Budaya' : undefined}
            className="kn-menu__link"
          >
            <Compass className="kn-menu__icon" />
            {!isCollapsed && <span>Katalog Budaya</span>}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SidebarMenu;
