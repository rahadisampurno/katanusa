import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  CalendarDays,
  ChevronLeft,
  GraduationCap,
  LogOutIcon,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext';
import auth from '../../libs/auth';
import network from '../../libs/network';
import { cn } from '../../libs/utils';
import { MandalaKawungIcon, PerisaiTalawangIcon, SuryaMajapahitIcon } from '../icons/NusantaraIcons';
// @ts-expect-error - SVG import
import LogoKataNusa from '../svgs/logo-katanusa.svg?react';
import SidebarMenu from './SidebarMenu';
import './dashboard.css';

dayjs.locale('id');

export interface SidebarProps {
  title: string;
}

const Sidebar: React.FC<PropsWithChildren<SidebarProps>> = ({
  children,
  title,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { workspace, setWorkspace, canAccessExpert, canAccessReviewer, canAccessAdmin } =
    useWorkspace();
  const user = auth.getUserData();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsMobileOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileOpen]);

  useEffect(() => {
    document.title = `${title} · KataNusa`;
  }, [title]);

  // Sinkronkan active workspace dengan rute yang sedang aktif secara deterministik
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      if (canAccessAdmin && workspace !== 'admin') {
        setWorkspace('admin');
      }
    } else if (path.startsWith('/dashboard/pakar')) {
      if (canAccessExpert && workspace !== 'expert') {
        setWorkspace('expert');
      }
    } else if (path.startsWith('/dashboard/reviews') || path.startsWith('/reviewer') || path === '/dashboard/transaction') {
      if (canAccessReviewer && workspace !== 'reviewer') {
        setWorkspace('reviewer');
      }
    } else if (
      path === '/dashboard' ||
      path.startsWith('/dashboard/konsultasi') ||
      path.startsWith('/dashboard/pembayaran') ||
      path.startsWith('/dashboard/koleksi') ||
      path.startsWith('/dashboard/notifikasi') ||
      path.startsWith('/dashboard/profil')
    ) {
      if (workspace !== 'user') {
        setWorkspace('user');
      }
    }
  }, [location.pathname, canAccessAdmin, canAccessExpert, canAccessReviewer, workspace, setWorkspace]);

  const { data: dashboardData } = useQuery<{
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url?: string | null;
    };
  }>({
    queryKey: ['me-dashboard'],
    queryFn: async () => {
      const response = await network.get('/me/dashboard');
      return response.data;
    },
  });

  const { data: expertProfileData } = useQuery<{
    profile: { image_url?: string; public_name?: string };
    draft?: { data?: { imageUrl?: string; image_url?: string } } | null;
  }>({
    queryKey: ['expert-profile-details'],
    queryFn: async () => {
      const response = await network.get('/expert/profile');
      return response.data;
    },
    enabled: canAccessExpert,
  });

  const displayName =
    workspace === 'expert' && expertProfileData?.profile?.public_name
      ? expertProfileData.profile.public_name
      : dashboardData?.user?.name || user?.name || 'Pelajar Budaya';

  const avatarPhoto =
    workspace === 'expert'
      ? expertProfileData?.draft?.data?.imageUrl ||
        expertProfileData?.draft?.data?.image_url ||
        expertProfileData?.profile?.image_url ||
        dashboardData?.user?.avatar_url
      : dashboardData?.user?.avatar_url ||
        (canAccessExpert
          ? expertProfileData?.draft?.data?.imageUrl ||
            expertProfileData?.draft?.data?.image_url ||
            expertProfileData?.profile?.image_url
          : null);

  const [avatarError, setAvatarError] = useState(false);
  useEffect(() => {
    setAvatarError(false);
  }, [avatarPhoto]);

  const currentDate = dayjs().format('dddd, DD MMMM YYYY');
  const effectiveWorkspace: 'user' | 'expert' | 'reviewer' | 'admin' | 'security' =
    location.pathname.startsWith('/admin')
      ? 'admin'
      : location.pathname.startsWith('/dashboard/pakar')
      ? 'expert'
      : location.pathname.startsWith('/reviewer') || location.pathname === '/dashboard/reviews'
      ? 'reviewer'
      : workspace;

  const workspaceName =
    effectiveWorkspace === 'admin'
      ? 'Super Admin'
      : effectiveWorkspace === 'security'
      ? 'Keamanan Platform'
      : effectiveWorkspace === 'expert'
      ? 'Ruang Pakar'
      : effectiveWorkspace === 'reviewer'
      ? 'Ruang Kurasi'
      : 'Ruang Saya';

  const switchWorkspace = (
    nextWorkspace: 'user' | 'expert' | 'reviewer' | 'admin',
    destination: string,
  ) => {
    setWorkspace(nextWorkspace);
    navigate(destination);
  };

  return (
    <div className="kn-dashboard">
      <button
        type="button"
        className={cn('kn-sidebar-overlay', isMobileOpen && 'is-visible')}
        onClick={() => setIsMobileOpen(false)}
        aria-label="Tutup navigasi"
        tabIndex={isMobileOpen ? 0 : -1}
      />

      <aside
        className={cn(
          'kn-sidebar',
          isCollapsed && 'is-collapsed',
          isMobileOpen && 'is-mobile-open',
        )}
      >
        <div className="kn-sidebar__scenery" aria-hidden="true">
          <span className="kn-sidebar__ribbon kn-sidebar__ribbon--red" />
          <span className="kn-sidebar__ribbon kn-sidebar__ribbon--green" />
        </div>

        <div className="kn-sidebar__header">
          <Link
            to="/"
            className="kn-sidebar__brand"
            aria-label="Kembali ke beranda KataNusa"
          >
            {isCollapsed ? (
              <span className="kn-sidebar__monogram">K</span>
            ) : (
              <LogoKataNusa className="kn-sidebar__logo" />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="kn-sidebar__collapse"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform duration-200', isCollapsed && 'rotate-180')}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Tutup menu"
            className="kn-sidebar__mobile-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isCollapsed ? (
          <div className="kn-sidebar__workspace">
            <span className="kn-sidebar__section-label">Ruang aktif</span>

            {canAccessAdmin || canAccessExpert || canAccessReviewer ? (
              <div className="kn-workspace-switcher">
                <button
                  type="button"
                  onClick={() => switchWorkspace('user', '/dashboard')}
                  className={cn(
                    'kn-workspace-option',
                    effectiveWorkspace === 'user' && 'is-active',
                  )}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Ruang Saya</span>
                </button>

                {canAccessExpert ? (
                  <button
                    type="button"
                    onClick={() =>
                      switchWorkspace('expert', '/dashboard/pakar')
                    }
                    className={cn(
                      'kn-workspace-option',
                      effectiveWorkspace === 'expert' && 'is-active',
                    )}
                  >
                    <SuryaMajapahitIcon className="h-4 w-4" />
                    <span>Ruang Pakar</span>
                  </button>
                ) : null}

                {canAccessReviewer ? (
                  <button
                    type="button"
                    onClick={() =>
                      switchWorkspace('reviewer', '/dashboard/reviews')
                    }
                    className={cn(
                      'kn-workspace-option',
                      effectiveWorkspace === 'reviewer' && 'is-active',
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Ruang Kurasi</span>
                  </button>
                ) : null}

                {canAccessAdmin ? (
                  <button
                    type="button"
                    onClick={() =>
                      switchWorkspace('admin', '/admin')
                    }
                    className={cn(
                      'kn-workspace-option',
                      effectiveWorkspace === 'admin' && 'is-active',
                    )}
                  >
                    <PerisaiTalawangIcon className="h-4 w-4" />
                    <span>Super Admin</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="kn-workspace-badge">
                <MandalaKawungIcon className="h-4 w-4" />
                <span>Ruang Belajar Saya</span>
              </div>
            )}
          </div>
        ) : null}

        <div className="kn-sidebar__nav">
          <SidebarMenu isCollapsed={isCollapsed} />
        </div>

        <div className="kn-sidebar__footer">
          {!isCollapsed ? (
            <>
              <div className="kn-user-card">
                {avatarPhoto && !avatarError ? (
                  <img
                    src={avatarPhoto}
                    alt=""
                    className="kn-user-card__avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="kn-user-card__avatar kn-user-card__initial">
                    {displayName.charAt(0) || 'P'}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <strong>{displayName}</strong>
                  <span
                    className={cn(
                      'text-[11px] font-bold tracking-tight',
                      (effectiveWorkspace === 'admin' || effectiveWorkspace === 'security') && 'text-[#b91c1c]',
                      effectiveWorkspace === 'expert' && 'text-[#b45309]',
                      effectiveWorkspace === 'reviewer' && 'text-[#1d4ed8]',
                      effectiveWorkspace === 'user' && 'text-[#15803d]',
                    )}
                  >
                    {effectiveWorkspace === 'admin'
                      ? 'Super Admin Platform'
                      : effectiveWorkspace === 'security'
                        ? 'Admin Keamanan'
                        : effectiveWorkspace === 'expert'
                          ? 'Pakar Terverifikasi'
                          : effectiveWorkspace === 'reviewer'
                            ? 'Kurator Adat Resmi'
                            : 'Sahabat Budaya'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  auth.logout();
                  navigate('/auth/login');
                }}
                className="kn-logout-button"
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Keluar akun</span>
              </button>
            </>
          ) : (
            <>
              {avatarPhoto && !avatarError ? (
                <img
                  src={avatarPhoto}
                  alt={displayName}
                  title={displayName}
                  className="kn-user-card__avatar"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span
                  className="kn-user-card__avatar kn-user-card__initial"
                  title={displayName}
                >
                  {displayName.charAt(0) || 'P'}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  auth.logout();
                  navigate('/auth/login');
                }}
                className="kn-logout-button kn-logout-button--icon"
                title="Keluar akun"
                aria-label="Keluar akun"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      <main className={cn('kn-dashboard-main', isCollapsed && 'is-expanded')}>
        <header className="kn-dashboard-topbar">
          <button
            type="button"
            className="kn-mobile-menu"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Buka navigasi"
            aria-expanded={isMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="kn-breadcrumb">
            <span>{workspaceName}</span>
            <i aria-hidden="true">/</i>
            <strong>{title}</strong>
          </div>

          <div className="kn-topbar-actions">
            <div className="kn-date-chip">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span>{currentDate}</span>
            </div>
            <Link to="/experts" className="kn-catalog-link">
              Katalog budaya
            </Link>
          </div>
        </header>

        <div className="kn-dashboard-sky" aria-hidden="true">
          <span className="kn-dashboard-sky__cloud" />
          <span className="kn-dashboard-sky__ribbon kn-dashboard-sky__ribbon--red" />
          <span className="kn-dashboard-sky__ribbon kn-dashboard-sky__ribbon--green" />
        </div>

        <div className="kn-dashboard-content">{children}</div>
      </main>
    </div>
  );
};

export default Sidebar;
