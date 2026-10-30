import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import { getApiErrorMessage } from '../../../libs/apiError';
import network from '../../../libs/network';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface AuditEventItem {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_name: string | null;
  actor_email: string | null;
}

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  // Metadata Inspector Modal
  const [inspectedEvent, setInspectedEvent] = useState<AuditEventItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAuditEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resourceType', resourceFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await network.get<{
        items: AuditEventItem[];
        pagination: { page: number; limit: number; total_items: number; total_pages: number };
      }>(`/admin/audit-events?${params.toString()}`);

      setLogs(res.data.items || []);
      setTotalPages(res.data.pagination.total_pages || 1);
      setTotalItems(res.data.pagination.total_items || 0);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Gagal memuat log audit.'));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page, resourceFilter]);

  useEffect(() => {
    void fetchAuditEvents();
  }, [fetchAuditEvents]);

  const handleCopyJson = () => {
    if (!inspectedEvent) return;
    navigator.clipboard.writeText(JSON.stringify(inspectedEvent.metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('REVOKE') || action.includes('REJECT') || action.includes('SUSPEND')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 font-mono">
          {action}
        </span>
      );
    }
    if (action.includes('ASSIGN') || action.includes('EXTEND') || action.includes('GRANT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
          {action}
        </span>
      );
    }
    if (action.includes('REINSTATE') || action.includes('APPROVE') || action.includes('ACTIVATE')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-800 font-mono">
        {action}
      </span>
    );
  };

  return (
    <Sidebar title="Jejak Audit & Keamanan Platform">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Jejak Audit Keamanan Platform</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Log aktivitas tata kelola bersifat strictly append-only (kekal) untuk memenuhi standar
              audit forensik dan tata kelola perlindungan data budaya.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(1);
                fetchAuditEvents();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebdccc] hover:bg-[#fffbf7] text-xs font-bold text-[#2e2620] shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#ebdccc] shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Filter className="h-3.5 w-3.5 text-neutral-400" />
              <span className="font-medium">Filter Tindakan:</span>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              >
                <option value="">Semua Tindakan</option>
                <option value="ADMIN_ASSIGNED_REVIEWER">ADMIN_ASSIGNED_REVIEWER</option>
                <option value="ADMIN_CANCELLED_ASSIGNMENT">ADMIN_CANCELLED_ASSIGNMENT</option>
                <option value="ADMIN_EXTENDED_ASSIGNMENT">ADMIN_EXTENDED_ASSIGNMENT</option>
                <option value="ADMIN_SUSPENDED_EXPERT">ADMIN_SUSPENDED_EXPERT</option>
                <option value="ADMIN_REINSTATED_EXPERT">ADMIN_REINSTATED_EXPERT</option>
                <option value="ADMIN_REVOKED_EXPERT">ADMIN_REVOKED_EXPERT</option>
                <option value="ADMIN_MANAGED_CAPABILITY">ADMIN_MANAGED_CAPABILITY</option>
                <option value="REVIEWER_CLAIMED_APPLICATION">REVIEWER_CLAIMED_APPLICATION</option>
                <option value="DECISION_STAGE_APPROVED">DECISION_STAGE_APPROVED</option>
                <option value="EXPERT_ACTIVATED">EXPERT_ACTIVATED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span className="font-medium">Sumber Daya:</span>
              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
              >
                <option value="">Semua Sumber Daya</option>
                <option value="expert_applications">expert_applications</option>
                <option value="expert_profiles">expert_profiles</option>
                <option value="expert_review_assignments">expert_review_assignments</option>
                <option value="account_capabilities">account_capabilities</option>
                <option value="knowledge_sources">knowledge_sources</option>
                <option value="consent_records">consent_records</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="rounded-3xl bg-white border border-[#ebdccc] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat log jejak audit...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600 px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500 px-4">
              <ShieldAlert className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">Tidak ada catatan audit yang cocok.</p>
              <p className="text-neutral-400 mt-0.5">Coba reset filter pencarian tindakan atau sumber daya.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#fffaf5] text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Waktu Presisi</th>
                    <th className="py-3.5 px-4">Aktor Bertanggung Jawab</th>
                    <th className="py-3.5 px-4">Aksi Keamanan</th>
                    <th className="py-3.5 px-4">Tipe Objek</th>
                    <th className="py-3.5 px-4">ID Objek</th>
                    <th className="py-3.5 px-4 text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#fffbf7]/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                        {dayjs(log.created_at).format('DD/MM/YYYY, HH:mm:ss')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2e2620]">
                          {log.actor_name || 'Sistem Terotomasi'}
                        </div>
                        {log.actor_email && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {log.actor_email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3.5 px-4 font-mono text-neutral-700">{log.resource_type}</td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px] truncate max-w-[140px]">
                        {log.resource_id}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectedEvent(log)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-[#2e2620] hover:text-white text-neutral-700 text-xs font-bold transition-all inline-flex items-center gap-1 font-mono"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
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
              Menampilkan {logs.length} dari total{' '}
              <span className="font-bold text-[#2e2620]">{totalItems}</span> catatan audit
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

        {/* Metadata Inspector Modal */}
        {inspectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-neutral-100 text-[#2e2620] flex items-center justify-center font-bold font-mono">
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2e2620]">Inspeksi Metadata Log</h3>
                    <p className="text-xs text-neutral-500 font-mono">{inspectedEvent.action}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedEvent(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="p-2.5 rounded-xl bg-[#fffbf7] border border-[#ebdccc]">
                    <span className="text-neutral-400 block text-[10px]">LOG ID</span>
                    <span className="font-mono text-neutral-700 truncate block">
                      {inspectedEvent.id}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fffbf7] border border-[#ebdccc]">
                    <span className="text-neutral-400 block text-[10px]">WAKTU RECORD</span>
                    <span className="font-mono text-neutral-700 block">
                      {dayjs(inspectedEvent.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-xs font-bold text-neutral-700">JSON Payload:</span>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="text-xs text-neutral-500 hover:text-[#d71920] inline-flex items-center gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                    {JSON.stringify(inspectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedEvent(null)}
                  className="px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminAudit;
