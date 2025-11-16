import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Star, Save, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { apiService, PropertyFormData, Property } from '../services/api';
import { getAllCities, PROPERTY_TYPES, RESIDENTIAL_PROPERTY_TYPES, getDistrictsForCity, CONSTRUCTION_TYPES, CONDITIONS, HEATING_TYPES, FURNISHING_LEVELS } from '../data/constants';

const NON_RESIDENTIAL_DETAIL_DEFAULTS: Partial<PropertyFormData> = {
  bedrooms: 0,
  bathrooms: 0,
  terraces: 0,
  floor_number: 0,
  floors: 0,
  construction_type: '',
  condition_type: '',
  heating: '',
  exposure: '',
  year_built: undefined,
  furnishing_level: ''
};

const NON_RESIDENTIAL_DETAIL_FIELDS = Object.keys(NON_RESIDENTIAL_DETAIL_DEFAULTS) as (keyof PropertyFormData)[];

const EXPOSURE_OPTIONS = [
  'Север',
  'Юг',
  'Изток',
  'Запад',
  'Ю-И',
  'Ю-З',
  'С-И',
  'С-З',
  'Изток-Запад'
];

interface AdminPropertyFormProps {
  mode: 'create' | 'edit';
}

export const AdminPropertyForm: React.FC<AdminPropertyFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit' && id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<Array<{ 
    id?: string; 
    url: string; 
    file?: File; 
    isMain: boolean;
    sortOrder?: number;
    altText?: string;
    uploading?: boolean;
    error?: string;
  }>>([]);

  const [documents, setDocuments] = useState<Array<{
    id?: string;
    filename: string;
    size: number;
    url?: string;
    file?: File;
    uploading?: boolean;
    error?: string;
  }>>([]);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_code: '',
    price: 50000, // Set valid default instead of 0
    currency: 'EUR',
    transaction_type: 'sale',
    property_type: '',
    city_region: 'София',
    district: '',
    address: '',
    area: 50, // Set valid default instead of 0
    bedrooms: 0,
    bathrooms: 0,
    floors: 0,
    floor_number: 0,
    terraces: 0,
    construction_type: '',
    condition_type: '',
    heating: '',
    exposure: '',
    year_built: new Date().getFullYear(),
    furnishing_level: '',
    has_elevator: false,
    has_garage: false,
    has_southern_exposure: false,
    new_construction: false,
    gated_community: false,
    featured: false,
    active: true,
    pricing_mode: 'total'
  });

  const allCities = getAllCities();
  const availableDistricts = getDistrictsForCity(formData.city_region);
  const isResidentialProperty = !formData.property_type || RESIDENTIAL_PROPERTY_TYPES.includes(formData.property_type);
  const detailFieldsDisabled = Boolean(formData.property_type && !isResidentialProperty);

  useEffect(() => {
    if (!formData.property_type) return;
    if (RESIDENTIAL_PROPERTY_TYPES.includes(formData.property_type)) return;

    setFormData(prev => {
      let changed = false;
      const next: PropertyFormData = { ...prev };
      const mutableNext = next as Record<keyof PropertyFormData, PropertyFormData[keyof PropertyFormData]>;

      NON_RESIDENTIAL_DETAIL_FIELDS.forEach((field) => {
        const value = NON_RESIDENTIAL_DETAIL_DEFAULTS[field] as PropertyFormData[typeof field];
        if (mutableNext[field] !== value) {
          mutableNext[field] = value;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [formData.property_type]);

  useEffect(() => {
    // Check authentication
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    if (isEdit && id) {
      loadProperty(id);
    }
  }, [isEdit, id, navigate]);

  const loadProperty = async (propertyId: string) => {
    setLoading(true);
    try {
      const result = await apiService.getProperty(propertyId);
      if (result.success && result.data) {
        const property = result.data;
        setFormData({
          title: property.title,
          description: property.description || '',
          price: property.price,
          currency: property.currency,
          transaction_type: property.transaction_type,
          property_type: property.property_type,
          city_region: property.city_region,
          district: property.district || '',
          address: property.address || '',
          area: property.area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          floors: property.floors || 0,
          floor_number: property.floor_number || 0,
          terraces: property.terraces,
          construction_type: property.construction_type || '',
          condition_type: property.condition_type || '', // Потвърдена корекция
          heating: property.heating || '',
          year_built: property.year_built || new Date().getFullYear(),
          furnishing_level: property.furnishing_level || '',
          has_elevator: property.has_elevator,
          has_garage: property.has_garage,
          has_southern_exposure: property.has_southern_exposure,
          new_construction: property.new_construction,
          gated_community: property.gated_community,
          featured: property.featured,
          active: property.active,
          pricing_mode: property.pricing_mode || 'total',
        });

        // Set images
        if (property.images) {
          setImages(property.images.map((img: any) => ({
            id: img.id,
            url: img.image_url,
            isMain: img.is_main,
            sortOrder: img.sort_order,
            altText: img.alt_text
          })));
        }
        
        // Set documents
        if (property.documents) {
          setDocuments(property.documents.map((doc: any) => ({
            id: doc.id,
            filename: doc.filename,
            size: doc.size,
            url: doc.url
          })));
        }
      } else {
        setError(result.error || 'Грешка при зареждане на имота');
      }
    } catch (error) {
      setError('Грешка при зареждане на имота');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Document upload handlers
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Process files and upload immediately if editing existing property
    files.forEach((file) => {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        setError(`Неподдържан формат на файл: ${file.type}. Моля използвайте само PDF файлове.`);
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`Файлът е твърде голям: ${(file.size / 1024 / 1024).toFixed(1)}MB. Максимум 10MB.`);
        return;
      }
      
      const newDocument = {
        filename: file.name,
        size: file.size,
        file,
        uploading: false
      };
      
      setDocuments(prev => [...prev, newDocument]);
      
      // If editing existing property, upload immediately
      if (isEdit && id) {
        uploadDocumentImmediately(file, id);
      }
    });
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
    // Clear any previous errors
    setError('');
  };

  const uploadDocumentImmediately = async (file: File, propertyId: string) => {
    try {
      // Set uploading state for this document
      setDocuments(prev => prev.map((doc) => 
        doc.file === file ? { ...doc, uploading: true, error: undefined } : doc
      ));
      
      const result = await apiService.uploadDocument(propertyId, file);
      
      if (result.success) {
        // Update document with server response
        setDocuments(prev => prev.map((doc) => 
          doc.file === file ? {
            id: result.data.id,
            filename: result.data.filename,
            size: result.data.size,
            url: result.data.url,
            uploading: false
          } : doc
        ));
      } else {
        // Set error state for this document
        setDocuments(prev => prev.map((doc) => 
          doc.file === file ? { ...doc, uploading: false, error: result.error } : doc
        ));
        setError(result.error || 'Грешка при качване на документа');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setDocuments(prev => prev.map((doc) => 
        doc.file === file ? { ...doc, uploading: false, error: 'Грешка при качване' } : doc
      ));
      setError('Грешка при качване на документа');
    }
  };

  const removeDocument = async (index: number) => {
    const document = documents[index];
    
    // If document has an ID, delete from server
    if (document.id && isEdit && id) {
      try {
        const result = await apiService.deleteDocument(document.id);
        if (result.success) {
          // Remove from local state immediately
          setDocuments(prev => prev.filter((_, i) => i !== index));
        } else {
          setError(result.error || 'Грешка при изтриване на документа');
          return;
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        setError('Грешка при изтриване на документа');
        return;
      }
    } else {
      // Remove from local state only (for new uploads not yet saved)
      setDocuments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processImageFiles = (files: File[]) => {
    if (files.length === 0) return;
    
    // Check total images limit
    if (images.length + files.length > 50) {
      setError(`Не можете да качите повече от 50 снимки. Имате ${images.length}, опитвате да добавите ${files.length}.`);
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Process files and upload immediately if editing existing property
    files.forEach((file) => {
      // Validate file type - only PNG/JPG/JPEG allowed
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError(`Неподдържан формат на файл: ${file.type}. Моля използвайте PNG, JPG или JPEG.`);
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`Файлът е твърде голям: ${(file.size / 1024 / 1024).toFixed(1)}MB. Максимум 10MB.`);
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          url: event.target?.result as string,
          file,
          isMain: images.length === 0,
          sortOrder: images.length,
          altText: `Property image ${images.length + 1}`,
          uploading: false
        };
        
        setImages(prev => [...prev, newImage]);
        
        // If editing existing property, upload immediately
        if (isEdit && id) {
          uploadImageImmediately(file, id, images.length === 0);
        }
      };
      reader.onerror = () => {
        setError('Грешка при четене на файла');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processImageFiles(files);
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processImageFiles(files);
  };

  const uploadImageImmediately = async (file: File, propertyId: string, isMain: boolean) => {
    try {
      // Set uploading state for this image
      setImages(prev => prev.map((img, idx) => 
        img.file === file ? { ...img, uploading: true, error: undefined } : img
      ));
      
      console.log('Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        propertyId,
        isMain
      });
      
      const result = await apiService.uploadImage(file, propertyId, isMain);
      console.log('Upload result:', result);
      
      if (result.success) {
        // Update the image with the server response
        setImages(prev => prev.map((img, idx) => 
          img.file === file ? { 
            ...img, 
            id: result.data.id,
            url: result.data.url,
            uploading: false,
            file: undefined // Remove file reference after successful upload
          } : img
        ));
      } else {
        // Mark image as failed
        setImages(prev => prev.map((img, idx) => 
          img.file === file ? { ...img, uploading: false, error: result.error } : img
        ));
        console.error('Upload failed:', result.error);
        setError(`Грешка при качване на снимката: ${result.error || 'Неизвестна грешка'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Mark image as failed
      setImages(prev => prev.map((img, idx) => 
        img.file === file ? { ...img, uploading: false, error: 'Грешка при качване' } : img
      ));
      setError(`Грешка при качване на снимката: ${error instanceof Error ? error.message : 'Неизвестна грешка'}`);
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    
    // If image has an ID, delete from server
    if (image.id && isEdit && id) {
      try {
        console.log('Deleting image:', image.id, 'from property:', id);
        const result = await apiService.deleteImage(id, image.id);
        console.log('Delete result:', result);
        if (result.success) {
          // Remove from local state immediately
          setImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            // If we removed the main image, make the first one main
            if (prev[index].isMain && newImages.length > 0) {
              newImages[0].isMain = true;
            }
            return newImages;
          });
        } else {
          setError(result.error || 'Грешка при изтриване на снимката');
          return;
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        setError('Грешка при изтриване на снимката');
        return;
      }
    } else {
      // Remove from local state only (for new uploads not yet saved)
      setImages(prev => {
        const newImages = prev.filter((_, i) => i !== index);
        // If we removed the main image, make the first one main
        if (prev[index].isMain && newImages.length > 0) {
          newImages[0].isMain = true;
        }
        return newImages;
      });
    }
  };

  const setMainImage = async (index: number) => {
    const image = images[index];
    
    // If image has an ID and we're editing, update on server
    if (image.id && isEdit && id) {
      try {
        console.log('Setting main image:', image.id, 'for property:', id);
        const result = await apiService.setMainImage(image.id, id);
        console.log('Set main result:', result);
        if (result.success) {
          // Update local state immediately
          setImages(prev => prev.map((img, i) => ({
            ...img,
            isMain: i === index
          })));
        } else {
          setError(result.error || 'Грешка при задаване на главна снимка');
          return;
        }
      } catch (error) {
        console.error('Error setting main image:', error);
        setError('Грешка при задаване на главна снимка');
        return;
      }
    } else {
      // Update local state only (for new uploads)
      setImages(prev => prev.map((img, i) => ({
        ...img,
        isMain: i === index
      })));
    }
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setImages(prev => {
      const newImages = [...prev];
      const newIndex = direction === 'left' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= newImages.length) return prev;

      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i,
      }));
    });
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDropOnImage = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    const dragIndex = parseInt(dragIndexStr, 10);

    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;

    setImages(prev => {
      const newImages = [...prev];
      const [draggedImage] = newImages.splice(dragIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      return newImages.map((img, i) => ({
        ...img,
        sortOrder: i,
      }));
    });
  };

  // Helper function to filter out empty optional fields
  const filterOptionalFields = (data: PropertyFormData) => {
    const cleanData = { ...data };
    
    // Remove empty string fields (convert to undefined so they don't get sent)
    if (!cleanData.description?.trim()) delete cleanData.description;
    if (!cleanData.property_code?.trim()) delete cleanData.property_code;
    if (!cleanData.district?.trim()) delete cleanData.district;
    if (!cleanData.address?.trim()) delete cleanData.address;
    if (!cleanData.construction_type?.trim()) delete cleanData.construction_type;
    if (!cleanData.condition_type?.trim()) delete cleanData.condition_type;
    if (!cleanData.heating?.trim()) delete cleanData.heating;
    if (!cleanData.exposure?.trim()) delete cleanData.exposure;
    if (!cleanData.furnishing_level?.trim()) delete cleanData.furnishing_level;
    
    // Remove zero/empty numeric fields
    if (!cleanData.bedrooms || cleanData.bedrooms <= 0) delete cleanData.bedrooms;
    if (!cleanData.bathrooms || cleanData.bathrooms <= 0) delete cleanData.bathrooms;
    if (!cleanData.terraces || cleanData.terraces <= 0) delete cleanData.terraces;
    if (!cleanData.floors || cleanData.floors <= 0) delete cleanData.floors;
    if (!cleanData.floor_number || cleanData.floor_number <= 0) delete cleanData.floor_number;
    if (!cleanData.year_built || cleanData.year_built <= 0) delete cleanData.year_built;
    
    return cleanData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Client-side validation to match backend requirements
      if (!formData.title || formData.title.trim().length < 3) {
        throw new Error('Заглавието трябва да бъде поне 3 символа');
      }
      if (!formData.price || formData.price <= 0) {
        throw new Error('Цената трябва да бъде по-голяма от 0');
      }
      if (!formData.area || formData.area <= 0) {
        throw new Error('Площта трябва да бъде по-голяма от 0');
      }
      if (!formData.property_type) {
        throw new Error('Моля изберете тип имот');
      }
      if (!formData.transaction_type) {
        throw new Error('Моля изберете тип сделка');
      }
      if (!formData.city_region) {
        throw new Error('Моля изберете град/регион');
      }

      let propertyCode: string;
      let propertyId: string;
      
      // Filter out empty optional fields before submission
      const cleanFormData = filterOptionalFields(formData);
      
      if (isEdit && id) {
        // Update existing property
        const result = await apiService.updateProperty(id, cleanFormData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update property');
        }
        propertyId = id;
      } else {
        // Create new property
        const result = await apiService.createProperty(cleanFormData);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create property');
        }
        propertyId = result.data.id;
      }

      // Handle image uploads for new images
      for (const image of images) {
        if (image.file) {
          try {
            const uploadResult = await apiService.uploadImage(image.file, propertyId, image.isMain);
            console.log('Image uploaded:', uploadResult);
          } catch (error) {
            console.error('Failed to upload image:', error);
            // Continue with other images even if one fails
          }
        }
      }

      // Обнови реда и главната снимка според текущото подреждане
      if (propertyId && images.length > 0) {
        const imagesForUpdate = images.map((img, index) => ({
          id: img.id,
          isMain: img.isMain,
          sortOrder: index,
        }));

        const updateResult = await apiService.updatePropertyImages(propertyId, imagesForUpdate);
        if (!updateResult.success) {
          console.error('Failed to update property images order:', updateResult.error);
        }
      }

      navigate('/admin');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Грешка при запазване на имота';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Редактиране на имот' : 'Добавяне на нов имот'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Редактирайте информацията за имота' : 'Попълнете всички полета за новия имот'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Основна информация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заглавие *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например: Луксозен апартамент в центъра"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Подробно описание на имота..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код на имота
                </label>
                <input
                  type="text"
                  value={formData.property_code || ''}
                  onChange={(e) => handleInputChange('property_code', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например: PROP-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип сделка *
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => handleInputChange('transaction_type', e.target.value as 'sale' | 'rent')}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none transition-all duration-200 ${
                    formData.transaction_type === 'rent'
                      ? 'focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-sky-50/30'
                      : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                >
                  <option value="sale">🏠 Продажба</option>
                  <option value="rent">🏡 Под наем</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип имот *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Изберете тип</option>
                  {PROPERTY_TYPES.map((type, index) => {
                    const val = typeof type === 'string' ? type : (type.value ?? type.key ?? '');
                    const k = typeof type === 'string' ? type : (type.key ?? type.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена * (€)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  required
                  min="0"
                />
              </div>

              {/* Per-sqm rent price field - only for rent properties */}
              {formData.transaction_type === 'rent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена на наем /м² (EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing_mode === 'per_sqm' ? formData.price : ''}
                    onChange={(e) => {
                      // Allow both comma and dot as decimal separator
                      const value = e.target.value.replace(',', '.');
                      if (value) {
                        handleInputChange('price', parseFloat(value));
                        handleInputChange('pricing_mode', 'per_sqm');
                      } else {
                        handleInputChange('pricing_mode', 'per_month');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-sky-50/30"
                    placeholder="8.00"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Оставете празно за месечна цена. Попълнете за цена на кв.м.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Площ * (м²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => {
                    // Allow both comma and dot as decimal separator
                    const value = e.target.value.replace(',', '.');
                    handleInputChange('area', value ? parseFloat(value) : 0);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Локация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Град *
                </label>
                <select
                  value={formData.city_region}
                  onChange={(e) => {
                    handleInputChange('city_region', e.target.value);
                    handleInputChange('district', ''); // Reset district when city changes
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {allCities.map((city, index) => {
                    const val = typeof city === 'string' ? city : (city.value ?? city.key ?? '');
                    const k = typeof city === 'string' ? city : (city.key ?? city.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Квартал
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={availableDistricts.length === 0}
                >
                  <option value="">Изберете квартал</option>
                  {availableDistricts.map((district, index) => {
                    const val = typeof district === 'string' ? district : (district.value ?? district.key ?? '');
                    const k = typeof district === 'string' ? district : (district.key ?? district.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ул. Примерна 123"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Детайли за имота</h2>
              {detailFieldsDisabled && (
                <p className="text-sm text-gray-500">
                  Тези полета са налични само за жилищни имоти. Стойностите няма да бъдат запазени за текущия тип.
                </p>
              )}
            </div>
            
            <fieldset disabled={detailFieldsDisabled} className={detailFieldsDisabled ? 'opacity-60 cursor-not-allowed' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Спални
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Бани
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тераси
                </label>
                <input
                  type="number"
                  value={formData.terraces}
                  onChange={(e) => handleInputChange('terraces', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Етаж на имота (незадължително)
                </label>
                <input
                  type="number"
                  value={formData.floor_number}
                  onChange={(e) => handleInputChange('floor_number', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="На кой етаж се намира"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Общо етажи в сградата (незадължително)
                </label>
                <input
                  type="text"
                  value={formData.floors}
                  onChange={(e) => handleInputChange('floors', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Общо етажи в сградата"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Изложение
                </label>
                <select
                  value={formData.exposure || ''}
                  onChange={(e) => handleInputChange('exposure', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Не е посочено</option>
                  {EXPOSURE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Година на строителство (незадължително)
                </label>
                <input
                  type="text"
                  value={formData.year_built ?? ''}
                  onChange={(e) => handleInputChange('year_built', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вид строителство
                </label>
                <select
                  value={formData.construction_type || ''}
                  onChange={(e) => handleInputChange('construction_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Изберете вид</option>
                  {CONSTRUCTION_TYPES.map((type, index) => {
                    const val = typeof type === 'string' ? type : (type.value ?? type.key ?? '');
                    const k = typeof type === 'string' ? type : (type.key ?? type.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Състояние
                </label>
                <select
                  value={formData.condition_type || ''}
                  onChange={(e) => handleInputChange('condition_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Изберете състояние</option>
                  {CONDITIONS.map((condition, index) => {
                    const val = typeof condition === 'string' ? condition : (condition.value ?? condition.key ?? '');
                    const k = typeof condition === 'string' ? condition : (condition.key ?? condition.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отопление
                </label>
                <select
                  value={formData.heating || ''}
                  onChange={(e) => handleInputChange('heating', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Изберете отопление</option>
                  {HEATING_TYPES.map((heating, index) => {
                    const val = typeof heating === 'string' ? heating : (heating.value ?? heating.key ?? '');
                    const k = typeof heating === 'string' ? heating : (heating.key ?? heating.value ?? String(index));
                    return <option key={k} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ниво на обзавеждане
                </label>
                <select
                  value={formData.furnishing_level || ''}
                  onChange={(e) => handleInputChange('furnishing_level', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Изберете ниво</option>
                  {FURNISHING_LEVELS.map((level, index) => {
                    const val = typeof level === 'string' ? level : (level.value ?? level.key ?? '');
                    const k = typeof level === 'string' ? level : (level.key ?? level.value ?? String(index));
                    const label = typeof level === 'string' ? level : (level.label ?? level.value ?? level.key ?? '');
                    return <option key={k} value={val}>{label}</option>;
                  })}
                </select>
              </div>
            </div>
            </fieldset>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Характеристики</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_elevator}
                  onChange={(e) => handleInputChange('has_elevator', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Асансьор</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_garage}
                  onChange={(e) => handleInputChange('has_garage', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Гараж</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.new_construction}
                  onChange={(e) => handleInputChange('new_construction', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Ново строителство</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gated_community}
                  onChange={(e) => handleInputChange('gated_community', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Затворен комплекс</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Препоръчан имот</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Активен</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Снимки</h2>
            
            <div className="mb-6">
              <div
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  // Trigger file input when clicking the dropzone
                  const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
                  fileInput?.click();
                }}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-8 h-8 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-500'}`} />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Кликнете за качване</span> или плъзнете файловете
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG или JPEG (MAX. 10MB)</p>
                </div>
                <input
                  id="image-upload-input"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id ?? index}
                    className="relative group cursor-move"
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragOver={handleImageDragOver}
                    onDrop={(e) => handleImageDropOnImage(e, index)}
                  >
                    {/* Номер на снимката */}
                    <div className="absolute -top-2 -left-2 z-10 bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    {/* Grip икона */}
                    <div className="absolute top-1 right-1 z-10 opacity-60 group-hover:opacity-100">
                      <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>

                    <img
                      src={image.thumbnail_url || image.url}
                      alt={image.altText || `Property image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                    />

                    {/* Overlay с контроли */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-2">
                        {/* Ляво */}
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'left')}
                          disabled={index === 0 || image.uploading}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Премести наляво"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Главна */}
                        <button
                          type="button"
                          onClick={() => setMainImage(index)}
                          disabled={image.uploading}
                          className={`p-1 rounded ${
                            image.isMain
                              ? 'bg-yellow-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                          }`}
                          title={image.isMain ? 'Главна снимка' : 'Направи главна'}
                        >
                          <Star className="w-4 h-4" fill={image.isMain ? 'currentColor' : 'none'} />
                        </button>

                        {/* Дясно */}
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'right')}
                          disabled={index === images.length - 1 || image.uploading}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Премести надясно"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Изтрий */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={image.uploading}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        title="Премахни снимка"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Loading overlay */}
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}

                    {/* Главна badge */}
                    {image.isMain && (
                      <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-semibold shadow-lg">
                        Главна
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents (PDFs) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Документи (PDF)</h2>
            
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Кликнете за качване</span> или плъзнете PDF файлове
                  </p>
                  <p className="text-xs text-gray-500">Само PDF файлове (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf"
                  onChange={handleDocumentUpload}
                />
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-3">
                {documents.map((document, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{document.filename}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {document.url && (
                        <button
                          type="button"
                          onClick={() => window.open(document.url, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Отвори PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        disabled={document.uploading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Премахни документ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {document.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                    {document.error && (
                      <div className="mt-1 text-xs text-red-600">{document.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? 'Обнови имот' : 'Създай имот'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};