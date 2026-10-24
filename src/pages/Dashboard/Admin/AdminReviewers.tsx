import type React from 'react';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface ReviewerItem {
  id: string;
  name: string;
  email: string;
  role: string;
  capabilities: string[];
  active_assignments_count: string;
}

export const AdminReviewers: React.FC = () => {
  const [reviewers, setReviewers] = useState<ReviewerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [capFilter, setCapFilter] = useState('all');

  // Capability Manage Modal
  const [selectedReviewer, setSelectedReviewer] = useState<ReviewerItem | null>(null);
  const [selectedCap, setSelectedCap] = useState('credential_reviewer');
  const [actionKind, setActionKind] = useState<'grant' | 'revoke'>('grant');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchReviewers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await network.get<{ reviewers: ReviewerItem[] }>('/admin/reviewers');
      setReviewers(res.data.reviewers || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat staf reviewer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
  }, []);

  const openManageModal = (reviewer: ReviewerItem) => {
    setSelectedReviewer(reviewer);
    setSelectedCap('credential_reviewer');
    setActionKind('grant');
    setReason('');
    setModalError(null);
  };

  const handleCapabilitySubmit = async () => {
    if (!selectedReviewer) return;
    if (reason.trim().length < 5) {
      setModalError('Alasan penetapan wewenang wajib diisi minimal 5 karakter.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      await network.post(`/admin/reviewers/${selectedReviewer.id}/capabilities`, {
        capability: selectedCap,
        action: actionKind,
        reason: reason.trim(),
      });

      setActionNotice(
        `Kapabilitas '${selectedCap}' berhasil ${actionKind === 'grant' ? 'diberikan kepada' : 'dicabut dari'} ${selectedReviewer.name}.`
      );
      setSelectedReviewer(null);
      fetchReviewers();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Gagal mengubah kapabilitas.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviewers = reviewers.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesCap = capFilter === 'all' || r.capabilities?.includes(capFilter);
    return matchesSearch && matchesCap;
  });

  const getCapabilityBadge = (cap: string) => {
    switch (cap) {
      case 'credential_reviewer':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
          >
            <UserCheck className="h-3 w-3" />
            <span>Verifikator Kredensial</span>
          </span>
        );
      case 'cultural_reviewer':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Kurator Dewan Adat</span>
          </span>
        );
      case 'admin':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"
          >
            <Shield className="h-3 w-3" />
            <span>Super Admin</span>
          </span>
        );
      case 'security_admin':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300"
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Security Admin</span>
          </span>
        );
      default:
        return (
          <span
            key={cap}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600"
          >
            {cap}
          </span>
        );
    }
  };

  return (
    <Sidebar title="Staf Reviewer & Penugasan">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Staf Reviewer & Dewan Kurasi</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Kelola beban kerja kurasi serta distribusi wewenang kapabilitas verifikator kredensial
              dan kurator adat secara akuntabel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReviewers}
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari staf reviewer berdasarkan nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">Filter Kapabilitas:</span>
                <select
                  value={capFilter}
                  onChange={(e) => setCapFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                >
                  <option value="all">Semua Staf</option>
                  <option value="credential_reviewer">Verifikator Kredensial</option>
                  <option value="cultural_reviewer">Kurator Dewan Adat</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reviewers Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat data reviewer...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : filteredReviewers.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <Users className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada staf reviewer ditemukan.</p>
              <p className="text-neutral-400 mt-0.5">Coba sesuaikan pencarian atau filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Staf / Anggota Dewan</th>
                    <th className="py-3.5 px-4">Peran Dasar</th>
                    <th className="py-3.5 px-4">Kapabilitas Terdaftar</th>
                    <th className="py-3.5 px-4">Beban Kerja Aktif</th>
                    <th className="py-3.5 px-4 text-right">Kelola Wewenang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredReviewers.map((rev) => (
                    <tr key={rev.id} className="hover:bg-[#fffbf7]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620]">{rev.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">{rev.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-neutral-700 uppercase font-semibold">
                          {rev.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {rev.capabilities && rev.capabilities.length > 0 ? (
                            rev.capabilities.map((cap) => getCapabilityBadge(cap))
                          ) : (
                            <span className="text-neutral-400 italic">Tidak ada kapabilitas khusus</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620] flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              Number(rev.active_assignments_count) > 0
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span>{rev.active_assignments_count} pengajuan aktif</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openManageModal(rev)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-[#d71920] hover:text-white text-neutral-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          <span>Atur Wewenang</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Capability Modal */}
        {selectedReviewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-red-50 text-[#d71920] flex items-center justify-center font-bold">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2e2620]">Kelola Wewenang Staf</h3>
                    <p className="text-xs text-neutral-500">Target: {selectedReviewer.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReviewer(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#fffbf7] border border-[#f5dfb8] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Nama:</span>
                    <span className="font-bold text-[#2e2620]">{selectedReviewer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email:</span>
                    <span className="text-neutral-700 font-mono">{selectedReviewer.email}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#ebdccc]">
                    <span className="text-neutral-500">Kapabilitas Saat Ini:</span>
                    <span className="text-neutral-800 font-mono">
                      {selectedReviewer.capabilities?.join(', ') || '-'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionKind('grant')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      actionKind === 'grant'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    + Berikan Wewenang
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionKind('revoke')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      actionKind === 'revoke'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    - Cabut Wewenang
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">Pilih Kapabilitas</label>
                  <select
                    value={selectedCap}
                    onChange={(e) => setSelectedCap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                  >
                    <option value="credential_reviewer">
                      credential_reviewer (Verifikator Kredensial Tahap 1-3)
                    </option>
                    <option value="cultural_reviewer">
                      cultural_reviewer (Kurator Dewan Adat Tahap 4-6)
                    </option>
                    <option value="admin">admin (Super Admin Operasional)</option>
                    <option value="security_admin">security_admin (Keamanan Platform)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Alasan Penetapan / Pencabutan (Wajib, min. 5 karakter)
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Penugasan resmi sesuai SK Dewan Adat..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                  />
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReviewer(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 text-xs font-bold hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCapabilitySubmit}
                  disabled={submitting || reason.trim().length < 5}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${
                    actionKind === 'grant'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminReviewers;
