import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck,
  PauseCircle,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

dayjs.locale('id');

interface KnowledgeSourceItem {
  id: string;
  title: string;
  summary: string;
  domain_tags: string[];
  region_tags: string[];
  community_name: string;
  language_code: string;
  current_active_version_id: string | null;
  created_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  active_version: {
    id: string;
    version: number;
    status: string;
    cultural_classification: string;
    rag_allowed: boolean;
    activated_at: string | null;
  } | null;
  total_versions: number;
}

interface KnowledgeSourcesResponse {
  sources: KnowledgeSourceItem[];
  profileRagConsentActive: boolean;
  expertProfile: {
    id: string;
    slug: string;
    public_name: string;
  };
}

export const RuangPakarMateri: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSourceForVersion, setSelectedSourceForVersion] = useState<KnowledgeSourceItem | null>(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [rightsBasis, setRightsBasis] = useState('self_authored');
  const [culturalClassification, setCulturalClassification] = useState('public_education');
  const [ragAllowed, setRagAllowed] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Knowledge Sources
  const { data, isLoading } = useQuery<KnowledgeSourcesResponse>({
    queryKey: ['expert-knowledge-sources'],
    queryFn: async () => {
      const res = await network.get('/expert/knowledge/sources');
      return res.data;
    },
  });

  const sources = data?.sources || [];
  const isProfileRagActive = data?.profileRagConsentActive ?? false;

  // Search, Filter & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'review' | 'withdrawn'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const filteredSources = sources.filter((s) => {
    const isWithdrawn = Boolean(s.withdrawn_at);
    const activeVer = s.active_version;
    const isUnderReview = !isWithdrawn && !activeVer;
    const isActive = !isWithdrawn && Boolean(activeVer);

    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'review' && !isUnderReview) return false;
    if (statusFilter === 'withdrawn' && !isWithdrawn) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchSummary = s.summary?.toLowerCase().includes(q);
      const matchCommunity = s.community_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCommunity) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSources.length / pageSize) || 1;
  const paginatedSources = filteredSources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Mutation: Buat Sumber & Unggah Berkas
  const createSourceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Pilih berkas PDF atau DOCX.');

      let targetSourceId = selectedSourceForVersion?.id;

      // 1. Buat Sumber baru jika bukan penambahan versi
      if (!targetSourceId) {
        const createRes = await network.post('/expert/knowledge/sources', {
          title,
          summary,
          communityName,
          domainTags: ['Kearifan Budaya', 'Adat Istiadat'],
        });
        targetSourceId = createRes.data.id;
      }

      // 2. Unggah berkas ke endpoint upload versi
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('rightsBasis', rightsBasis);
      formData.append('culturalClassification', culturalClassification);
      formData.append('ragAllowed', String(ragAllowed));

      const uploadRes = await network.post(
        `/expert/knowledge/sources/${targetSourceId}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const versionId = uploadRes.data.versionId;

      // 3. Langsung serahkan untuk kurasi (submit)
      await network.post(`/expert/knowledge/versions/${versionId}/submit`);

      return uploadRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-knowledge-sources'] });
      setIsModalOpen(false);
      resetForm();
      setStatusMessage({
        type: 'success',
        text: 'Materi pengetahuan berhasil diunggah dan diserahkan ke antrean kurasi Dewan Budaya.',
      });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ?? 'Gagal memproses unggahan materi.')
          : 'Gagal mengunggah berkas materi.';
      setStatusMessage({ type: 'error', text: msg });
    },
  });

  // Mutation: Jeda Sumber
  const pauseMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      await network.post(`/expert/knowledge/sources/${sourceId}/pause`, {
        reason: 'Dijeda oleh pakar melalui dasbor',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-knowledge-sources'] });
      setStatusMessage({ type: 'success', text: 'Sumber pengetahuan berhasil dijeda dari rujukan AI.' });
    },
  });

  // Mutation: Tarik Sumber
  const withdrawMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      await network.post(`/expert/knowledge/sources/${sourceId}/withdraw`, {
        reason: 'Ditarik oleh pakar',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-knowledge-sources'] });
      setStatusMessage({ type: 'success', text: 'Sumber pengetahuan telah ditarik secara permanen.' });
    },
  });

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setCommunityName('');
    setSelectedFile(null);
    setSelectedSourceForVersion(null);
    setRightsBasis('self_authored');
    setCulturalClassification('public_education');
    setRagAllowed(true);
  };

  const openNewSourceModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openNewVersionModal = (source: KnowledgeSourceItem) => {
    resetForm();
    setSelectedSourceForVersion(source);
    setTitle(source.title);
    setCommunityName(source.community_name);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            Penatagunaan Pengetahuan & Rujukan AI Adat
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Kelola karya, naskah, dan pustaka pengetahuan budaya Anda. Materi terkurasi menjadi rujukan sitasi akurat bagi Persona AI Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewSourceModal}
          className="kn-primary-cta inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white">Tambah Pengetahuan Baru</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Panel Status Konsen AI & Prinsip Perlindungan Budaya */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Izin Rujukan RAG AI Persona
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isProfileRagActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
              }`}
            >
              {isProfileRagActive ? 'Izin Profil Aktif' : 'Izin Belum Diberikan'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hanya materi terkurasi dengan klasifikasi <strong>Edukasi Publik</strong> yang dirujuk oleh Persona AI Anda.
            Setiap jawaban wajib menyertakan sitasi eksplisit dengan judul dan nomor halaman.
          </p>
        </div>

        <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pelatihan Model AI (Training)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-400/30">
              Dilarang / Terisolasi
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Seluruh berkas Anda <strong>tidak pernah dimasukkan ke bobot pelatihan model generatif</strong>.
            Hak cipta dan kearifan adat tetap utuh di bawah kepemilikan Anda.
          </p>
        </div>
      </div>

      {/* Daftar Sumber Pengetahuan */}
      <div className="rounded-2xl bg-[#132346]/90 border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pustaka Pengetahuan Terkelola
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-white">{filteredSources.length}</strong> sumber materi
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0F1B38] rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({sources.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif RAG ({sources.filter((s) => !s.withdrawn_at && s.active_version).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'review'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dalam Kurasi ({sources.filter((s) => !s.withdrawn_at && !s.active_version).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('withdrawn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'withdrawn'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ditarik ({sources.filter((s) => Boolean(s.withdrawn_at)).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul, ringkasan, atau komunitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#0F1B38] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat daftar karya dan pustaka pengetahuan...
          </div>
        ) : filteredSources.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Materi & Ringkasan</th>
                    <th className="py-3 px-3">Komunitas</th>
                    <th className="py-3 px-3">Versi</th>
                    <th className="py-3 px-3">Status RAG</th>
                    <th className="py-3 px-3">Terakhir Diperbarui</th>
                    <th className="py-3 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {paginatedSources.map((s) => {
                    const activeVer = s.active_version;
                    const isWithdrawn = Boolean(s.withdrawn_at);

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isWithdrawn ? 'opacity-60 bg-slate-900/40' : ''
                        }`}
                      >
                        {/* Judul & Ringkasan */}
                        <td className="py-3.5 px-3 max-w-xs">
                          <h4 className="font-bold text-white text-xs">{s.title}</h4>
                          {s.summary && (
                            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                              {s.summary}
                            </p>
                          )}
                        </td>

                        {/* Komunitas */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                          {s.community_name || '-'}
                        </td>

                        {/* Versi */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-amber-300 font-bold">
                            {activeVer ? `v${activeVer.version}` : '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Total {s.total_versions} versi
                          </span>
                        </td>

                        {/* Status RAG */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isWithdrawn ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              Ditarik
                            </span>
                          ) : activeVer ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Aktif di RAG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Dalam Kurasi
                            </span>
                          )}
                        </td>

                        {/* Terakhir Diperbarui */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {dayjs(s.updated_at).format('DD MMM YYYY, HH:mm')}
                        </td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          {!isWithdrawn ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openNewVersionModal(s)}
                                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                              >
                                + Versi
                              </button>

                              {activeVer && (
                                <button
                                  type="button"
                                  onClick={() => pauseMutation.mutate(s.id)}
                                  disabled={pauseMutation.isPending}
                                  title="Jeda dari rujukan AI"
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-all cursor-pointer"
                                >
                                  <PauseCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Tarik sumber pengetahuan ini dari rujukan AI? Tindakan ini akan mengecualikan dokumen seketika.'
                                    )
                                  ) {
                                    withdrawMutation.mutate(s.id);
                                  }
                                }}
                                disabled={withdrawMutation.isPending}
                                title="Tarik sumber pengetahuan"
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Nonaktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSources.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs space-y-3">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <p>Tidak ada sumber pengetahuan yang cocok dengan filter atau pencarian Anda.</p>
            <button
              type="button"
              onClick={openNewSourceModal}
              className="kn-primary-cta inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white">Mulai Daftarkan Pengetahuan</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Tambah / Versi Baru (Portal to document.body for global overlay coverage) */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/65 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex items-start justify-center animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div className="relative my-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-200 sm:max-h-[90dvh] sm:rounded-3xl">
              {/* Header Modal */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <BookOpen className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg leading-tight">
                      {selectedSourceForVersion
                        ? `Unggah Versi Baru: ${selectedSourceForVersion.title}`
                        : 'Tambah Sumber Pengetahuan Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Materi kurasi adat untuk rujukan sitasi akurat Persona AI Anda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Tutup modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Modal (Scrollable Content with min-h-0) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createSourceMutation.mutate();
                }}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3 text-xs">
                  {!selectedSourceForVersion && (
                    <>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Judul Karya / Pengetahuan Budaya <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Contoh: Filosofi dan Makna Simbolis Kain Tenun Gringsing"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Ringkasan Singkat
                        </label>
                        <textarea
                          rows={2}
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Uraian singkat tentang lingkup, konteks tradisi, dan pesan utama pengetahuan ini..."
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all outline-hidden resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5">
                          Komunitas / Masyarakat Adat Terkait
                        </label>
                        <input
                          type="text"
                          value={communityName}
                          onChange={(e) => setCommunityName(e.target.value)}
                          placeholder="Contoh: Masyarakat Tenganan Pegringsingan, Karangasem"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
                        />
                      </div>
                    </>
                  )}

                  {/* Unggah Berkas PDF / DOCX */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Berkas Dokumen Pengetahuan (PDF atau DOCX) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                        selectedFile
                          ? 'border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/60'
                          : 'border-slate-300 hover:border-red-400 bg-slate-50/70 hover:bg-red-50/20'
                      }`}
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-0.5">
                            <FileCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-bold text-slate-900 text-xs block">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {Math.round(selectedFile.size / 1024)} KB • Klik untuk mengganti berkas
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-0.5">
                            <UploadCloud className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="font-bold text-slate-800 text-xs block">Pilih Berkas PDF atau DOCX</span>
                          <span className="text-[10px] text-slate-500">
                            Dokumen digital dengan teks terbaca, maks. 15MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deklarasi Hak Cipta & Klasifikasi Budaya */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        Dasar Hak Cipta
                      </label>
                      <select
                        value={rightsBasis}
                        onChange={(e) => setRightsBasis(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3 py-2 text-xs text-slate-800 transition-all outline-hidden cursor-pointer"
                      >
                        <option value="self_authored">Karya Asli Peneliti/Pakar</option>
                        <option value="licensed">Lisensi Resmi / Izin Tertulis</option>
                        <option value="community_mandate">Mandat Komunitas / Lembaga Adat</option>
                        <option value="public_domain">Ranah Publik (Public Domain)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">
                        Klasifikasi Budaya
                      </label>
                      <select
                        value={culturalClassification}
                        onChange={(e) => setCulturalClassification(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl px-3 py-2 text-xs text-slate-800 transition-all outline-hidden cursor-pointer"
                      >
                        <option value="public_education">Edukasi Publik (Boleh Dirujuk AI)</option>
                        <option value="contextual">Kontekstual (Hanya Sesi Privat)</option>
                        <option value="restricted">Terbatas (Khusus Komunitas)</option>
                        <option value="sacred">Sakral (Dilarang untuk AI)</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkbox RAG Allowed */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragAllowed}
                        onChange={(e) => setRagAllowed(e.target.checked)}
                        className="mt-0.5 rounded border-amber-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <div>
                        <span className="font-bold text-amber-950 text-xs block">
                          Izinkan versi ini menjadi rujukan resmi AI Persona
                        </span>
                        <span className="text-[11px] text-amber-900/80 block leading-relaxed mt-0.5">
                          Materi akan diekstraksi dan diperiksa oleh Dewan Kurator Adat sebelum aktif sebagai sumber sitasi.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Footer Modal (Aksi) */}
                <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createSourceMutation.isPending || !selectedFile || (!title && !selectedSourceForVersion)}
                    className="kn-primary-cta px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    {createSourceMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin text-white" />
                        <span>Memproses & Menyerahkan...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className={`w-4 h-4 ${(!selectedFile || (!title && !selectedSourceForVersion)) ? 'text-slate-400' : 'text-white'}`} />
                        <span>Unggah & Serahkan untuk Kurasi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
