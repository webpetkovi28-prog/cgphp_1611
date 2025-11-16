import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SearchDropdownProps {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  label,
  value,
  isOpen,
  onToggle,
  children,
  className = "w-48"
}) => {
  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <button
        onClick={onToggle}
        className={`${className} px-4 py-3 bg-white border border-gray-300 rounded-xl text-left flex items-center justify-between hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
      >
        <span className="text-gray-800 font-medium">{value}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-[99999] mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto min-w-full">
          {children}
        </div>
      )}
    </div>
  );
};