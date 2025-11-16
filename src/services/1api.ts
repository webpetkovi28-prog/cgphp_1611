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
  featured: boolean;
  active: boolean;
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
          ...data, 
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
      const headers = this.getAuthHeaders();
      // Remove Content-Type if present - let browser set multipart boundary
      delete headers['Content-Type'];
      
      console.log('FormData contents:', {
        image: file.name,
        property_id: propertyId,
        is_main: isMain,
        file_size: file.size,
        file_type: file.type
      });

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

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
      console.log('Upload response text:', result);
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
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  async setMainImage(imageId: string, propertyId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}/images/${imageId}/main`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('API error in setMainImage:', error);
      return {
        success: false,
        error: 'Грешка при задаване на главна снимка'
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
      const headers = this.getAuthHeaders();
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
        const errorText = await response.text();
        console.error('Set main image error response:', errorText);
        throw new Error(`Set main failed: ${response.status} - ${errorText}`);
      }
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
        const keyword = filters.keyword.toLowerCase();
        filteredProperties = filteredProperties.filter(p => 
          p.title.toLowerCase().includes(keyword) || 
          (p.description && p.description.toLowerCase().includes(keyword)) ||
          (p.district && p.district.toLowerCase().includes(keyword)) ||
          (p.address && p.address.toLowerCase().includes(keyword)) ||
          (p.property_type && p.property_type.toLowerCase().includes(keyword))
        );
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
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-001',
            property_id: 'prop-001',
            image_url: '/images/prop-001/1_kachta_simeonovo.jpg',
            thumbnail_url: '/images/prop-001/1_kachta_simeonovo_thumb.jpg',
            sort_order: 0,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001b',
            property_id: 'prop-001',
            image_url: '/images/prop-001/2_kachta_simeonovo.jpg',
            thumbnail_url: '/images/prop-001/2_kachta_simeonovo_thumb.jpg',
            sort_order: 1,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001c',
            property_id: 'prop-001',
            image_url: '/images/prop-001/3_kachta_simeonovo.jpg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001d',
            property_id: 'prop-001',
            image_url: '/images/prop-001/4_kachta_simeonovo.jpg',
            sort_order: 4,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001e',
            property_id: 'prop-001',
            image_url: '/images/prop-001/5_kachta_simeonovo.jpg',
            sort_order: 5,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001f',
            property_id: 'prop-001',
            image_url: '/images/prop-001/6_kachta_simeonovo.jpg',
            sort_order: 6,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001g',
            property_id: 'prop-001',
            image_url: '/images/prop-001/7_kachta_simeonovo.jpg',
            sort_order: 7,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-001h',
            property_id: 'prop-001',
            image_url: '/images/prop-001/8_kachta_simeonovo.jpg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-002',
        title: 'Модерна самостоятелна къща с двор в Драгалевци',
        description: '✨ Модерна самостоятелна къща с двор в Драгалевци ✨\n\nВ непосредствена близост до комплекс Царско село и BRITANICA Park School. Проектът е в процес на строителство (до Акт 15) с планирано въвеждане в експлоатация – Акт 16, февруари 2024 г.\n\n🏡 Основни характеристики:\n\n• Статус: в строеж, до Акт 15\n\n• Въвеждане в експлоатация: Акт 16 – февруари 2024 г.\n\n• Отопление: газова инсталация\n\n• Издаване: шпакловка и замазка\n\n📐 Разпределение:\n\n• Сутерен: коридор, гараж за две коли, склад\n\n• Партер: входно антре, просторна дневна с трапезария и кухненски бокс, кабинет/стая за гости, тоалетна\n\n• Първи етаж: спалня с дрешник и собствена баня с тоалетна, две спални, перално помещение, баня с тоалетна, тераса\n\n🌿 Предимства:\n\n• Отлична локация в престижен и спокоен район\n\n• Просторен гараж за два автомобила\n\n• Функционално и модерно вътрешно разпределение\n\n• Близост до училище и спортно-развлекателни комплекси',
        price: 520000,
        currency: 'EUR',
        transaction_type: 'sale',
        property_type: 'КЪЩА',
        city_region: 'София',
        district: 'Драгалевци',
        address: 'в близост до комплекс Царско село',
        area: 280,
        bedrooms: 3,
        bathrooms: 2,
        floors: 3,
        floor_number: 0,
        terraces: 1,
        construction_type: 'Тухла',
        condition_type: 'Ново строителство',
        heating: 'Газ',
        exposure: 'Ю-И-З',
        year_built: 2024,
        furnishing_level: 'none',
        has_elevator: false,
        has_garage: true,
        has_southern_exposure: true,
        new_construction: true,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-002',
            property_id: 'prop-002',
            image_url: '/images/prop-002/1_kachta_dragalevci.jpg',
            thumbnail_url: '/images/prop-002/1_kachta_dragalevci_thumb.jpg',
            sort_order: 0,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-002b',
            property_id: 'prop-002',
            image_url: '/images/prop-002/2_kachta_dragalevci.jpg',
            thumbnail_url: '/images/prop-002/2_kachta_dragalevci_thumb.jpg',
            sort_order: 1,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-006',
        title: 'Самостоятелна къща с 360° панорамна гледка в кв. Бояна',
        description: '✨ Самостоятелна къща с 360° панорамна гледка в кв. Бояна ✨\n\nИзключителен дом, предлагащ изглед към Витоша, Ботаническата градина и София. Ново строителство (2026 г.), разположен на обилен парцел в престижната Бояна, с материали и технологии от висок клас.\n\n🏡 Характеристики:\n\n• РЗП: 538,80 кв.м\n\n• Двор: 1101 кв.м – ландшафтен дизайн\n\n• Конструкция: тухла Wienerberger\n\n• Дограма: алуминиева с троен стъклопакет ETEM\n\n• Отопление: термопомпа Daikin + газово котле + подово отопление + конвектори\n\n• Гараж: подземен за 3 автомобила + фитнес със сауна\n\n📐 Разпределение:\n\n• Партер: хол с камина, кухня + склад, стая за гости/офис, тоалетна за гости, дрешник, перално\n\n• Етаж 2: родителска спалня с баня, 2 детски стаи с бани, горен хол/офис\n\n• Панорамен покрив: с ток, вода и възможност за кухня, бар или басейн\n\n• Подземно ниво: гараж, баня, котелно, склад, фитнес, сауна\n\n🌿 Удобства и допълнителни характеристики:\n\n• Алуминиева входна врата\n\n• Външна мазилка с врачански камък\n\n• Южно изложение\n\n• Тихо място с бърз достъп до града\n\n🏆 Предимства:\n\n• Имоти без аналог — комбинация от стил, простор и гледка в сърцето на Бояна\n\n• Високо качество на строителството и използваните материали\n\n• Идеално за жилище, престиж / представителство или комфортен, луксозен начин на живот',
        price: 1350000,
        currency: 'EUR',
        transaction_type: 'sale',
        property_type: 'КЪЩА',
        city_region: 'София',
        district: 'Бояна',
        address: 'кв. Бояна',
        area: 538.80,
        bedrooms: 3,
        bathrooms: 5,
        floors: 3,
        floor_number: 0,
        terraces: 3,
        construction_type: 'Тухла',
        condition_type: 'Ново строителство',
        heating: 'Локално',
        exposure: 'Юг',
        year_built: 2026,
        furnishing_level: 'none',
        has_elevator: false,
        has_garage: true,
        has_southern_exposure: true,
        new_construction: true,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-006',
            property_id: 'prop-006',
            image_url: '/images/prop-006/kachta_boyana_1.jpg',
            thumbnail_url: '/images/prop-006/kachta_boyana_1_thumb.jpg',
            sort_order: 0,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-006b',
            property_id: 'prop-006',
            image_url: '/images/prop-006/kachta_boyana_2.jpg',
            thumbnail_url: '/images/prop-006/kachta_boyana_2_thumb.jpg',
            sort_order: 1,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-006c',
            property_id: 'prop-006',
            image_url: '/images/prop-006/kachta_boyana_3.jpg',
            thumbnail_url: '/images/prop-006/kachta_boyana_3_thumb.jpg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-006d',
            property_id: 'prop-006',
            image_url: '/images/prop-006/kachta_boyana_4.jpg',
            thumbnail_url: '/images/prop-006/kachta_boyana_4_thumb.jpg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-006e',
            property_id: 'prop-006',
            image_url: '/images/prop-006/kachta_boyana_5.jpg',
            thumbnail_url: '/images/prop-006/kachta_boyana_5_thumb.jpg',
            sort_order: 4,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-010',
        title: 'Луксозна самостоятелна къща в кв. Бояна | 580.70 кв.м РЗП | Двор 1200 кв.м | 360° панорама',
        description: '🏡 Луксозна самостоятелна къща в кв. Бояна | 580.70 кв.м РЗП | Двор 1200 кв.м | 360° панорама\n\nНова къща в процес на строителство, с планирано въвеждане в експлоатация през 2026 г., разположена в престижната част на кв. Бояна. Имотът се отличава с южно изложение, панорамни 360° гледки към Витоша, Ботаническата градина и цяла София, двор от 1200 кв.м с професионален ландшафтен проект, както и големи тераси със стъклени парапети, осигуряващи простор и светлина.\n\n👉 Къщата разполага с дизайнерски проект и 3D визуализации за баните, тоалетните и кухнята – изключително предимство за бъдещото довършване и обзавеждане на дома.\n\n✔️ Основни характеристики:\n • РЗП: 580.70 кв.м\n • Двор: 1101 кв.м (ландшафтинг)\n • Строителство: тухла Wienerberger\n • Дограма: алуминиева ETEM, троен шумоизолиращ стъклопакет\n • Отопление и охлаждане: термопомпа Daikin, газово котле, 500 л бойлер, подово отопление, конвектори\n • Газ: Да\n\n🔻 Подземно ниво :\n • Гараж за 2/3 автомобила с луксозни врати BENINCA\n • Широка рампа с павета за 4–6 автомобила\n • Котелно помещение, малък склад\n • Фитнес със сауна, парна баня, баня и тоалетна\n\n🔸 Първи етаж (партер):\n • Тоалетна за гости\n • Голям дрешник и перално помещение\n • Стая за гости или персонал\n • Просторен хол с камина\n • Кухня със складово помещение\n • Големи тераси със стъклени парапети\n\n🔸 Втори етаж:\n • Родителска спалня с три отделни помещения: баня, тоалетна и дрешник\n • Две детски стаи, всяка със собствена баня и дрешник\n • Излаз към панорамни тераси\n\n🌇 Панорамен покрив:\n • Вътрешен достъп\n • 360° гледка към София и Витоша\n • Изводи за ток и вода\n • Подходящ за лятна кухня, бар, roof-top зона или басейн\n\n🎯 Предимства:\n • Топ локация\n • Дизайнерски проект с визуализации за бани, тоалетни и кухня\n • Простор, комфорт и гледки без аналог в София',
        price: 21700000,
        currency: 'EUR',
        transaction_type: 'sale',
        property_type: 'КЪЩА',
        city_region: 'София',
        district: 'Бояна',
        address: 'кв. Бояна',
        area: 580.70,
        bedrooms: 4,
        bathrooms: 5,
        floors: 3,
        floor_number: 0,
        terraces: 4,
        construction_type: 'Тухла',
        condition_type: 'Ново строителство',
        heating: 'Термопомпа',
        exposure: 'Юг',
        year_built: 2026,
        furnishing_level: 'none',
        has_elevator: false,
        has_garage: true,
        has_southern_exposure: true,
        new_construction: true,
        featured: false,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pricing_mode: 'total',
        images: [
          {
            id: 'img-010a',
            property_id: 'prop-010',
            image_url: '/images/prop-010/image1.jpeg',
            sort_order: 1,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-010b',
            property_id: 'prop-010',
            image_url: '/images/prop-010/image2.jpeg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-010c',
            property_id: 'prop-010',
            image_url: '/images/prop-010/image3.jpeg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-010d',
            property_id: 'prop-010',
            image_url: '/images/prop-010/image4.jpeg',
            sort_order: 4,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-010e',
            property_id: 'prop-010',
            image_url: '/images/prop-010/image5.jpeg',
            sort_order: 5,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-007',
        title: '✨ Слънчев четиристаен апартамент в Оборище с панорамни гледки ✨',
        description: 'Представяме ви просторен и светъл апартамент, разположен в сърцето на кв. Оборище, в непосредствена близост до Малък градски театър, парк „Заимов", метростанция Театрална и удобни спирки на градски транспорт. Жилището разкрива впечатляващи гледки към Витоша и към емблематичния храм-паметник „Св. Александър Невски".\n\n📐 Разпределение:\n• Просторна всекидневна с кухненски бокс\n• Три самостоятелни спални\n• Две бани с тоалетни\n• Отделна тоалетна за гости\n• Три тераси с гледки\n\n🌿 Предимства:\n• Отлична локация в престижен квартал\n• Панорамни гледки към планината и центъра\n• Баланс между градски комфорт и спокойствие\n\n⚙️ Удобства:\n• Възможност за паркомясто или гараж\n• Панорамни гледки\n• Напълно оборудвано жилище\n• Тиха и престижна локация',
        price: 1500,
        currency: 'EUR',
        transaction_type: 'rent',
        property_type: '4-СТАЕН',
        city_region: 'София',
        district: 'Оборище',
        address: 'кв. Оборище, близо до метростанция Театрална',
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        floors: 8,
        floor_number: 7,
        terraces: 3,
        construction_type: 'Тухла',
        condition_type: 'Обзаведен',
        heating: 'ТЕЦ',
        exposure: 'Ю-И-З',
        year_built: null,
        furnishing_level: 'full',
        has_elevator: true,
        has_garage: false,
        has_southern_exposure: true,
        new_construction: false,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-007a',
            property_id: 'prop-007',
            image_url: '/images/prop-007/ap_oborichte_1.jpg',
            sort_order: 1,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-007b',
            property_id: 'prop-007',
            image_url: '/images/prop-007/ap_oborichte_2.jpg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-007c',
            property_id: 'prop-007',
            image_url: '/images/prop-007/ap_oborichte_3.jpg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-007d',
            property_id: 'prop-007',
            image_url: '/images/prop-007/ap_oborichte_4.jpg',
            sort_order: 4,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-007e',
            property_id: 'prop-007',
            image_url: '/images/prop-007/ap_oborichte_5.jpg',
            sort_order: 5,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-008',
        title: 'Модерна самостоятелна къща с двор и панорамни гледки в Драгалевци',
        description: '✨ Модерна самостоятелна къща с двор и панорамни гледки в Драгалевци ✨\n\nРазположена на ул. Пчелица, в близост до Киноцентъра, къщата предлага комфорт, функционалност и завършеност до ключ. Имотът е с Акт 16 / 2023 г., разполага с РЗП 460 кв.м и самостоятелен двор от 420 кв.м.\n\n🏡 Основни характеристики:\n• РЗП къща: 460 кв.м\n• Двор: 420 кв.м\n• Етажи: 3\n• Разрешение за ползване: Акт 16 / 2023 г.\n• Състояние: завършена до ключ\n\n📐 Разпределение:\n• I ниво: всекидневна, кухня, дрешник и тоалетна\n• II ниво: три спални със самостоятелни бани\n• III ниво: всекидневна, кухненски бокс, спалня, баня с тоалетна, камина\n\n🌿 Предимства:\n• Подови настилки: гранитогрес и ламинат\n• Отопление на ток с климатици и камина\n• Просторен и функционален имот, готов за обитаване\n• Прекрасни панорамни гледки\n• Престижна и спокойна локация в подножието на планината',
        price: 1250000,
        currency: 'EUR',
        transaction_type: 'sale',
        property_type: 'КЪЩА',
        city_region: 'София',
        district: 'Драгалевци',
        address: 'ул. Пчелица, в близост до Киноцентъра',
        area: 460,
        bedrooms: 4,
        bathrooms: 4,
        floors: 3,
        floor_number: 0,
        terraces: 1,
        construction_type: 'Тухла',
        condition_type: 'Завършена до ключ',
        heating: 'Климатици',
        exposure: 'Ю-И-З',
        year_built: 2023,
        furnishing_level: 'partial',
        has_elevator: false,
        has_garage: false,
        has_southern_exposure: true,
        new_construction: false,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 'img-008a',
            property_id: 'prop-008',
            image_url: '/images/prop-008/kachta_dragalevci_1.jpg',
            sort_order: 1,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-008b',
            property_id: 'prop-008',
            image_url: '/images/prop-008/kachta_dragalevci_2.jpg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-008c',
            property_id: 'prop-008',
            image_url: '/images/prop-008/kachta_dragalevci_3.jpg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-008d',
            property_id: 'prop-008',
            image_url: '/images/prop-008/kachta_dragalevci_4.jpg',
            sort_order: 4,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-008e',
            property_id: 'prop-008',
            image_url: '/images/prop-008/kachta_dragalevci_5.jpg',
            sort_order: 5,
            is_main: false,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'prop-009',
        title: 'Офис площи / Обект "Метличина поляна 15", кв. Гоце Делчев',
        description: '✨ Офис площи / Обект "Метличина поляна 15", кв. Гоце Делчев ✨\n\nТози имот предлага функционални офис пространства, разположени в добре позиционирана реновирана сграда с отлична достъпност и силна локация.\n\n🏢 Основни характеристики:\n• Обект: самостоятелен офис в сграда с монолитна стоманобетонова конструкция\n• Разрешение за ползване: Акт 16 / 2024 г. (очакван)\n• Площ: ≈ 1 117.58 кв.м общо по документи\n• Нива: две нива (партер и първи етаж)\n\n📐 Разпределение / помещения:\n• Партер: портиерна, фоайе и приемна, 16 самостоятелни работни стаи, санитарен възел\n• Етаж 2: 21 самостоятелни работни стаи, санитарен възел\n• Паркинг: възможност за паркоместа в подземния гараж на сградата\n\n🌍 Локация и удобства:\n• Квартал Гоце Делчев — граничен с бул. България, бул. Гоце Делчев, и кварталите Стрелбище, Борово и Манастирски ливади\n• Ул. „Метличина поляна" е тихa и спокойна, близо до ул. Костенски Водопад и Южния парк\n• Район с добре развита инфраструктура — услуги, транспортни връзки, зелени площи, удобства около сградата – парк / междублоково пространство\n\n⚙️ Предимства / Удобства:\n• Голям брой отделни офисни помещения — подходящо за фирми, колективи или споделени офиси\n• Санитарни възли и приемни във всеки етаж\n• Подземен гараж / паркоместа — за служители / посетители\n• Тиха локация, но с добър достъп до основни булеварди и градски транспорт',
        price: 8,
        currency: 'EUR',
        transaction_type: 'rent',
        property_type: 'ОФИС',
        city_region: 'София',
        district: 'Гоце Делчев',
        address: 'ул. Метличина поляна 15',
        area: 1117.58,
        bedrooms: 0,
        bathrooms: 2,
        floors: 2,
        floor_number: 0,
        terraces: 0,
        construction_type: 'Монолит',
        condition_type: 'Реновирана',
        heating: 'ТЕЦ',
        exposure: 'Ю-И',
        year_built: 2024,
        furnishing_level: 'none',
        has_elevator: true,
        has_garage: true,
        has_southern_exposure: false,
        new_construction: false,
        featured: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pricing_mode: 'per_sqm',
        images: [
          {
            id: 'img-009a',
            property_id: 'prop-009',
            image_url: '/images/prop-009/1_office_rent_gotze_delchev.jpg',
            sort_order: 1,
            is_main: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-009b',
            property_id: 'prop-009',
            image_url: '/images/prop-009/2_office_rent_gotze_delchev.jpg',
            sort_order: 2,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-009c',
            property_id: 'prop-009',
            image_url: '/images/prop-009/3_office_rent_gotze_delchev.jpg',
            sort_order: 3,
            is_main: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'img-009d',
            property_id: 'prop-009',
            image_url: '/images/prop-009/4_office_rent_gotze_delchev.jpg',
            sort_order: 4,
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
}

export const apiService = new ApiService();
export type { Property, PropertyFormData,   };