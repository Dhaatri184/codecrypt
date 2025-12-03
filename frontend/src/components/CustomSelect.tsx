import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option...',
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-green-900 border border-green-600 rounded-lg px-4 py-2 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400 flex justify-between items-center"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                backgroundColor: option.value === value ? '#ffffff' : '#0f172a',
                color: option.value === value ? '#0f172a' : '#ffffff',
                fontWeight: option.value === value ? 'bold' : 'normal'
              }}
              className="px-4 py-3 cursor-pointer transition-all duration-200 border-b border-slate-700 last:border-b-0 hover:bg-slate-800"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
