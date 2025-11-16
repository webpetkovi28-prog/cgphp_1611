// API Service for ConsultingG Real Estate
// Unified API base URL configuration

const API_BASE = (import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') || '/api');

// Force fallback mode only in unsupported environments (not in Replit development)
const USE_FALLBACK = window.location.hostname.includes('webcontainer') || window.location.hostname.includes('stackblitz');

console.log('API_BASE configured as:', API_BASE, 'Fallback mode:', USE_FALLBACK);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  error?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface Property {
  id: string;
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
  gated_community: boolean;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  image_path?: string;
  alt_text?: string;
  sort_order: number;
  is_main: boolean;
  created_at: string;
  url: string;
  thumbnail_url: string;
  file_size?: number;
  mime_type?: string;
}

interface PropertyFormData {
  title: string;
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
  condition_type: string;
  heating: string;
  year_built?: number;
  furnishing_level: string;
  has_elevator: boolean;
  has_garage: boolean;
  has_southern_exposure: boolean;
  new_construction: boolean;
  gated_community: boolean;
  featured: boolean;
  active: boolean;
  property_code?: string;
  exposure?: string;
  pricing_mode?: string;
}

// Unified response handler - reads body only once
async function handleResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text(); // Read only once

  // Handle empty response
  if (!raw || raw.trim() === '') {
    console.error('Empty response from server:', { status: res.status, url: res.url });
    throw new Error(`Empty response from server (status ${res.status})`);
  }

  let data: any = null;
  if (contentType.includes('application/json')) {
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('JSON parsing error:', e, { status: res.status, url: res.url, raw: raw.slice(0, 500) });
      throw new Error(`Invalid JSON from server (status ${res.status})`);
    }
  } else {
    console.error('Non-JSON response:', { status: res.status, url: res.url, contentType, raw: raw.slice(0, 500) });
    throw new Error(`Non-JSON response (status ${res.status})`);
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    console.error('API error:', { status: res.status, url: res.url, data });
    throw new Error(msg);
  }

  return data;
}

class ApiService {
  public API_BASE = API_BASE;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    console.log('Login attempt to:', `${API_BASE}/auth/login`);
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await handleResponse(response);
      
      if (result.success && result.data) {
        localStorage.setItem('admin_token', result.data.token);
      }

      return result;
    } catch (error) {
      console.error('Login API error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Невалиден имейл или парола' 
      };
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('admin_token');
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      // Ignore logout errors
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // Properties
  async getProperties(filters?: any, page: number = 1, limit: number = 16): Promise<ApiResponse<Property[]> & { meta?: any }> {
    // Use fallback data in WebContainer environment
    if (USE_FALLBACK) {
      console.log('Using fallback data for getProperties');
      const properties = this.getLocalProperties();
      const filtered = this.filterLocalProperties(properties, filters);
      
      // Add pagination to fallback
      const total = filtered.data?.length || 0;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filtered.data?.slice(startIndex, endIndex) || [];
      
      return {
        success: true,
        data: paginatedData,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page < Math.ceil(total / limit)
        }
      };
    }

    try {
      console.log('API: Making request to get properties');
      
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });
      }

      const url = `${API_BASE}/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('API: Full request URL:', url);
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      const result = await handleResponse(response);
      return {
        success: result.success,
        data: result.data,
        meta: result.meta,
        error: result.error
      };
    } catch (error) {
      console.error('API error in getProperties:', error);
      
      // Fallback to local data for consultingg.com
      console.log('Using fallback local data');
      const properties = this.getLocalProperties();
      const filtered = this.filterLocalProperties(properties, filters);
      
      // Add pagination to fallback
      const total = filtered.data?.length || 0;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filtered.data?.slice(startIndex, endIndex) || [];
      
      return {
        success: true,
        data: paginatedData,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page < Math.ceil(total / limit)
        }
      };
    }
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    console.log('API: getProperty called for', id);
    
    // Always try API first, fallback to local data if needed
    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        headers: this.getAuthHeaders()
      });

      const result = await handleResponse(response);
      console.log('API: getProperty response', result);
      
      if (result.success && result.data) {
        console.log('API: Property found with images:', result.data.images?.length || 0);
        return result;
      }
      
      // If API didn't work, try fallback
      console.log('API: Property not found, trying fallback');
      const properties = this.getLocalProperties();
      const property = properties.find(p => p.id === id);
      
      if (property) {
        console.log('Fallback: Property found with images:', property.images?.length || 0);
        return { success: true, data: property };
      }
      
      return {
        success: false,
        error: 'Имотът не е намерен'
      };
      
    } catch (error) {
      console.error('API error in getProperty:', error);
      
      // Fallback to local data
      console.log('API: Error occurred, using fallback');
      const properties = this.getLocalProperties();
      const property = properties.find(p => p.id === id);
      
      if (property) {
        console.log('Fallback: Property found with images:', property.images?.length || 0);
        return { success: true, data: property };
      } else {
        return {
          success: false,
          error: 'Имотът не е намерен'
        };
      }
    }
  }

  async createProperty(data: PropertyFormData): Promise<ApiResponse<Property>> {
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in createProperty:', error);
      
      // DO NOT fallback to local data for admin operations - surface the error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Грешка при създаване на имота'
      };
    }
  }

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<ApiResponse<Property>> {
    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in updateProperty:', error);
      
      // Fallback to local data
      const properties = this.getLocalProperties();
      const index = properties.findIndex(p => p.id === id);
      
      if (index !== -1) {
        properties[index] = { 
          ...properties[index], 
          ...data as any, 
          updated_at: new Date().toISOString()
        };
        this.saveLocalProperties(properties);
        return { success: true, data: properties[index] };
      } else {
        return { success: false, error: 'Имотът не е намерен' };
      }
    }
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in deleteProperty:', error);
      
      // Fallback to local data
      const properties = this.getLocalProperties();
      const filteredProperties = properties.filter(p => p.id !== id);
      this.saveLocalProperties(filteredProperties);
      return { success: true };
    }
  }

  async updatePropertyOrder(orders: Array<{ id: string; sort_order: number }>): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/properties`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ orders })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in updatePropertyOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Грешка при обновяване на подредбата'
      };
    }
  }

  async uploadImage(file: File, propertyId: string, isMain = false): Promise<ApiResponse<any>> {
    try {
      console.log('Uploading image:', { fileName: file.name, fileSize: file.size, propertyId, isMain });
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('property_id', propertyId);
      formData.append('is_main', isMain.toString());
      formData.append('sort_order', '0');
      formData.append('alt_text', `Property image`);

      // Get auth headers but do NOT set Content-Type for FormData
      const headers: any = this.getAuthHeaders();
      // Remove Content-Type if present - let browser set multipart boundary
      delete headers['Content-Type'];
      
      console.log('FormData contents:', {
        image: file.name,
        property_id: propertyId,
        is_main: isMain,
        file_size: file.size,
        file_type: file.type
      });

      const token = localStorage.getItem('admin_token');
      console.log('Using token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE}/images/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await handleResponse(response);
      console.log('Image upload result:', result);
      return result;
    } catch (error) {
      console.error('API error in uploadImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Грешка при качване на снимката'
      };
    }
  }

  async deleteImage(propertyId: string, imageId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in deleteImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      };
    }
  }

  async setMainImage(imageId: string, propertyId: string): Promise<ApiResponse<void>> {
    try {
      console.log('API: Setting main image', imageId, 'for property', propertyId);

      const response = await fetch(
        `${API_BASE}/properties/${propertyId}/images/${imageId}/main`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({}) // тялото не е критично, важното е URL-ът
        }
      );

      const result = await handleResponse(response);
      console.log('API: Set main image result:', result);
      return result;
    } catch (error) {
      console.error('API error in setMainImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Грешка при задаване на главна снимка',
      };
    }
  }

  async updateImageOrder(propertyId: string, imageId: string, sortOrder: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}/images/${imageId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sort_order: sortOrder })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in updateImageOrder:', error);
      return {
        success: false,
        error: 'Грешка при обновяване на реда на снимките'
      };
    }
  }

  async updateImageAltText(propertyId: string, imageId: string, altText: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}/images/${imageId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ alt_text: altText })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in updateImageAltText:', error);
      return {
        success: false,
        error: 'Грешка при обновяване на alt текста'
      };
    }
  }

  async uploadDocument(propertyId: string, file: File): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('property_id', propertyId);

      // Get auth headers but do NOT set Content-Type for FormData
      const headers: any = this.getAuthHeaders();
      // Remove Content-Type if present - let browser set multipart boundary
      delete headers['Content-Type'];

      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in uploadDocument:', error);
      return {
        success: false,
        error: 'Грешка при качване на документа'
      };
    }
  }

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in deleteDocument:', error);
      return {
        success: false,
        error: 'Грешка при изтриване на документа'
      };
    }
  }

  // Pages
  async getPages(): Promise<ApiResponse<any[]>> {
    const DEV = import.meta.env.DEV;

    try {
      const response = await fetch(`${API_BASE}/pages`, {
        credentials: 'include',
        headers: { 
          Accept: 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        if (DEV) {
          console.warn('DEV fallback /pages: status', response.status);
          return { success: true, data: [] };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in getPages:', error);
      if (DEV) {
        console.warn('DEV fallback /pages on error');
        return { success: true, data: [] };
      }
      return {
        success: false,
        error: 'Грешка при зареждане на страниците'
      };
    }
  }

  async getPage(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/pages/${id}`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in getPage:', error);
      return {
        success: false,
        error: 'Грешка при зареждане на страницата'
      };
    }
  }

  async getPageBySlug(slug: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/pages/slug/${slug}`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in getPageBySlug:', error);
      return {
        success: false,
        error: 'Грешка при зареждане на страницата'
      };
    }
  }

  async createPage(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async updatePage(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/pages/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async deletePage(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/pages/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // Services
  async getServices(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE}/services`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in getServices:', error);
      return {
        success: false,
        error: 'Грешка при зареждане на услугите'
      };
    }
  }

  async getService(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/services/${id}`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async createService(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async updateService(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/services/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async deleteService(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // Sections
  async getSections(params?: any): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== '') {
            queryParams.append(key, params[key]);
          }
        });
      }

      const url = `${API_BASE}/sections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async getSection(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/sections/${id}`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

async createSection(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/sections`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async updateSection(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/sections/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async deleteSection(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/sections/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async updateSectionsSortOrder(data: { sections: Array<{ id: string; sort_order: number }> }): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/sections/sort-order`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async getStats(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/properties/stats`, {
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in getStats:', error);
      
      // Fallback to local data
      const properties = this.getLocalProperties();
      return {
        success: true,
        data: {
          totalProperties: properties.length,
          activeProperties: properties.filter(p => p.active).length,
          featuredProperties: properties.filter(p => p.featured).length,
          totalViews: 1250
        }
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    
    // Basic JWT token validation - check if it has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format, removing from localStorage');
      localStorage.removeItem('admin_token');
      return false;
    }
    
    try {
      // Basic check if payload is valid JSON (without validating signature/expiry)
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp || !payload.user_id || !payload.role) {
        console.warn('Invalid token payload, removing from localStorage');
        localStorage.removeItem('admin_token');
        return false;
      }
      
      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        console.warn('Token expired, removing from localStorage');
        localStorage.removeItem('admin_token');
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn('Invalid token, removing from localStorage');
      localStorage.removeItem('admin_token');
      return false;
    }
  }

  // Local data management for fallback
  private getLocalProperties(): Property[] {
    const stored = localStorage.getItem('consultingg_properties');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored properties:', error);
        localStorage.removeItem('consultingg_properties');
        return this.getDefaultProperties();
      }
    }
    return this.getDefaultProperties();
  }

  private saveLocalProperties(properties: Property[]): void {
    localStorage.setItem('consultingg_properties', JSON.stringify(properties));
  }

  private filterLocalProperties(properties: Property[], filters?: any): ApiResponse<Property[]> {
    let filteredProperties = [...properties];
    
    if (filters) {
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase().trim();

        if (keyword) {
          const words = keyword.split(/\s+/).filter(Boolean);
          filteredProperties = filteredProperties.filter(p => {
            const haystacks = [
              p.title,
              p.description,
              p.city_region,
              p.district,
              p.address,
              p.property_code,
              p.property_type
            ].map(value => (value || '').toLowerCase());

            const matchesPhrase = haystacks.some(field => field.includes(keyword));
            const matchesAllWords = words.length > 0 ? words.every(word => haystacks.some(field => field.includes(word))) : false;

            return matchesPhrase || matchesAllWords;
          });
        }
      }
      if (filters.transaction_type) {
        filteredProperties = filteredProperties.filter(p => p.transaction_type === filters.transaction_type);
      }
      if (filters.city_region) {
        filteredProperties = filteredProperties.filter(p => p.city_region === filters.city_region);
      }
      if (filters.district) {
        filteredProperties = filteredProperties.filter(p => p.district === filters.district);
      }
      if (filters.property_type) {
        filteredProperties = filteredProperties.filter(p => p.property_type === filters.property_type);
      }
      if (filters.featured === 'true') {
        filteredProperties = filteredProperties.filter(p => p.featured);
      }
      if (filters.active !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.active);
      }
      if (filters.price_min) {
        filteredProperties = filteredProperties.filter(p => p.price >= parseInt(filters.price_min));
      }
      if (filters.price_max) {
        filteredProperties = filteredProperties.filter(p => p.price <= parseInt(filters.price_max));
      }
      if (filters.area_min) {
        filteredProperties = filteredProperties.filter(p => p.area >= parseInt(filters.area_min));
      }
      if (filters.area_max) {
        filteredProperties = filteredProperties.filter(p => p.area <= parseInt(filters.area_max));
      }
      if (filters.limit) {
        filteredProperties = filteredProperties.slice(0, parseInt(filters.limit));
      }
    }
    
    return {
      success: true,
      data: filteredProperties,
      total: filteredProperties.length
    };
  }

  private getDefaultProperties(): Property[] {
    return [
      {
        id: 'prop-001',
        title: 'Модерна самостоятелна къща в Симеоново',
        description: '✨ Модерна самостоятелна къща с просторен двор и панорамни гледки в Симеоново ✨\n\nПредставяме Ви елегантен дом, съчетаващ модерна архитектура, функционално разпределение и просторна градина в един от най-престижните райони на София – кв. Симеоново, ул. Крайречна, в непосредствена близост до Симеоновско шосе.\n\n\n🏡 Основни характеристики:\n\n• Разрешение за ползване (Акт 16) – 2023 г.\n\n• РЗП къща: 400 кв.м\n\n• Двор: 1200 кв.м с възможност за изграждане на зони за отдих и зеленина\n\n• Отопление: газова инсталация\n\n\n📐 Разпределение:\n\n• I ниво: просторна и светла всекидневна, кабинет, мокро помещение и тоалетна.\n\n• II ниво: три самостоятелни спални, всяка с лична баня и дрешник, както и три тераси с впечатляващи гледки към града и планината.\n\nИмотът се предлага на шпакловка и замазка, което Ви дава свободата да реализирате своя личен стил и интериорни идеи.\n\n\n🌿 Предимства:\n\n• Отлична локация в престижен и тих район\n\n• Просторен двор, подходящ за градина, басейн или детска площадка\n\n• Уникални панорамни гледки, осигуряващи усещане за свобода и уединение',
        price: 290000,
        currency: 'EUR',
        transaction_type: 'sale',
        property_type: '3-СТАЕН',
        city_region: 'София',
        district: 'Симеоново',
        address: 'ул. Симеоновско шосе 123',
        area: 400,
        bedrooms: 3,
        bathrooms: 3,
        floors: 2,
        floor_number: 2,
        terraces: 3,
        construction_type: 'Тухла',
        condition_type: 'Ново строителство',
        heating: 'Газ',
        exposure: 'Ю-И-З',
        year_built: 2023,
        furnishing_level: 'none',
        has_elevator: true,
        has_garage: true,
        has_southern_exposure: true,
        new_construction: true,
        gated_community: false,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-001',
            property_id: 'prop-001',
            image_url: '/images/prop-001/1_kachta_simeonovo.jpg',
            url: '/images/prop-001/1_kachta_simeonovo.jpg',
            thumbnail_url: '/images/prop-001/1_kachta_simeonovo_thumb.jpg',
            sort_order: 0,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001b',
            property_id: 'prop-001',
            image_url: '/images/prop-001/2_kachta_simeonovo.jpg',
            url: '/images/prop-001/2_kachta_simeonovo.jpg',
            thumbnail_url: '/images/prop-001/2_kachta_simeonovo_thumb.jpg',
            sort_order: 1,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
  }

   // Image upload method for admin panel
  async uploadPropertyImages(propertyId: string, files: File[]): Promise<ApiResponse<any[]>> {
    try {
      const uploadResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('property_id', propertyId);
        formData.append('sort_order', i.toString());
        formData.append('is_main', i === 0 ? 'true' : 'false');
        formData.append('alt_text', `${file.name} - Property image`);

        const response = await fetch(`${API_BASE}/images/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: formData
        });

        const result = await handleResponse(response);
        uploadResults.push(result.data);
      }

      return {
        success: true,
        data: uploadResults
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Image delete method for admin panel
  async deletePropertyImage(imageId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      const result = await handleResponse(response);
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  async updatePropertyImages(
    propertyId: string,
    images: Array<{ id?: string; isMain?: boolean; sortOrder?: number }>
  ): Promise<ApiResponse<void>> {
    try {
      const existingImages = images.filter(img => !!img.id) as Array<{
        id: string;
        isMain?: boolean;
        sortOrder?: number;
      }>;

      if (existingImages.length === 0) {
        return { success: true };
      }

      // Обновяване на реда (sort_order)
      for (let i = 0; i < existingImages.length; i++) {
        const img = existingImages[i];
        try {
          await this.updateImageOrder(propertyId, img.id, i);
        } catch (error) {
          console.error('Error updating image order:', { propertyId, imageId: img.id, index: i, error });
        }
      }

      // Обновяване на главната снимка
      const mainImage = existingImages.find(img => img.isMain);
      if (mainImage) {
        try {
          await this.setMainImage(mainImage.id, propertyId);
        } catch (error) {
          console.error('Error setting main image:', { propertyId, imageId: mainImage.id, error });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('API error in updatePropertyImages:', error);
      return {
        success: false,
        error: 'Грешка при обновяване на снимките'
      };
    }
  }
}

export const apiService = new ApiService();
export type { Property, PropertyFormData, PropertyImage, ApiResponse };