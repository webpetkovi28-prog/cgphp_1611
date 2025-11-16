export interface SearchFormData {
  transactionType: 'sale' | 'rent';
  keyword: string;
  region: string;
  settlement: string;
  propertyTypes: string[];
  selectedDistricts: string[];
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  rooms: string[];
  floors: { min: string; max: string };
  bedrooms: string;
  bathrooms: string;
  terrace: string;
  constructionType: string;
  condition: string;
  hasElevator: boolean;
  hasGarage: boolean;
  hasSouthernExposure: boolean;
  newConstruction: boolean;
  gatedCommunity: boolean;
  advancedSearchCode: string;
  yearBuilt: { min: string; max: string };
  furnishingLevel: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  active: boolean;
}

export interface DropdownStates {
  region: boolean;
  settlement: boolean;
  propertyType: boolean;
  districts: boolean;
  constructionType: boolean;
  condition: boolean;
  heating: boolean;
  furnishingLevel: boolean;
}