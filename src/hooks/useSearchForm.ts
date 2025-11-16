import { useState } from 'react';
import { SearchFormData, DropdownStates } from '../types';

const initialFormData: SearchFormData = {
  transactionType: 'sale',
  keyword: '',
  region: 'София (столица)',
  settlement: 'София',
  propertyTypes: [],
  selectedDistricts: [],
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  rooms: [],
  floors: { min: '', max: '' },
  bedrooms: '',
  bathrooms: '',
  terrace: '',
  constructionType: '',
  condition: '',
  exposure: '',
  heating: '',
  hasElevator: false,
  hasGarage: false,
  hasSouthernExposure: false,
  newConstruction: false,
  gatedCommunity: false,
  advancedSearchCode: '',
  yearBuilt: { min: '', max: '' },
  furnishingLevel: '',
};

const initialDropdownStates: DropdownStates = {
  region: false,
  settlement: false,
  propertyType: false,
  districts: false,
  constructionType: false,
  condition: false,
  heating: false,
  furnishingLevel: false
};

export const useSearchForm = () => {
  const [formData, setFormData] = useState<SearchFormData>(initialFormData);
  const [dropdowns, setDropdowns] = useState<DropdownStates>(initialDropdownStates);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFormData = (updates: Partial<SearchFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleDropdown = (key: keyof DropdownStates) => {
    setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeDropdown = (key: keyof DropdownStates) => {
    setDropdowns(prev => ({ ...prev, [key]: false }));
  };

  const clearAllFilters = () => {
    setFormData(initialFormData);
    setDropdowns(initialDropdownStates);
    setShowAdvanced(false);
  };

  const handleSearch = () => {
    console.log('Търсене с параметри:', formData);
    // Here you would typically make an API call or handle the search
  };

  return {
    formData,
    dropdowns,
    showAdvanced,
    updateFormData,
    toggleDropdown,
    closeDropdown,
    clearAllFilters,
    handleSearch,
    setShowAdvanced
  };
};