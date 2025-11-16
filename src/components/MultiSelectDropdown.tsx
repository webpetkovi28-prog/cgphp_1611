import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  selectedItems: string[];
  onToggle: () => void;
  onItemChange: (item: string) => void;
  isOpen: boolean;
  items: string[];
  placeholder: string;
  className?: string;
  columns?: number;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  selectedItems,
  onToggle,
  onItemChange,
  isOpen,
  items,
  placeholder,
  className = "w-48",
  columns = 1
}) => {
  const getDisplayText = () => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1) return selectedItems[0];
    return `${selectedItems.length} избрани`;
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <button
        onClick={onToggle}
        className={`${className} px-4 py-3 bg-white border border-gray-300 rounded-xl text-left flex items-center justify-between hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
      >
        <span className="text-gray-800 font-medium truncate">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-[99999] mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto min-w-full">
          <div className="grid grid-cols-1 gap-2">
            {items.map(item => (
              <label
                key={item}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={() => onItemChange(item)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};