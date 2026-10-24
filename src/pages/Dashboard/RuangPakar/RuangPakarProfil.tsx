import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Save,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SuryaMajapahitIcon } from '../../../components/icons/NusantaraIcons';
import Button from '../../../components/ui/Button';
import PhotoUpload from '../../../components/ui/PhotoUpload';
import { TablePagination } from '../../../components/ui/TablePagination';
import network from '../../../libs/network';

interface ProfileData {
  profile: {
    id: string;
    slug: string;
    public_name: string;
    title: string;
    bio: string;
    community: string;
    region: string;
    domains: string[];
    hourly_rate: number;
    image_url: string;
    status: string;
    is_published: boolean;
  };
  claims: Array<{
    id: string;
    domain: string;
    basis: string;
    description: string;
    verification_status: string;
  }>;
  draft: {
    id: string;
    version: number;
    status: string;
    review_notes: string | null;
    data: { title?: string; bio?: string; imageUrl?: string; image_url?: string };
  } | null;
}

export const RuangPakarProfil: React.FC = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data } = useQuery<ProfileData>({
    queryKey: ['expert-profile-details'],
    queryFn: async () => {
      const res = await network.get('/expert/profile');
      return res.data;
    },
  });

  // Sinkronisasi data profil dan draf ke state form saat data dimuat (termasuk dari cache)
  useEffect(() => {
    if (data?.profile) {
      setTitle(data.draft?.data?.title ?? data.profile.title ?? '');
      setBio(data.draft?.data?.bio ?? data.profile.bio ?? '');
      setImageUrl(
        data.draft?.data?.imageUrl ??
        data.draft?.data?.image_url ??
        data.profile.image_url ??
        null
      );
    }
  }, [data]);

  // Handler saat foto baru diunggah: simpan draf dan sinkronkan avatar secara reaktif
  const handlePhotoChange = async (url: string | null) => {
    setImageUrl(url);
    try {
      await network.put('/expert/profile', {
        title: title || data?.profile?.title,
        bio: bio || data?.profile?.bio,
        image_url: url,
      });
      if (url) {
        await network.put('/me/profile', { avatar_url: url }).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ['expert-profile-details'] });
      queryClient.invalidateQueries({ queryKey: ['me-dashboard'] });
      setNotice('Foto potret berhasil diperbarui.');
      setTimeout(() => setNotice(''), 3000);
    } catch {
      // Jika auto-save gagal, nilai tetap ada di state imageUrl untuk disimpan melalui tombol "Simpan Draf"
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await network.put('/expert/profile', { title, bio, image_url: imageUrl });
      if (imageUrl) {
        await network.put('/me/profile', { avatar_url: imageUrl }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-profile-details'] });
      queryClient.invalidateQueries({ queryKey: ['me-dashboard'] });
      setNotice('Draf profil tersimpan. Profil di katalog belum berubah sampai kurasi selesai.');
      setTimeout(() => setNotice(''), 3000);
    },
  });

  const submitProfileMutation = useMutation({
    mutationFn: async () => network.post('/expert/profile/submit'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-profile-details'] });
      setNotice('Perubahan profil dikirim ke antrean kurasi budaya.');
    },
    onError: () => setNotice('Simpan draf terlebih dahulu sebelum mengirim kurasi.'),
  });

  const profile = data?.profile;
  const claims = data?.claims || [];

  // Claims Search & Filter
  const [claimSearch, setClaimSearch] = useState('');
  const [claimDomainFilter, setClaimDomainFilter] = useState('all');
  const [claimPage, setClaimPage] = useState(1);
  const [claimPageSize, setClaimPageSize] = useState(5);

  const availableDomains = Array.from(new Set(claims.map((c) => c.domain)));

  // Reset page when filter or search changes
  useEffect(() => {
    setClaimPage(1);
  }, [claimSearch, claimDomainFilter, claimPageSize]);

  const filteredClaims = claims.filter((c) => {
    if (claimDomainFilter !== 'all' && c.domain !== claimDomainFilter) return false;
    if (claimSearch.trim()) {
      const q = claimSearch.toLowerCase();
      const matchDomain = c.domain?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchBasis = c.basis?.toLowerCase().includes(q);
      if (!matchDomain && !matchDesc && !matchBasis) return false;
    }
    return true;
  });

  const claimTotalPages = Math.ceil(filteredClaims.length / claimPageSize) || 1;
  const paginatedClaims = filteredClaims.slice(
    (claimPage - 1) * claimPageSize,
    claimPage * claimPageSize
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dce7f5] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#17294b] tracking-wide">
            Profil Publik & Verifikasi Adat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola profil keabsahan adat yang ditampilkan pada katalog publik KataNusa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile?.slug && (
            <Link
              to={`/experts/${profile.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#dce7f5] text-xs font-semibold text-slate-700 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat di Katalog</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => updateProfileMutation.mutate()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Draf</span>
          </button>
          {data?.draft && ['draft', 'revision_required'].includes(data.draft.status) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => submitProfileMutation.mutate()}
              disabled={submitProfileMutation.isPending}
              className="text-xs"
            >
              Ajukan Kurasi
            </Button>
          ) : null}
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {data?.draft ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-xs">
          Draf versi {data.draft.version}: <strong>{data.draft.status.replace(/_/g, ' ')}</strong>
          {data.draft.review_notes ? ` · Catatan kurator: ${data.draft.review_notes}` : ''}
        </div>
      ) : null}

      {/* Identitas Pakar Terverifikasi */}
      <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
          <SuryaMajapahitIcon className="w-4 h-4 text-[#b91c1c]" />
          <h3 className="text-sm font-bold text-[#17294b] uppercase tracking-wider">
            Status Keabsahan Kepakaran
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#f8fbff] border border-[#dce7f5] space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Nama Otoritatif:</span>
            <span className="font-bold text-[#17294b] text-sm">{profile?.public_name}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8fbff] border border-[#dce7f5] space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Afiliasi Tradisi Adat:</span>
            <span className="font-bold text-[#b91c1c] text-sm">
              Suku {profile?.community} ({profile?.region})
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8fbff] border border-[#dce7f5] space-y-1">
            <span className="text-slate-500 block text-[11px] font-medium">Status Dewan Adat:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-700 text-xs uppercase">Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Foto Profil & Potret Budaya Pakar */}
      <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
          <Camera className="w-4 h-4 text-[#b91c1c]" />
          <h3 className="text-sm font-bold text-[#17294b] uppercase tracking-wider">
            Foto Profil & Potret Budaya
          </h3>
        </div>

        <PhotoUpload
          value={imageUrl}
          onChange={handlePhotoChange}
          label="Foto Potret Resmi Pakar"
          hint="Foto potret ini akan ditampilkan pada direktori publik pakar budaya, kartu sesi bimbingan, serta ruang konsultasi."
          shape="portrait"
        />
      </div>

      {/* Editor Gelar & Biografi */}
      <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
          <User className="w-4 h-4 text-[#b91c1c]" />
          <h3 className="text-sm font-bold text-[#17294b] uppercase tracking-wider">
            Gelar Kepakaran & Biografi Praktik
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Gelar atau Peran Keilmuan Adat:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#f8fbff] border border-[#dce7f5] rounded-xl px-3.5 py-2.5 text-xs text-[#17294b] focus:bg-white focus:outline-hidden focus:border-[#b91c1c] transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">
              Biografi Ringkas & Rekam Jejak Tradisi:
            </label>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#f8fbff] border border-[#dce7f5] rounded-xl p-3.5 text-xs text-[#17294b] leading-relaxed focus:bg-white focus:outline-hidden focus:border-[#b91c1c] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Klaim Budaya Terverifikasi */}
      <div className="rounded-2xl bg-white border border-[#dce7f5] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#b91c1c]" />
            <h3 className="text-sm font-bold text-[#17294b] uppercase tracking-wider">
              Klaim Budaya & Silsilah Keabsahan
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Total <strong className="text-[#17294b]">{filteredClaims.length}</strong> klaim terverifikasi
          </span>
        </div>

        {/* Search & Domain Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f0f5fc] rounded-xl border border-[#dce7f5] w-fit">
            <button
              type="button"
              onClick={() => setClaimDomainFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                claimDomainFilter === 'all'
                  ? 'bg-[#17294b] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#17294b]'
              }`}
            >
              Semua Domain ({claims.length})
            </button>
            {availableDomains.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setClaimDomainFilter(domain)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  claimDomainFilter === domain
                    ? 'bg-[#17294b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#17294b]'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari domain atau uraian klaim..."
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#f8fbff] border border-[#dce7f5] rounded-xl text-xs text-[#17294b] placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-[#b91c1c] transition-all"
            />
            {claimSearch && (
              <button
                type="button"
                onClick={() => setClaimSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredClaims.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Domain Keahlian</th>
                    <th className="py-3 px-3">Dasar Keabsahan Adat</th>
                    <th className="py-3 px-3">Uraian Bukti & Silsilah</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-xs">
                  {paginatedClaims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-[#17294b]">
                        {c.domain}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap capitalize text-[#b91c1c] font-medium">
                        {c.basis.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-xs leading-relaxed max-w-sm">
                        {c.description}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Terverifikasi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={claimPage}
              totalPages={claimTotalPages}
              totalItems={filteredClaims.length}
              pageSize={claimPageSize}
              onPageChange={setClaimPage}
              onPageSizeChange={setClaimPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            {claimSearch
              ? 'Tidak ada klaim budaya yang cocok dengan pencarian Anda.'
              : 'Klaim keahlian utama terhubung secara langsung melalui hasil kurasi dewan adat.'}
          </div>
        )}
      </div>
    </div>
  );
};
