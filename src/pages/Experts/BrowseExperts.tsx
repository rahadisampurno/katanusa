import { Search, Filter } from 'lucide-react';
import { useCallback, useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useDebounce } from 'use-debounce';
import ExpertImage from '../../components/experts/ExpertImage.tsx';
import Footer from '../../components/layout/Footer.tsx';
import Navbar from '../../components/layout/Navbar';
import { experts } from '../../data/experts.ts';

const BrowseExpertsPage = (): JSX.Element => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExperts, setFilteredExperts] = useState(experts);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const handleSearch = useCallback(() => {
    if (debouncedSearchQuery) {
      const filtered = experts.filter((expert) => {
        return (
          expert.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          expert.role.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      });
      setFilteredExperts(filtered);
    } else {
      setFilteredExperts(experts);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['Semua Keahlian', 'Asal Daerah', 'Topik'].map((filter) => (
              <button
                key={filter}
                className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
              >
                {filter} <Filter className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Menampilkan {filteredExperts.length} Pakar dari {experts.length}{' '}
            pakar.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Urutkan:{' '}
            <span className="text-black font-bold cursor-pointer">Populer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredExperts.map((expert) => (
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
      </div>
      <Footer />
    </div>
  );
};

export default BrowseExpertsPage;
