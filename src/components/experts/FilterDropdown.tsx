import { Filter, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type JSX } from 'react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const FilterDropdown = ({
  label,
  options,
  selectedValue,
  onChange,
}: FilterDropdownProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string): void => {
    onChange(value);
    setIsOpen(false);
  };

  const isActive = selectedValue !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 border rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
          isActive
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {label}
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4" />
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-0 left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
          <button
            onClick={() => handleSelect('')}
            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
              selectedValue === '' ? 'bg-blue-50 text-blue-700 font-medium' : ''
            }`}
          >
            Semua
          </button>
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-t border-gray-100 ${
                selectedValue === option
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
