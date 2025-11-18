import React, { useRef, useEffect } from 'react';
import { Search, MapPin, Filter, X, Home } from 'lucide-react';
import { SearchDropdown } from './SearchDropdown';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { AdvancedSearch } from './AdvancedSearch';
import { useSearchForm } from '../hooks/useSearchForm';
import { REGIONS_AND_CITIES, PROPERTY_TYPES, getAllCities, getDistrictsForCity, normalizeLocationInput } from '../data/constants';

interface SearchFormProps {
  onSearch?: (filters: any) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const {
    formData,
    dropdowns,
    showAdvanced,
    updateFormData,
    toggleDropdown,
    closeDropdown,
    clearAllFilters,
    handleSearch: defaultHandleSearch,
    setShowAdvanced
  } = useSearchForm();

  const handleSearch = () => {
    // Convert form data to API parameters
    const searchParams: any = {};
    
    if (formData.transactionType) {
      searchParams.transaction_type = formData.transactionType;
    }
    
    if (formData.keyword && formData.keyword.trim()) {
      searchParams.keyword = formData.keyword.trim();
    }
    
    // Use settlement (city) as primary location, fallback to region
    if (formData.settlement && formData.settlement !== 'Всички') {
      searchParams.city_region = formData.settlement;
    } else if (formData.region && formData.region !== 'Всички') {
      // Extract city name from region (e.g., "София (столица)" -> "София")
      const cityMatch = formData.region.match(/^([^(]+)/);
      if (cityMatch) {
        searchParams.city_region = cityMatch[1].trim();
      }
    }
    
    if (formData.propertyTypes.length > 0) {
      searchParams.property_type = formData.propertyTypes[0]; // Take first selected
    }
    
    if (formData.selectedDistricts.length > 0) {
      // Normalize the district before sending to API
      searchParams.district = normalizeLocationInput(formData.selectedDistricts[0]); // Take first selected
    }
    
    if (formData.priceMin) {
      searchParams.price_min = formData.priceMin;
    }
    
    if (formData.priceMax) {
      searchParams.price_max = formData.priceMax;
    }
    
    if (formData.areaMin) {
      searchParams.area_min = formData.areaMin;
    }
    
    if (formData.areaMax) {
      searchParams.area_max = formData.areaMax;
    }
    
    if (formData.newConstruction) {
      searchParams.new_construction = 'true';
    }
    
    if (formData.hasElevator) {
      searchParams.has_elevator = 'true';
    }
    
    if (formData.hasGarage) {
      searchParams.has_garage = 'true';
    }

    if (formData.gatedCommunity) {
      searchParams.gated_community = 'true';
    }
    
    // Advanced search parameters
    if (formData.advancedSearchCode) {
      searchParams.id = formData.advancedSearchCode;
    }
    
    if (formData.constructionType) {
      searchParams.construction_type = formData.constructionType;
    }
    
    if (formData.condition) {
      searchParams.condition_type = formData.condition;
    }
    
    if (formData.heating) {
      searchParams.heating = formData.heating;
    }
    
    if (formData.yearBuilt.min) {
      searchParams.year_built_min = formData.yearBuilt.min;
    }
    
    if (formData.yearBuilt.max) {
      searchParams.year_built_max = formData.yearBuilt.max;
    }
    
    if (formData.bedrooms) {
      searchParams.bedrooms = formData.bedrooms;
    }
    
    if (formData.bathrooms) {
      searchParams.bathrooms = formData.bathrooms;
    }
    
    if (formData.terrace) {
      searchParams.terraces = formData.terrace;
    }
    
    console.log('Search parameters:', searchParams);
    
    // Call the search handler with parameters
    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Default behavior - just log the search
      console.log('No onSearch handler provided, search params:', searchParams);
    }
  };

  const regionRef = useRef<HTMLDivElement>(null);
  const settlementRef = useRef<HTMLDivElement>(null);
  const propertyTypesRef = useRef<HTMLDivElement>(null);
  const districtsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        closeDropdown('region');
      }
      if (settlementRef.current && !settlementRef.current.contains(event.target as Node)) {
        closeDropdown('settlement');
      }
      if (propertyTypesRef.current && !propertyTypesRef.current.contains(event.target as Node)) {
        closeDropdown('propertyType');
      }
      if (districtsRef.current && !districtsRef.current.contains(event.target as Node)) {
        closeDropdown('districts');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  const handlePropertyTypeChange = (type: string) => {
    const updatedTypes = formData.propertyTypes.includes(type)
      ? formData.propertyTypes.filter(t => t !== type)
      : [...formData.propertyTypes, type];
    updateFormData({ propertyTypes: updatedTypes });
  };

  const handleDistrictChange = (district: string) => {
    // Normalize the district input to handle aliases
    const normalizedDistrict = normalizeLocationInput(district);
    const updatedDistricts = formData.selectedDistricts.includes(normalizedDistrict)
      ? formData.selectedDistricts.filter(d => d !== normalizedDistrict)
      : [...formData.selectedDistricts, normalizedDistrict];
    updateFormData({ selectedDistricts: updatedDistricts });
  };

  const handleRegionChange = (region: string) => {
    let mainCity = 'Всички';
    
    // Auto-populate main city for each region
    if (region !== 'Всички') {
      const cities = REGIONS_AND_CITIES[region] || [];
      if (cities.length > 0) {
        // Find the main city (usually the first one or the one matching region name)
        const regionMainCity = cities.find(city => 
          city.toLowerCase().includes(region.split(' ')[0]?.toLowerCase() || region.toLowerCase())
        );
        mainCity = regionMainCity || cities[0]; // Use matching city or first city
      }
    }
    
    updateFormData({ 
      region: region,
      settlement: mainCity,
      selectedDistricts: [] 
    });
    closeDropdown('region');
  };

  const handleSettlementChange = (settlement: string) => {
    updateFormData({ 
      settlement: settlement,
      selectedDistricts: [] 
    });
    closeDropdown('settlement');
  };

  // Get available settlements for selected region
  const getAvailableSettlements = () => {
    if (!formData.region || formData.region === 'Всички') {
      return [];
    }
    return REGIONS_AND_CITIES[formData.region] || [];
  };

  const availableSettlements = getAvailableSettlements();
  const availableDistricts = formData.settlement ? getDistrictsForCity(formData.settlement) : [];

  // Set default region to Sofia on first load
  React.useEffect(() => {
    if (formData.region === 'Всички') {
      updateFormData({ 
        region: 'София (столица)',
        settlement: 'София'
      });
    }
  }, []);

  return (
    <div className="w-full">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative z-10">

        {/* Transaction Type Toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => updateFormData({ transactionType: 'sale' })}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              formData.transactionType === 'sale'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            Продажба
          </button>
          <button
            onClick={() => updateFormData({ transactionType: 'rent' })}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              formData.transactionType === 'rent'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Наем
          </button>
        </div>

        {/* Main Search Form */}
        <div className="space-y-6 mb-8">
          {/* Location and Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Region */}
          <div ref={regionRef}>
            <SearchDropdown
              label="Област"
              value={formData.region || 'Всички'}
              isOpen={dropdowns.region}
              onToggle={() => toggleDropdown('region')}
              className="w-full"
            >
              <div className="p-2">
                <button
                  onClick={() => handleRegionChange('Всички')}
                  className={`w-full px-6 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                    formData.region === 'Всички' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Всички области
                </button>
                {Object.keys(REGIONS_AND_CITIES).map(region => (
                  <button
                    key={region}
                    onClick={() => handleRegionChange(region)}
                    className={`w-full px-6 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                      formData.region === region ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </SearchDropdown>
          </div>

          {/* Settlement */}
          <div ref={settlementRef}>
            <SearchDropdown
              label="Населено място"
              value={formData.settlement || 'Всички'}
              isOpen={dropdowns.settlement}
              onToggle={() => toggleDropdown('settlement')}
              className="w-full"
            >
              <div className="p-2">
                <button
                  onClick={() => handleSettlementChange('Всички')}
                  className={`w-full px-6 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                    formData.settlement === 'Всички' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Всички места
                </button>
                {availableSettlements.map(settlement => (
                  <button
                    key={settlement}
                    onClick={() => handleSettlementChange(settlement)}
                    className={`w-full px-6 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                      formData.settlement === settlement ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {settlement}
                  </button>
                ))}
              </div>
            </SearchDropdown>
          </div>

          {/* Property Type */}
          <div ref={propertyTypesRef}>
            <MultiSelectDropdown
              label="Тип имот"
              selectedItems={formData.propertyTypes}
              onToggle={() => toggleDropdown('propertyType')}
              onItemChange={handlePropertyTypeChange}
              isOpen={dropdowns.propertyType}
              items={PROPERTY_TYPES}
              placeholder="Всички типове"
              className="w-full"
            />
          </div>

          {/* Districts */}
          <div ref={districtsRef}>
            <MultiSelectDropdown
              label="Квартал"
              selectedItems={formData.selectedDistricts}
              onToggle={() => toggleDropdown('districts')}
              onItemChange={handleDistrictChange}
              isOpen={dropdowns.districts}
              items={availableDistricts}
              placeholder="Всички квартали"
              className="w-full"
              columns={3}
            />
          </div>
        </div>

        {/* Keyword Search and Quick Filters - Same Level */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
          {/* Keyword Search */}
          <div className="w-full md:w-64">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Търсене по ключова дума</label>
            <input
              type="text"
              value={formData.keyword || ''}
              onChange={(e) => updateFormData({ keyword: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Търсене в заглавие, описание, квартал..."
              autoComplete="off"
              name="keyword"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-8 w-full">
            <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.newConstruction}
              onChange={(e) => updateFormData({ newConstruction: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">Ново строителство</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasElevator}
              onChange={(e) => updateFormData({ hasElevator: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">Асансьор</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasGarage}
              onChange={(e) => updateFormData({ hasGarage: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">Гараж</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.gatedCommunity}
              onChange={(e) => updateFormData({ gatedCommunity: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">Затворен комплекс</span>
          </label>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            {/* Advanced Search Toggle and Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Advanced Search Toggle - Left side on desktop */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors hover:bg-blue-50 px-4 py-2 rounded-lg"
              >
                <Filter className="w-4 h-4" />
                {showAdvanced ? 'Скрий разширеното търсене' : 'Разширено търсене'}
              </button>
              
              {/* Action Buttons - Right side on desktop */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-red-600 hover:text-red-700 font-medium transition-colors hover:bg-red-50 rounded-xl"
                >
                  <X className="w-4 h-4" />
                  Изчистване
                </button>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Search className="w-5 h-5" />
                  Покажи резултатите
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Search */}
          {showAdvanced && (
            <AdvancedSearch
              formData={formData}
              onUpdate={updateFormData}
            />
          )}
        </div>
      </div>
    </div>
  );
};