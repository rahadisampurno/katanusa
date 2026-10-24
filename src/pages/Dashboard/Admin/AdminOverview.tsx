import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import { PerisaiTalawangIcon, SuryaMajapahitIcon } from '../../../components/icons/NusantaraIcons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface ActionCenterMetrics {
  waiting_assignment_count: number;
  expiring_assignments_count: number;
  sla_breaches_count: number;
  pending_activation_count: number;
  unpublished_knowledge_count: number;
  suspended_experts_count: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  actor_name: string | null;
  actor_email: string | null;
}

export const AdminOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ActionCenterMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await network.get<{
        action_center: ActionCenterMetrics;
        recent_audit_logs: AuditLogItem[];
      }>('/admin/dashboard');
      setMetrics(res.data.action_center);
      setRecentLogs(res.data.recent_audit_logs || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat ringkasan tata kelola.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('SUSPEND') || act.includes('REVOKE') || act.includes('REJECT')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    if (act.includes('APPROVE') || act.includes('REINSTATE') || act.includes('ACTIVATE')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (act.includes('ASSIGN') || act.includes('EXTEND')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    if (act.includes('APPEAL')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  return (
    <Sidebar title="Pusat Kendali Tata Kelola Platform">
      <div className="space-y-7 max-w-7xl mx-auto pb-12">
        {/* Header Hero Banner (Clean Light Cultural Theme) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#dce7f5] p-6 sm:p-8 shadow-sm">
          {/* Subtle Cultural Pattern Background Accent */}
          <div className="absolute -right-8 -bottom-10 w-64 h-64 text-[#17294b]/5 pointer-events-none">
            <SuryaMajapahitIcon className="w-full h-full" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] shadow-2xs">
                  <PerisaiTalawangIcon className="h-3.5 w-3.5 text-[#b91c1c]" />
                  <span>Pusat Kendali Super Admin</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eef7f1] text-[#23764b] border border-[#c4e6d2]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#23764b]" />
                  <span>Dual-Control Governance</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17294b] tracking-wide">
                Pusat Tata Kelola Platform & Perlindungan Budaya
              </h1>
              <p className="text-xs sm:text-sm text-[#536176] leading-relaxed">
                Kelola integritas operasional, alokasi penilai budaya, penegakan komitmen SLA 72 jam, serta mitigasi risiko pengetahuan adat secara transparan dan berkeadilan.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#fffbf7] text-[#17294b] text-xs font-bold transition-all border border-[#cdd9e8] shadow-xs hover:border-[#b91c1c] cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#b91c1c]' : 'text-[#718096]'}`} />
                <span>Segarkan Data</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-bold underline hover:text-red-900 cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Action-Oriented Operational Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#17294b] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#d71920]" />
              <span>Pusat Tindakan & Kepatuhan Operasional</span>
            </h2>
            <span className="text-xs text-[#718096]">Pembaruan data otomatis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Waiting Assignment */}
            <div className="p-5 rounded-2xl bg-white border border-[#dce7f5] shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">
                    Menunggu Penugasan
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#17294b] mt-2">
                  {loading ? '...' : (metrics?.waiting_assignment_count ?? 0)}
                </div>
                <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                  Aplikasi kandidat yang belum memiliki reviewer aktif.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <Link
                  to="/admin/applications"
                  className="text-xs font-bold text-[#b91c1c] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Tugaskan Reviewer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: SLA Breaches */}
            {(() => {
              const breaches = metrics?.sla_breaches_count ?? 0;
              const hasBreach = breaches > 0;
              return (
                <div className={`p-5 rounded-2xl bg-white border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${hasBreach ? 'border-red-200' : 'border-[#dce7f5]'}`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${hasBreach ? 'text-red-600' : 'text-[#718096]'}`}>
                        Pelanggaran SLA (&gt; 5 Hari)
                      </span>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${hasBreach ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {hasBreach ? <ShieldAlert className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold mt-2 ${hasBreach ? 'text-red-600' : 'text-[#17294b]'}`}>
                      {loading ? '...' : breaches}
                    </div>
                    <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                      {hasBreach
                        ? 'Pengajuan tertunda melebihi batas komitmen standar layanan.'
                        : 'Seluruh pengajuan diproses sesuai komitmen waktu standar.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                    <Link
                      to="/admin/applications"
                      className={`text-xs font-bold hover:underline inline-flex items-center gap-1.5 ${hasBreach ? 'text-red-700' : 'text-[#17294b]'}`}
                    >
                      <span>Lihat Pengajuan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Card 3: Expiring Assignments */}
            {(() => {
              const expiring = metrics?.expiring_assignments_count ?? 0;
              const isWarning = expiring > 0;
              return (
                <div className="p-5 rounded-2xl bg-white border border-[#dce7f5] shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">
                        Kedaluwarsa (&lt; 24 Jam)
                      </span>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${isWarning ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold mt-2 ${isWarning ? 'text-orange-600' : 'text-[#17294b]'}`}>
                      {loading ? '...' : expiring}
                    </div>
                    <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                      Tenggat penugasan reviewer yang mendekati batas maksimal 72 jam.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                    <Link
                      to="/admin/applications"
                      className="text-xs font-bold text-[#b91c1c] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>Perpanjang / Alihkan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Card 4: Pending Activation */}
            <div className="p-5 rounded-2xl bg-white border border-[#dce7f5] shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">
                    Menunggu Aktivasi
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#17294b] mt-2">
                  {loading ? '...' : (metrics?.pending_activation_count ?? 0)}
                </div>
                <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                  Kandidat disetujui yang belum menuntaskan aktivasi mandiri.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <Link
                  to="/admin/applications?status=approved_pending_activation"
                  className="text-xs font-bold text-[#b91c1c] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Pantau Status Aktivasi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 5: Unpublished Knowledge */}
            <div className="p-5 rounded-2xl bg-white border border-[#dce7f5] shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">
                    Pengetahuan Belum Terikat
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#17294b] mt-2">
                  {loading ? '...' : (metrics?.unpublished_knowledge_count ?? 0)}
                </div>
                <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                  Materi terkurasi disetujui namun belum aktif pada Persona AI.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <Link
                  to="/admin/knowledge"
                  className="text-xs font-bold text-[#b91c1c] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Kelola Binding Persona</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 6: Suspended Experts */}
            {(() => {
              const suspended = metrics?.suspended_experts_count ?? 0;
              const hasSuspended = suspended > 0;
              return (
                <div className={`p-5 rounded-2xl bg-white border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${hasSuspended ? 'border-rose-200' : 'border-[#dce7f5]'}`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${hasSuspended ? 'text-rose-600' : 'text-[#718096]'}`}>
                        Pakar Ditangguhkan
                      </span>
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${hasSuspended ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {hasSuspended ? <ShieldAlert className="h-4.5 w-4.5" /> : <ShieldCheck className="h-4.5 w-4.5" />}
                      </div>
                    </div>
                    <div className={`text-3xl font-extrabold mt-2 ${hasSuspended ? 'text-rose-600' : 'text-[#17294b]'}`}>
                      {loading ? '...' : suspended}
                    </div>
                    <p className="text-xs text-[#536176] mt-2 leading-relaxed">
                      {hasSuspended
                        ? 'Pakar disuspend karena pelanggaran etika atau investigasi.'
                        : 'Tidak ada pakar yang sedang dalam status penangguhan.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                    <Link
                      to="/admin/experts?status=suspended"
                      className={`text-xs font-bold hover:underline inline-flex items-center gap-1.5 ${hasSuspended ? 'text-rose-700' : 'text-[#17294b]'}`}
                    >
                      <span>Tinjau Direktori</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Quick Governance Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/applications"
            className="p-4 rounded-2xl bg-white border border-[#dce7f5] hover:border-[#b91c1c] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="h-11 w-11 rounded-xl bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17294b]">Pengajuan Calon Pakar</div>
              <div className="text-xs text-[#718096]">Antrean verifikasi 6 tahap</div>
            </div>
          </Link>

          <Link
            to="/admin/experts"
            className="p-4 rounded-2xl bg-white border border-[#dce7f5] hover:border-[#b91c1c] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="h-11 w-11 rounded-xl bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17294b]">Direktori Pakar</div>
              <div className="text-xs text-[#718096]">Suspend, reinstate & revoke</div>
            </div>
          </Link>

          <Link
            to="/admin/reviewers"
            className="p-4 rounded-2xl bg-white border border-[#dce7f5] hover:border-[#b91c1c] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="h-11 w-11 rounded-xl bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17294b]">Staf & Tim Reviewer</div>
              <div className="text-xs text-[#718096]">Manajemen beban & wewenang</div>
            </div>
          </Link>

          <Link
            to="/admin/audit"
            className="p-4 rounded-2xl bg-white border border-[#dce7f5] hover:border-[#b91c1c] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="h-11 w-11 rounded-xl bg-[#fbf2ef] text-[#b91c1c] border border-[#f5dfb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17294b]">Jejak Audit Keamanan</div>
              <div className="text-xs text-[#718096]">Immutable audit logs</div>
            </div>
          </Link>
        </div>

        {/* Recent Audit Activity Table */}
        <div className="rounded-3xl bg-white border border-[#dce7f5] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-[#17294b]">Aktivitas Tata Kelola Terbaru</h3>
              <p className="text-xs text-[#718096] mt-0.5">
                Catatan audit transaksi dan penegakan wewenang platform secara real-time
              </p>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-bold text-[#b91c1c] hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Semua Log Audit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#718096]">Memuat log audit...</div>
          ) : recentLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718096]">Belum ada riwayat audit terbaru.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fbff] text-[#536176] text-[11px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-3.5 rounded-l-xl">Waktu</th>
                    <th className="py-3 px-3.5">Aktor</th>
                    <th className="py-3 px-3.5">Tindakan</th>
                    <th className="py-3 px-3.5">Sumber Daya</th>
                    <th className="py-3 px-3.5 rounded-r-xl">ID Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#fbfdff] transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[#536176] whitespace-nowrap">
                        {dayjs(log.created_at).format('DD MMM YYYY, HH:mm:ss')}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-[#17294b]">
                        {log.actor_name || log.actor_email || 'Sistem / Anonim'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#536176] font-mono">{log.resource_type}</td>
                      <td className="py-3 px-3.5 font-mono text-[#94a3b8] text-[11px] truncate max-w-[150px]">
                        {log.resource_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default AdminOverview;
