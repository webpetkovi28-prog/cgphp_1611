import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { apiService } from '../services/api';
import { Property, PropertyFormData } from '../types/property';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProperties, setTotalProperties] = useState(0);

  const fetchProperties = useCallback(async (filters?: any, page: number = 1, limit: number = 16) => {
    setLoading(true);
    setError(null);
    let response: any;
    
    try {
      console.log('useProperties: Fetching with filters:', filters);
      response = await apiService.getProperties(filters, page, limit);
      console.log('useProperties: API response:', response);
      if (response.success && response.data) {
        setProperties(response.data);
        if (response.meta) {
          setTotalProperties(response.meta.total);
        }
        console.log('useProperties: Properties loaded:', response.data.length);
      } else {
        setProperties([]);
        setError(response.error || 'Грешка при зареждане на имотите');
        setTotalProperties(0);
        console.log('useProperties: Error or no data:', response.error);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setError('Грешка при зареждане на имотите');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function is stable

  const fetchPropertyById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('useProperties: Fetching property with ID:', id);
      const response = await apiService.getProperty(id);
      console.log('useProperties: API response:', response);
      if (!response.success || !response.data) {
        setError(response.error || 'Грешка при зареждане на имота');
        return null;
      }
      const property = response.data;
      console.log('useProperties: Property loaded successfully:', property.title);
      return property;
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Грешка при зареждане на имота');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (data: PropertyFormData) => {
    try {
      const response = await apiService.createProperty(data);
      if (!response.success || !response.data) {
        setError(response.error || 'Грешка при създаване на имота');
        return null;
      }
      const property = response.data;
      setProperties(prev => [property, ...prev]);
      return property;
    } catch (error) {
      console.error('Error creating property:', error);
      setError('Грешка при създаване на имота');
      return null;
    }
  }, []);

  const updateProperty = useCallback(async (id: string, data: Partial<PropertyFormData>) => {
    try {
      const response = await apiService.updateProperty(id, data);
      if (!response.success || !response.data) {
        setError(response.error || 'Грешка при обновяване на имота');
        return null;
      }
      const property = response.data;
      setProperties(prev => prev.map(p => p.id === id ? property : p));
      return property;
    } catch (error) {
      console.error('Error updating property:', error);
      setError('Грешка при обновяване на имота');
      return null;
    }
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      const response = await apiService.deleteProperty(id);
      if (!response.success) {
        setError(response.error || 'Грешка при изтриване на имота');
        return false;
      }
      setProperties(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Грешка при изтриване на имота');
      return false;
    }
  }, []);

  const uploadImage = useCallback(async (file: File, propertyId: string, isMain = false) => {
    try {
      // Get existing images count to set proper sort order
      const existingImagesResponse = await apiService.getProperty(propertyId);
      const existingImages = existingImagesResponse.data?.images || [];
      const sortOrder = existingImages.length;
      
      const response = await apiService.uploadImage(file, propertyId, isMain);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Грешка при качване на снимката');
      }
      const data = response.data;
      
      // Refresh properties to show updated images
      fetchProperties();
      
      return data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, []);

  const deleteImage = useCallback(async (imageId: string) => {
    try {
      // Find the property that contains this image
      const property = properties.find(p => 
        p.images?.some(img => img.id === imageId)
      );
      
      if (!property) {
        console.error('Could not find property for image:', imageId);
        return false;
      }
      
      const response = await apiService.deleteImage(property.code, imageId);
      if (!response.success) {
        console.error('Error deleting image:', response.error);
        return false;
      }
      
      // Refresh properties to show updated images
      fetchProperties();
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }, [properties, fetchProperties]);

  const setMainImage = useCallback(async (imageId: string, propertyId: string) => {
    try {
      const response = await apiService.setMainImage(imageId, propertyId);
      if (!response.success) {
        console.error('Error setting main image:', response.error);
        return false;
      }
      
      // Refresh properties to show updated images
      fetchProperties();
      return true;
    } catch (error) {
      console.error('Error setting main image:', error);
      return false;
    }
  }, [fetchProperties]);

  const getStats = useCallback(async () => {
    try {
      const response = await apiService.getStats();
      if (!response.success || !response.data) {
        console.error('Error fetching stats:', response.error);
        return { totalProperties: 0, activeProperties: 0, featuredProperties: 0, totalViews: 0 };
      }
      const stats = response.data;
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalProperties: 0,
        activeProperties: 0,
        featuredProperties: 0,
        totalViews: 0
      };
    }
  }, []);

  useEffect(() => {
    // Only fetch on mount, not on every render
    fetchProperties();
  }, [fetchProperties]); // Now fetchProperties is stable due to useCallback

  return {
    properties,
    loading,
    error,
    totalProperties,
    fetchProperties,
    fetchPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    uploadImage,
    deleteImage,
    setMainImage,
    getStats,
    refetch: fetchProperties
  };
};