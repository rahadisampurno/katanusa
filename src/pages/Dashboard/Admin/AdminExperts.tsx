import type React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface ExpertProfileItem {
  id: string;
  user_id: string;
  slug: string;
  public_name: string;
  title: string | null;
  community: string | null;
  region: string | null;
  domains: any;
  status: string;
  is_published: boolean;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  rag_consent_active: boolean;
}

export const AdminExperts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [experts, setExperts] = useState<ExpertProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Lifecycle Action Modal state
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfileItem | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'reinstate' | 'revoke' | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchExperts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await network.get<{
        items: ExpertProfileItem[];
        pagination: { page: number; limit: number; total_items: number; total_pages: number };
      }>(`/admin/experts?${params.toString()}`);

      setExperts(res.data.items || []);
      setTotalPages(res.data.pagination.total_pages || 1);
      setTotalItems(res.data.pagination.total_items || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat direktori pakar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExperts();
  };

  const openActionModal = (
    expert: ExpertProfileItem,
    type: 'suspend' | 'reinstate' | 'revoke'
  ) => {
    setSelectedExpert(expert);
    setActionType(type);
    setReason('');
    setActionError(null);
  };

  const handleExecuteLifecycleAction = async () => {
    if (!selectedExpert || !actionType) return;
    if (reason.trim().length < 10) {
      setActionError('Alasan tindakan operasional wajib diisi minimal 10 karakter.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await network.post(`/admin/experts/${selectedExpert.id}/${actionType}`, {
        reason: reason.trim(),
      });

      const messageMap = {
        suspend: 'Akses operasional pakar berhasil disuspend.',
        reinstate: 'Status pakar berhasil dipulihkan menjadi verified.',
        revoke: 'Status kepakaran resmi dicabut permanen.',
      };

      setActionNotice(messageMap[actionType]);
      setSelectedExpert(null);
      setActionType(null);
      fetchExperts();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Gagal mengeksekusi tindakan operasional.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Terverifikasi</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Ditangguhkan (Suspended)</span>
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <UserX className="h-3 w-3" />
            <span>Dicabut (Revoked)</span>
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
    <Sidebar title="Direktori Pakar & Siklus Hidup">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Direktori Pakar Terverifikasi</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Kelola status operasional, penangguhan kebijakan (suspend), pemulihan (reinstate),
              dan pencabutan hak kepakaran secara tertib audit.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(1);
                fetchExperts();
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
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama pakar, email, atau komunitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              />
            </form>

            <div className="flex items-center gap-2.5">
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
                  <option value="verified">Terverifikasi (Verified)</option>
                  <option value="suspended">Ditangguhkan (Suspended)</option>
                  <option value="revoked">Dicabut Permanen (Revoked)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Experts Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat direktori pakar...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : experts.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <Users className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada pakar yang cocok.</p>
              <p className="text-neutral-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Pakar Adat</th>
                    <th className="py-3.5 px-4">Akun Pengguna</th>
                    <th className="py-3.5 px-4">Komunitas & Wilayah</th>
                    <th className="py-3.5 px-4">Status & Izin RAG</th>
                    <th className="py-3.5 px-4">Tarif Sesi</th>
                    <th className="py-3.5 px-4 text-right">Tindakan Tata Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {experts.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#fffbf7]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620]">{exp.public_name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">/{exp.slug}</div>
                        {exp.title && (
                          <div className="text-[11px] text-neutral-600 truncate max-w-[200px]">
                            {exp.title}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#2e2620]">{exp.user_name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">{exp.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        <div>{exp.community || '-'}</div>
                        <div className="text-[11px] text-neutral-400">{exp.region || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div>{getStatusBadge(exp.status)}</div>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              exp.rag_consent_active ? 'bg-emerald-500' : 'bg-neutral-300'
                            }`}
                          />
                          <span>
                            {exp.rag_consent_active ? 'RAG Diizinkan' : 'RAG Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-700">
                        Rp {Number(exp.hourly_rate || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {exp.status === 'verified' && (
                            <button
                              type="button"
                              onClick={() => openActionModal(exp, 'suspend')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all"
                            >
                              Suspend
                            </button>
                          )}

                          {exp.status === 'suspended' && (
                            <button
                              type="button"
                              onClick={() => openActionModal(exp, 'reinstate')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all"
                            >
                              Pulihkan
                            </button>
                          )}

                          {exp.status !== 'revoked' && (
                            <button
                              type="button"
                              onClick={() => openActionModal(exp, 'revoke')}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
                            >
                              Cabut Gelar
                            </button>
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
              Menampilkan {experts.length} dari total{' '}
              <span className="font-bold text-[#2e2620]">{totalItems}</span> pakar
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

        {/* Lifecycle Action Dialog */}
        {selectedExpert && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
                      actionType === 'revoke'
                        ? 'bg-red-50 text-red-600'
                        : actionType === 'suspend'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {actionType === 'revoke' ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : actionType === 'suspend' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2e2620]">
                      {actionType === 'suspend'
                        ? 'Penangguhan Akses Pakar'
                        : actionType === 'reinstate'
                        ? 'Pemulihan Akses Pakar'
                        : 'Pencabutan Gelar Pakar'}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Target: {selectedExpert.public_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedExpert(null);
                    setActionType(null);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#fffbf7] border border-[#f5dfb8] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Pakar:</span>
                    <span className="font-bold text-[#2e2620]">{selectedExpert.public_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email Akun:</span>
                    <span className="text-neutral-700 font-mono">{selectedExpert.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Dampak:</span>
                    <span className="font-semibold text-neutral-800">
                      {actionType === 'suspend'
                        ? 'Konsultasi & binding RAG dihentikan sementara'
                        : actionType === 'reinstate'
                        ? 'Akses konsultasi & profil publik aktif kembali'
                        : 'Hak pakar, entitlement & konsen dicabut permanen'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Alasan Operasional / Notulensi Keputusan (Wajib, min. 10 karakter)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Ditemukan keberatan masyarakat adat terkait klaim silsilah..."
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Alasan ini disimpan dalam jejak audit immutable dan menjadi acuan komite tata kelola.
                  </p>
                </div>

                {actionError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{actionError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExpert(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl text-neutral-600 text-xs font-bold hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLifecycleAction}
                  disabled={actionLoading || reason.trim().length < 10}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${
                    actionType === 'revoke'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionType === 'suspend'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading ? 'Memproses...' : 'Konfirmasi Tindakan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminExperts;
