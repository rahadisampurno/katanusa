import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
  User,
  Users,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import auth from '../../../libs/auth';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface KnowledgeQueueItem {
  version_id: string;
  version: number;
  status: string;
  cultural_classification: string;
  rag_allowed: boolean;
  rights_basis: string;
  submitted_at: string;
  source_id: string;
  source_title: string;
  community_name: string;
  expert_profile_id: string;
  expert_name: string;
  expert_slug: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  claimed_by_reviewer_id: string | null;
  assignment_expires_at: string | null;
}

export const KnowledgeReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const currentUserId = auth.getUserData()?.id;

  const [queue, setQueue] = useState<KnowledgeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');

  // Claim action loading states
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await network.get<{ queue: KnowledgeQueueItem[] }>(
        '/reviewer/knowledge/queue'
      );
      setQueue(res.data.queue || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat antrean kurasi materi pengetahuan.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleClaim = async (versionId: string) => {
    setClaimingId(versionId);
    try {
      await network.post(`/reviewer/knowledge/${versionId}/claim`);
      setNotice('Penugasan berhasil diklaim. Membuka lembar kurasi materi...');
      setTimeout(() => {
        navigate(`/reviewer/knowledge/${versionId}`);
      }, 800);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengklaim materi pengetahuan.');
      fetchQueue();
    } finally {
      setClaimingId(null);
    }
  };

  const handleRelease = async (versionId: string) => {
    if (!confirm('Apakah Anda yakin ingin melepaskan klaim materi ini kembali ke antrean umum?')) {
      return;
    }
    setClaimingId(versionId);
    try {
      await network.post(`/reviewer/knowledge/${versionId}/release`);
      setNotice('Klaim penugasan materi berhasil dilepaskan.');
      fetchQueue();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal melepaskan klaim penugasan.');
    } finally {
      setClaimingId(null);
    }
  };

  const filteredItems = queue.filter((item) => {
    const matchesSearch =
      item.source_title.toLowerCase().includes(search.toLowerCase()) ||
      item.expert_name.toLowerCase().includes(search.toLowerCase()) ||
      item.community_name.toLowerCase().includes(search.toLowerCase()) ||
      item.file_name.toLowerCase().includes(search.toLowerCase());

    const matchesClass =
      classificationFilter === 'all' ||
      item.cultural_classification === classificationFilter;

    let matchesClaim = true;
    if (claimStatusFilter === 'claimed_by_me') {
      matchesClaim = item.claimed_by_reviewer_id === currentUserId;
    } else if (claimStatusFilter === 'unclaimed') {
      matchesClaim = !item.claimed_by_reviewer_id;
    }

    return matchesSearch && matchesClass && matchesClaim;
  });

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'public_education':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Edukasi Publik (Layak RAG)</span>
          </span>
        );
      case 'contextual_traditional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Tradisi Kontekstual</span>
          </span>
        );
      case 'restricted_lineage':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="h-3 w-3" />
            <span>Terbatas Trah / Garis Keturunan</span>
          </span>
        );
      case 'sacred_restricted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="h-3 w-3" />
            <span>Sakral / Restriksi Ketat (Dilarang Masuk RAG)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
            {classification}
          </span>
        );
    }
  };

  return (
    <Sidebar title="Kurasi Pengetahuan RAG">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Antrean Kurasi Pengetahuan Adat</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Verifikasi keabsahan transmisi adat, hak kepemilikan, dan klasifikasi keterbukaan materi
              sebelum materi disetujui (Status: Approved) untuk rujukan Persona AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebdccc] hover:bg-[#fffbf7] text-xs font-bold text-[#2e2620] shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-900 font-bold">
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
                placeholder="Cari judul materi, nama pakar, atau komunitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">Klasifikasi:</span>
                <select
                  value={classificationFilter}
                  onChange={(e) => setClassificationFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                >
                  <option value="all">Semua Klasifikasi</option>
                  <option value="public_education">Edukasi Publik</option>
                  <option value="contextual_traditional">Tradisi Kontekstual</option>
                  <option value="restricted_lineage">Terbatas Garis Trah</option>
                  <option value="sacred_restricted">Sakral / Restriksi</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                <span className="font-medium">Status Penugasan:</span>
                <select
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                >
                  <option value="all">Semua Status</option>
                  <option value="claimed_by_me">Ditugaskan ke Saya</option>
                  <option value="unclaimed">Belum Diklaim</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat antrean kurasi materi...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <BookOpen className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada materi dalam antrean saat ini.</p>
              <p className="text-neutral-400 mt-0.5">
                Semua artikel dan naskah pengetahuan telah selesai ditinjau.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Materi Pengetahuan</th>
                    <th className="py-3.5 px-4">Pakar Kontributor</th>
                    <th className="py-3.5 px-4">Komunitas Adat</th>
                    <th className="py-3.5 px-4">Klasifikasi Budaya</th>
                    <th className="py-3.5 px-4">Status Klaim</th>
                    <th className="py-3.5 px-4 text-right">Aksi Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredItems.map((item) => {
                    const isClaimedByMe = item.claimed_by_reviewer_id === currentUserId;
                    const isClaimedByOther =
                      item.claimed_by_reviewer_id && !isClaimedByMe;

                    return (
                      <tr key={item.version_id} className="hover:bg-[#fffbf7]/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#2e2620]">{item.source_title}</div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span>Versi {item.version}</span>
                            <span>•</span>
                            <span className="font-mono text-neutral-400">{item.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#2e2620]">{item.expert_name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            /{item.expert_slug}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600">
                          {item.community_name || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getClassificationBadge(item.cultural_classification)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isClaimedByMe ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Klaim Aktif Anda</span>
                              </span>
                              {item.assignment_expires_at && (
                                <div className="text-[11px] text-neutral-500 font-mono">
                                  Batas: {dayjs(item.assignment_expires_at).format('DD MMM, HH:mm')}
                                </div>
                              )}
                            </div>
                          ) : isClaimedByOther ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Sedang Ditelaah Kurator Lain</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">Belum diklaim</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isClaimedByMe ? (
                              <>
                                <Link
                                  to={`/reviewer/knowledge/${item.version_id}`}
                                  className="px-3 py-1.5 rounded-lg bg-[#d71920] hover:bg-[#b81218] text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                                >
                                  <span>Buka Kurasi</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleRelease(item.version_id)}
                                  disabled={claimingId === item.version_id}
                                  className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all"
                                >
                                  Lepas
                                </button>
                              </>
                            ) : isClaimedByOther ? (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-400 text-xs font-bold cursor-not-allowed"
                              >
                                Terkunci
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClaim(item.version_id)}
                                disabled={claimingId === item.version_id}
                                className="px-3 py-1.5 rounded-lg bg-[#2e2620] hover:bg-[#d71920] text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                              >
                                <Lock className="h-3.5 w-3.5" />
                                <span>Klaim Penugasan</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default KnowledgeReviewQueue;
