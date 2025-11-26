import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from 'use-debounce';
import ExpertImage from '../../components/experts/ExpertImage.tsx';
import FilterDropdown from '../../components/experts/FilterDropdown.tsx';
import Footer from '../../components/layout/Footer.tsx';
import Navbar from '../../components/layout/Navbar';
import { experts } from '../../data/experts.ts';

const ITEMS_PER_PAGE = 12;

const BrowseExpertsPage = (): JSX.Element => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExperts, setFilteredExperts] = useState(experts);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSuku, setSelectedSuku] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  // Sort state: 'asc' for A-Z, 'desc' for Z-A
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // Extract unique values for filters
  const uniqueRoles = useMemo(() => {
    const roles = experts.map((expert) => expert.role);
    return Array.from(new Set(roles)).sort();
  }, []);

  const uniqueSuku = useMemo(() => {
    const suku = experts
      .map((expert) => expert.suku)
      .filter((s): s is string => s !== undefined);
    return Array.from(new Set(suku)).sort();
  }, []);

  const uniqueSpecialties = useMemo(() => {
    const specialties = experts.flatMap((expert) => expert.specialties);
    return Array.from(new Set(specialties)).sort();
  }, []);

  const handleSearch = useCallback(() => {
    let filtered = experts;

    // Apply search query filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter((expert) => {
        return (
          expert.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          expert.role.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      });
    }

    // Apply role filter (Semua Keahlian)
    if (selectedRole) {
      filtered = filtered.filter((expert) => expert.role === selectedRole);
    }

    // Apply suku filter (Asal Daerah)
    if (selectedSuku) {
      filtered = filtered.filter((expert) => expert.suku === selectedSuku);
    }

    // Apply specialty filter (Topik)
    if (selectedSpecialty) {
      filtered = filtered.filter((expert) =>
        expert.specialties.includes(selectedSpecialty),
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    setFilteredExperts(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [
    debouncedSearchQuery,
    selectedRole,
    selectedSuku,
    selectedSpecialty,
    sortOrder,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSearch();
  }, [
    debouncedSearchQuery,
    selectedRole,
    selectedSuku,
    selectedSpecialty,
    sortOrder,
    handleSearch,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExperts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExperts = filteredExperts.slice(startIndex, endIndex);

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortToggle = (): void => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handlePrevious = (): void => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = (): void => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with different styling than Home */}
      <div className="bg-primary-dark relative h-[400px] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-600 to-blue-400">
        <Navbar />
        <div className="absolute inset-0 bg-center opacity-10 bg-[url('/assets/bg-experts-header.png')]  z-0"></div>
        <div className="relative z-10 text-center mt-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Direktori Pakar Budaya
          </h1>
          <p className="text-blue-200 max-w-xl mx-auto">
            Cari dan temukan ahli budaya yang sesuai dengan minat dan kebutuhan
            Anda dari seluruh Indonesia.
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
              placeholder="Cari berdasarkan nama, keahlian atau bidang"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 w-full md:w-auto pb-2 md:pb-0">
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
          <p className="text-gray-600">
            Menampilkan {startIndex + 1}-
            {Math.min(endIndex, filteredExperts.length)} dari{' '}
            {filteredExperts.length} pakar.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Urutkan:{' '}
            <span
              className="text-black font-bold cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleSortToggle}
            >
              {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentExperts.map((expert) => (
            <ExpertImage
              key={expert.id}
              alt={expert.name}
              image={expert.image}
              name={expert.name}
              caption={expert.role}
              isAi={expert.isAi}
              onClick={() => navigate(`/experts/${expert.id}`)}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === -1) {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BrowseExpertsPage;
