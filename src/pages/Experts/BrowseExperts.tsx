import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from 'use-debounce';
import ExpertImage from '../../components/experts/ExpertImage.tsx';
import FilterDropdown from '../../components/experts/FilterDropdown.tsx';
import ScopedBadges from '../../components/experts/ScopedBadges.tsx';
import Footer from '../../components/layout/Footer.tsx';
import Navbar from '../../components/layout/Navbar';
import { experts as localStaticExperts } from '../../data/experts.ts';
import network from '../../libs/network.ts';

const ITEMS_PER_PAGE = 12;

// Sesuai prinsip R2-1 & Cutover #9: unpublish real-person entries yang belum verified secara hukum
// Gunakan persona virtual terverifikasi sebagai baseline aman
const verifiedBaseExperts = localStaticExperts
  .filter((expert) => expert.isAi)
  .map((expert) => ({ ...expert, realExpertReferences: [] }));

const BrowseExpertsPage = (): JSX.Element => {
  const navigate = useNavigate();

  const [allExperts, setAllExperts] = useState(verifiedBaseExperts);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSuku, setSelectedSuku] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Sort state: 'asc' for A-Z, 'desc' for Z-A
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Ambil profil pakar terkelola dari server (governed profiles)
  useEffect(() => {
    network
      .get('/experts')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAllExperts(res.data);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat katalog pakar dari server, menggunakan basis aman:', err);
      });
  }, []);

  // Extract unique values for filters
  const uniqueRoles = useMemo(() => {
    const roles = allExperts.map((expert) => expert.role);
    return Array.from(new Set(roles)).sort();
  }, [allExperts]);

  const uniqueSuku = useMemo(() => {
    const suku = allExperts
      .map((expert) => expert.suku)
      .filter((s): s is string => s !== undefined);
    return Array.from(new Set(suku)).sort();
  }, [allExperts]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = allExperts.flatMap((expert) => expert.specialties);
    return Array.from(new Set(specialties)).sort();
  }, [allExperts]);

  // Memoized filter and sort - avoids state synchronization lag & eliminates redundant renders
  const filteredExperts = useMemo(() => {
    let filtered = allExperts;

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((expert) => {
        return (
          expert.name.toLowerCase().includes(q) ||
          expert.role.toLowerCase().includes(q) ||
          (expert.suku && expert.suku.toLowerCase().includes(q)) ||
          expert.specialties.some((s) => s.toLowerCase().includes(q))
        );
      });
    }

    if (selectedRole) {
      filtered = filtered.filter((expert) => expert.role === selectedRole);
    }

    if (selectedSuku) {
      filtered = filtered.filter((expert) => expert.suku === selectedSuku);
    }

    if (selectedSpecialty) {
      filtered = filtered.filter((expert) =>
        expert.specialties.includes(selectedSpecialty),
      );
    }

    return [...filtered].sort((a, b) => {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
  }, [
    allExperts,
    debouncedSearchQuery,
    selectedRole,
    selectedSuku,
    selectedSpecialty,
    sortOrder,
  ]);

  // Reset pagination to first page when filtering or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    selectedRole,
    selectedSuku,
    selectedSpecialty,
    sortOrder,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExperts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExperts = filteredExperts.slice(startIndex, endIndex);

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1E315A]">
      {/* Header Section with different styling than Home */}
      <div className="bg-primary-dark relative h-[400px] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-600 to-blue-400">
        <Navbar isWhite />
        <div className="absolute inset-0 bg-center opacity-10 bg-[url('/assets/bg-experts-header.webp')] z-0"></div>
        <div className="relative z-10 mt-10 px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 font-itim">
            Direktori Pakar &amp; Penjaga Tradisi
          </h1>
          <p className="text-blue-100 max-w-xl mx-auto text-sm">
            Temukan budayawan terverifikasi resmi dan AI Persona Budaya dari seluruh kepulauan Nusantara.
          </p>
        </div>
      </div>

      {/* Search & Filter Section (Overlapping Header) */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, keahlian, atau daerah asal..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:gap-3">
            <FilterDropdown
              label={selectedRole || 'Semua Keahlian'}
              options={uniqueRoles}
              selectedValue={selectedRole}
              onChange={setSelectedRole}
            />
            <FilterDropdown
              label={selectedSuku || 'Asal Daerah'}
              options={uniqueSuku}
              selectedValue={selectedSuku}
              onChange={setSelectedSuku}
            />
            <FilterDropdown
              label={selectedSpecialty || 'Topik'}
              options={uniqueSpecialties}
              selectedValue={selectedSpecialty}
              onChange={setSelectedSpecialty}
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-300 text-sm">
            Menampilkan {startIndex + 1}-
            {Math.min(endIndex, filteredExperts.length)} dari{' '}
            {filteredExperts.length} pakar terverifikasi.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            Urutkan:{' '}
            <span
              className="text-amber-400 font-bold cursor-pointer hover:underline transition-colors"
              onClick={handleSortToggle}
            >
              {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentExperts.map((expert) => (
            <div key={expert.id} className="flex flex-col gap-2">
              <ExpertImage
                alt={expert.name}
                image={expert.image}
                name={expert.name}
                caption={expert.role}
                isAi={expert.isAi}
                onClick={() => navigate(`/experts/${expert.id}`)}
              />
              {'badges' in expert && expert.badges ? (
                <div className="px-1 pt-1">
                  <ScopedBadges badges={expert.badges as Record<string, boolean>} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border border-white/20 text-white ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border border-white/20 text-white ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BrowseExpertsPage;
