import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import { getApiErrorMessage } from '../../../libs/apiError';
import network from '../../../libs/network';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface ApplicationItem {
  id: string;
  user_id: string;
  stage: number;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  public_name: string | null;
  title: string | null;
  community: string | null;
  applicant_name: string;
  applicant_email: string;
  active_assignment: {
    id: string;
    reviewer_id: string;
    reviewer_name: string;
    expires_at: string;
    status: string;
  } | null;
}

interface ReviewerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  capabilities: string[];
  active_assignments_count: string;
}

export const AdminExpertApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Reviewers list for assignment modal
  const [reviewers, setReviewers] = useState<ReviewerItem[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);

  // Assignment Modal state
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.append('search', appliedSearch);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (stageFilter && stageFilter !== 'all') params.append('stage', stageFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await network.get<{
        items: ApplicationItem[];
        pagination: { page: number; limit: number; total_items: number; total_pages: number };
      }>(`/admin/expert-applications?${params.toString()}`);

      setApplications(res.data.items || []);
      setTotalPages(res.data.pagination.total_pages || 1);
      setTotalItems(res.data.pagination.total_items || 0);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Gagal memuat daftar pengajuan pakar.'));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, stageFilter, statusFilter]);

  const fetchReviewers = async () => {
    setLoadingReviewers(true);
    try {
      const res = await network.get<{ reviewers: ReviewerItem[] }>('/admin/reviewers');
      setReviewers(res.data.reviewers || []);
    } catch {
      // ignore
    } finally {
      setLoadingReviewers(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    fetchReviewers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleOpenAssignModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    setSelectedReviewerId('');
    setAssignError(null);
    setAssignSuccess(null);
  };

  const handleAssignReviewer = async () => {
    if (!selectedApp || !selectedReviewerId) {
      setAssignError('Pilih reviewer terlebih dahulu.');
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await network.post(`/admin/expert-applications/${selectedApp.id}/assignments`, {
        reviewerId: selectedReviewerId,
      });
      setAssignSuccess('Reviewer berhasil ditugaskan.');
      setTimeout(() => {
        setSelectedApp(null);
        fetchApplications();
      }, 1200);
    } catch (err: unknown) {
      setAssignError(getApiErrorMessage(err, 'Gagal menugaskan reviewer.'));
    } finally {
      setAssigning(false);
    }
  };

  const handleExtendAssignment = async (appId: string, assignmentId: string) => {
    try {
      await network.patch(`/admin/expert-applications/${appId}/assignments/${assignmentId}`, {
        action: 'extend',
      });
      setActionNotice('Batas waktu penugasan berhasil diperpanjang 48 jam.');
      fetchApplications();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Gagal memperpanjang penugasan.'));
    }
  };

  const handleCancelAssignment = async (appId: string, assignmentId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan/melepas penugasan reviewer ini?')) return;
    try {
      await network.patch(`/admin/expert-applications/${appId}/assignments/${assignmentId}`, {
        action: 'cancel',
      });
      setActionNotice('Penugasan berhasil dilepas.');
      fetchApplications();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Gagal membatalkan penugasan.'));
    }
  };

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case 1:
        return 'Tahap 1: Kelayakan & Dokumen';
      case 2:
        return 'Tahap 2: Pembuktian Identitas';
      case 3:
        return 'Tahap 3: Kredensial & Portofolio';
      case 4:
        return 'Tahap 4: Otoritas Adat & Mandat';
      case 5:
        return 'Tahap 5: Wawancara & Referensi';
      case 6:
        return 'Tahap 6: Keputusan Akhir Adat';
      default:
        return `Tahap ${stage}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            <span>Dalam Kurasi</span>
          </span>
        );
      case 'approved_pending_activation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="h-3 w-3" />
            <span>Menunggu Aktivasi</span>
          </span>
        );
      case 'activated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Aktif Terverifikasi</span>
          </span>
        );
      case 'revision_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="h-3 w-3" />
            <span>Revisi Diperlukan</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-3 w-3" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
            {status}
          </span>
        );
    }
  };

  return (
    <Sidebar title="Pengajuan Calon Pakar">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Pengajuan Calon Pakar Budaya</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Pantau siklus kurasi 6 tahap, delegasikan penugasan reviewer, dan cegah pelanggaran SLA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(1);
                fetchApplications();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebdccc] hover:bg-[#fffbf7] text-xs font-bold text-[#2e2620] shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#ebdccc] shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau nama publik..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                >
                  <option value="all">Semua Status</option>
                  <option value="submitted">Dalam Kurasi (Submitted)</option>
                  <option value="approved_pending_activation">Menunggu Aktivasi</option>
                  <option value="activated">Aktif Terverifikasi</option>
                  <option value="revision_required">Revisi Diperlukan</option>
                  <option value="rejected">Ditolak</option>
                  <option value="withdrawn">Ditarik Mandiri</option>
                </select>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <span className="font-medium">Tahap:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                >
                  <option value="all">Semua Tahap (1-6)</option>
                  <option value="1">Tahap 1: Kelayakan</option>
                  <option value="2">Tahap 2: Identitas</option>
                  <option value="3">Tahap 3: Kredensial</option>
                  <option value="4">Tahap 4: Otoritas Adat</option>
                  <option value="5">Tahap 5: Wawancara</option>
                  <option value="6">Tahap 6: Keputusan Akhir</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat data pengajuan pakar...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <Users className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada pengajuan ditemukan.</p>
              <p className="text-neutral-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Kandidat</th>
                    <th className="py-3.5 px-4">Nama Publik & Gelar</th>
                    <th className="py-3.5 px-4">Komunitas</th>
                    <th className="py-3.5 px-4">Tahap</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Penugasan Reviewer</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#fffbf7]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620]">{app.applicant_name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">{app.applicant_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#2e2620]">
                          {app.public_name || app.applicant_name}
                        </div>
                        {app.title && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
                            {app.title}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {app.community || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-neutral-800">
                          {getStageLabel(app.stage)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        {app.active_assignment ? (
                          <div className="space-y-1">
                            <div className="font-bold text-[#2e2620] flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{app.active_assignment.reviewer_name}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-neutral-400" />
                              <span>Batas: {dayjs(app.active_assignment.expires_at).format('DD MMM, HH:mm')}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">
                            Belum ditugaskan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(app)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#d71920] hover:text-white text-neutral-700 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>{app.active_assignment ? 'Alihkan' : 'Tugaskan'}</span>
                          </button>

                          {app.active_assignment && (
                            <>
                              <button
                                type="button"
                                title="Perpanjang batas waktu 48 jam"
                                onClick={() =>
                                  handleExtendAssignment(app.id, app.active_assignment!.id)
                                }
                                className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all"
                              >
                                +48 Jam
                              </button>
                              <button
                                type="button"
                                title="Batalkan penugasan saat ini"
                                onClick={() =>
                                  handleCancelAssignment(app.id, app.active_assignment!.id)
                                }
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
                              >
                                Lepas
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-[#fffaf5] border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <div>
              Menampilkan {applications.length} dari total{' '}
              <span className="font-bold text-[#2e2620]">{totalItems}</span> pengajuan
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold px-2">
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-red-50 text-[#d71920] flex items-center justify-center font-bold">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2e2620]">Tugaskan Reviewer</h3>
                    <p className="text-xs text-neutral-500">
                      Tahap {selectedApp.stage}: {getStageLabel(selectedApp.stage)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#fffbf7] border border-[#f5dfb8] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Kandidat:</span>
                    <span className="font-bold text-[#2e2620]">
                      {selectedApp.applicant_name} ({selectedApp.public_name || '-'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Kapabilitas Wajib:</span>
                    <span className="font-bold text-[#d71920]">
                      {selectedApp.stage <= 3 ? 'credential_reviewer' : 'cultural_reviewer'}
                    </span>
                  </div>
                  {selectedApp.active_assignment && (
                    <div className="flex justify-between pt-1 border-t border-[#ebdccc]">
                      <span className="text-neutral-500">Penugasan Aktif:</span>
                      <span className="text-neutral-700">
                        {selectedApp.active_assignment.reviewer_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Pilih Reviewer Terotorisasi
                  </label>
                  {loadingReviewers ? (
                    <div className="py-4 text-center text-xs text-neutral-500">
                      Memuat daftar staf reviewer...
                    </div>
                  ) : (
                    <select
                      value={selectedReviewerId}
                      onChange={(e) => setSelectedReviewerId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                    >
                      <option value="">-- Pilih Staf Reviewer --</option>
                      {reviewers
                        .filter((r) => r.id !== selectedApp.user_id)
                        .map((rev) => {
                          const requiredCap =
                            selectedApp.stage <= 3 ? 'credential_reviewer' : 'cultural_reviewer';
                          const isEligible = rev.capabilities?.includes(requiredCap);
                          return (
                            <option
                              key={rev.id}
                              value={rev.id}
                              disabled={!isEligible}
                            >
                              {rev.name} ({rev.email}) - {rev.capabilities?.join(', ')} - Beban:{' '}
                              {rev.active_assignments_count} aktif {!isEligible ? '(Tidak Memenuhi Syarat)' : ''}
                            </option>
                          );
                        })}
                    </select>
                  )}
                  <p className="text-[11px] text-neutral-500">
                    Sistem secara otomatis memblokir penugasan yang menimbulkan konflik kepentingan
                    atau tidak memiliki kapabilitas yang sesuai.
                  </p>
                </div>

                {assignError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{assignError}</span>
                  </div>
                )}

                {assignSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{assignSuccess}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 text-xs font-bold hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAssignReviewer}
                  disabled={assigning || !selectedReviewerId}
                  className="px-5 py-2.5 rounded-xl bg-[#d71920] hover:bg-[#b81218] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {assigning ? 'Menugaskan...' : 'Tetapkan Penugasan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminExpertApplications;
