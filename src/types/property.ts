export interface Property {
  id: string;
  property_code: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  transaction_type: 'sale' | 'rent';
  property_type: string;
  city_region: string;
  district?: string;
  address?: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  floor_number?: number;
  terraces: number;
  construction_type?: string;
  condition_type?: string;
  heating?: string;
  exposure?: string;
  year_built?: number;
  furnishing_level?: string;
  has_elevator: boolean;
  has_garage: boolean;
  has_southern_exposure: boolean;
  new_construction: boolean;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
  documents?: PropertyDocument[];
}

interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  image_path?: string;
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
  is_main: boolean;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

interface PropertyDocument {
  id: string;
  filename: string;
  size: number;
  url: string;
}

export interface PropertyFormData {
  title: string;
  property_code?: string;
  description: string;
  price: number;
  currency: string;
  transaction_type: 'sale' | 'rent';
  property_type: string;
  city_region: string;
  district: string;
  address: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  floor_number?: number;
  terraces: number;
  construction_type: string;
  condition: string;
  heating: string;
  year_built?: number;
  furnishing_level: string;
  has_elevator: boolean;
  has_garage: boolean;
  has_southern_exposure: boolean;
  new_construction: boolean;
  featured: boolean;
  active: boolean;
  pricing_mode?: 'total' | 'per_month' | 'per_sqm';
}