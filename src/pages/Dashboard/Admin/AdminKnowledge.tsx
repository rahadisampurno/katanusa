import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import { getApiErrorMessage } from '../../../libs/apiError';
import network from '../../../libs/network';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface KnowledgeAdminItem {
  version_id: string;
  version: number;
  status: string;
  cultural_classification: string;
  rag_allowed: boolean;
  rights_basis: string;
  submitted_at: string | null;
  approved_at: string | null;
  activated_at: string | null;
  source_id: string;
  source_title: string;
  community_name: string;
  expert_profile_id: string;
  expert_name: string;
  expert_slug: string;
  active_bindings_count: string;
}

export const AdminKnowledge: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [items, setItems] = useState<KnowledgeAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.append('search', appliedSearch);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await network.get<{
        items: KnowledgeAdminItem[];
        pagination: { page: number; limit: number; total_items: number; total_pages: number };
      }>(`/admin/knowledge?${params.toString()}`);

      setItems(res.data.items || []);
      setTotalPages(res.data.pagination.total_pages || 1);
      setTotalItems(res.data.pagination.total_items || 0);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Gagal memuat tata kelola pengetahuan.'));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, statusFilter]);

  useEffect(() => {
    void fetchKnowledge();
  }, [fetchKnowledge]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'public_education':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Edukasi Publik</span>
          </span>
        );
      case 'contextual':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Kontekstual</span>
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="h-3 w-3" />
            <span>Terbatas</span>
          </span>
        );
      case 'sacred':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-3 w-3" />
            <span>Sakral</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600">
            {classification}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
            Menunggu Kurasi
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Sedang Ditelaah
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Disetujui (Menunggu Binding)</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="h-3 w-3" />
            <span>Aktif Terikat Persona</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-3 w-3" />
            <span>Ditangguhkan (Suspended)</span>
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
    <Sidebar title="Tata Kelola Pengetahuan Platform">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Tata Kelola Pengetahuan Budaya</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Pantau korpus pengetahuan yang disumbangkan oleh pakar, persetujuan kurasi adat,
              dan distribusi tautan (bindings) ke Persona AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(1);
                fetchKnowledge();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebdccc] hover:bg-[#fffbf7] text-xs font-bold text-[#2e2620] shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#ebdccc] shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari judul materi, nama pakar, atau komunitas..."
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
                  <option value="submitted">Menunggu Kurasi (Submitted)</option>
                  <option value="in_review">Sedang Ditelaah (In Review)</option>
                  <option value="approved">Disetujui Kurator (Approved)</option>
                  <option value="active">Aktif di Persona AI (Active)</option>
                  <option value="suspended">Ditangguhkan (Suspended)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat data pengetahuan...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <BookOpen className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada artikel pengetahuan ditemukan.</p>
              <p className="text-neutral-400 mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Materi Pengetahuan</th>
                    <th className="py-3.5 px-4">Kontributor Pakar</th>
                    <th className="py-3.5 px-4">Komunitas Adat</th>
                    <th className="py-3.5 px-4">Klasifikasi Budaya</th>
                    <th className="py-3.5 px-4">Status Siklus</th>
                    <th className="py-3.5 px-4">Tautan Persona</th>
                    <th className="py-3.5 px-4 text-right">Waktu Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <tr key={item.version_id} className="hover:bg-[#fffbf7]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620]">{item.source_title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Versi {item.version} • Dasar: {item.rights_basis}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#2e2620]">{item.expert_name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">/{item.expert_slug}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {item.community_name || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {getClassificationBadge(item.cultural_classification)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#2e2620] flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              Number(item.active_bindings_count) > 0 ? 'bg-emerald-500' : 'bg-neutral-300'
                            }`}
                          />
                          <span>{item.active_bindings_count} persona aktif</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-500 font-mono text-[11px]">
                        {item.approved_at
                          ? dayjs(item.approved_at).format('DD MMM YYYY, HH:mm')
                          : '-'}
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
              Menampilkan {items.length} dari total{' '}
              <span className="font-bold text-[#2e2620]">{totalItems}</span> materi pengetahuan
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
      </div>
    </Sidebar>
  );
};

export default AdminKnowledge;
