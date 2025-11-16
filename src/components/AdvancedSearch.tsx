import React from 'react';
import { SearchFormData } from '../types';
import { CONSTRUCTION_TYPES, CONDITIONS, HEATING_TYPES, FURNISHING_LEVELS } from '../data/constants';

interface AdvancedSearchProps {
  formData: SearchFormData;
  onUpdate: (updates: Partial<SearchFormData>) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ formData, onUpdate }) => {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Price Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Цена (€)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="€ От"
              value={formData.priceMin}
              onChange={(e) => onUpdate({ priceMin: e.target.value })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input
              type="text"
              placeholder="€ До"
              value={formData.priceMax}
              onChange={(e) => onUpdate({ priceMax: e.target.value })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Area Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Площ (кв.м)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="От"
              value={formData.areaMin}
              onChange={(e) => onUpdate({ areaMin: e.target.value })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input
              type="text"
              placeholder="До"
              value={formData.areaMax}
              onChange={(e) => onUpdate({ areaMax: e.target.value })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Property Code */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Код на имота</label>
          <input
            type="text"
            placeholder="Въведете код"
            value={formData.advancedSearchCode}
            onChange={(e) => onUpdate({ advancedSearchCode: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Construction Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Вид строителство</label>
          <select
            value={formData.constructionType}
            onChange={(e) => onUpdate({ constructionType: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Изберете вид</option>
            {CONSTRUCTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Състояние</label>
          <select
            value={formData.condition}
            onChange={(e) => onUpdate({ condition: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Изберете състояние</option>
            {CONDITIONS.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
        </div>

        {/* Year Built */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Година на строителство</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="От"
              value={formData.yearBuilt.min}
              onChange={(e) => onUpdate({ yearBuilt: { ...formData.yearBuilt, min: e.target.value } })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input
              type="text"
              placeholder="До"
              value={formData.yearBuilt.max}
              onChange={(e) => onUpdate({ yearBuilt: { ...formData.yearBuilt, max: e.target.value } })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Floor */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Етаж</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="От"
              value={formData.floors.min}
              onChange={(e) => onUpdate({ floors: { ...formData.floors, min: e.target.value } })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input
              type="text"
              placeholder="До"
              value={formData.floors.max}
              onChange={(e) => onUpdate({ floors: { ...formData.floors, max: e.target.value } })}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Спални</label>
          <input
            type="text"
            placeholder="Брой спални"
            value={formData.bedrooms}
            onChange={(e) => onUpdate({ bedrooms: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Бани</label>
          <input
            type="text"
            placeholder="Брой бани"
            value={formData.bathrooms}
            onChange={(e) => onUpdate({ bathrooms: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Terraces */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Тераси</label>
          <input
            type="text"
            placeholder="Брой тераси"
            value={formData.terrace}
            onChange={(e) => onUpdate({ terrace: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Furnishing Level */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Ниво на обзавеждане</label>
          <select
            value={formData.furnishingLevel}
            onChange={(e) => onUpdate({ furnishingLevel: e.target.value })}
            className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Изберете ниво</option>
            {FURNISHING_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};