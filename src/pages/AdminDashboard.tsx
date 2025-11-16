import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, LogOut, Star, Building, GripVertical, RotateCcw } from 'lucide-react';
import { apiService, Property } from '../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Position Input Component with proper controlled input pattern
interface PositionInputProps {
  currentPosition: number;
  maxPosition: number;
  onPositionChange: (position: number) => void;
  propertyId: string;
}

const PositionInput: React.FC<PositionInputProps> = ({
  currentPosition,
  maxPosition,
  onPositionChange,
  propertyId,
}) => {
  const [inputValue, setInputValue] = useState<string>(currentPosition.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update input value when currentPosition changes (e.g., after successful update)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentPosition.toString());
      setHasError(false);
      setErrorMessage('');
    }
  }, [currentPosition, isEditing]);

  const validateAndCommit = (value: string) => {
    const trimmedValue = value.trim();
    
    // Reset error state
    setHasError(false);
    setErrorMessage('');

    // Check if empty
    if (!trimmedValue) {
      setHasError(true);
      setErrorMessage('Position is required');
      return false;
    }

    // Parse number
    const numValue = Number(trimmedValue);
    
    // Check if valid integer
    if (isNaN(numValue) || !Number.isInteger(numValue)) {
      setHasError(true);
      setErrorMessage('Must be a whole number');
      return false;
    }

    // Check range
    if (numValue < 1 || numValue > maxPosition) {
      setHasError(true);
      setErrorMessage(`Must be between 1 and ${maxPosition}`);
      return false;
    }

    // Valid - commit the change
    if (numValue !== currentPosition) {
      onPositionChange(numValue - 1); // Convert to 0-based index
    }
    return true;
  };

  const handleFocus = () => {
    setIsEditing(true);
    setHasError(false);
    setErrorMessage('');
  };

  const handleBlur = () => {
    setIsEditing(false);
    const isValid = validateAndCommit(inputValue);
    if (!isValid) {
      // Reset to current position if invalid
      setInputValue(currentPosition.toString());
      // Clear error after a delay
      setTimeout(() => {
        setHasError(false);
        setErrorMessage('');
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const isValid = validateAndCommit(inputValue);
      if (isValid) {
        setIsEditing(false);
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(currentPosition.toString());
      setIsEditing(false);
      setHasError(false);
      setErrorMessage('');
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear error while typing
    if (hasError) {
      setHasError(false);
      setErrorMessage('');
    }
  };

  // Prevent drag events from interfering
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        className={`w-12 px-1 py-1 text-xs border rounded text-center transition-colors
          ${hasError 
            ? 'border-red-300 bg-red-50 text-red-900' 
            : isEditing 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        min="1"
        max={maxPosition}
        step="1"
        title={hasError ? errorMessage : `Position (1-${maxPosition})`}
        data-testid={`input-position-${propertyId}`}
      />
      {hasError && (
        <div className="absolute z-10 mt-1 px-2 py-1 text-xs text-red-700 bg-red-100 border border-red-300 rounded shadow-lg whitespace-nowrap">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

// Sortable Property Row Component
interface SortablePropertyRowProps {
  property: Property;
  index: number;
  currentPage: number;
  itemsPerPage: number;
  totalProperties: number;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, position: number) => void;
}

const SortablePropertyRow: React.FC<SortablePropertyRowProps> = ({
  property,
  index,
  currentPage,
  itemsPerPage,
  totalProperties,
  onToggleFeatured,
  onToggleActive,
  onDelete,
  onPositionChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${
        property.transaction_type === 'rent' 
          ? 'bg-gradient-to-r from-sky-50/30 to-transparent border-l-4 border-sky-400' 
          : ''
      } ${isDragging ? 'z-50' : ''}`}
    >
      <td className="px-2 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            title="Влачете за преподреждане"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <PositionInput
            currentPosition={(currentPage - 1) * itemsPerPage + index + 1}
            maxPosition={totalProperties}
            onPositionChange={(position) => onPositionChange(property.id, position)}
            propertyId={property.id}
          />
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <img
              className="h-12 w-12 rounded-lg object-cover"
              src={property.images?.[0]?.url || property.images?.[0]?.image_url || '/images/placeholder.jpg'}
              alt={property.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder.jpg';
              }}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
              {property.title}
            </div>
            <div className="text-sm text-gray-500">
              {property.property_type} • {property.area}м²
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          €{Math.floor(property.price).toLocaleString()}
        </div>
        <div className={`text-sm font-medium flex items-center gap-1 ${
          property.transaction_type === 'rent' 
            ? 'text-sky-600' 
            : 'text-gray-500'
        }`}>
          {property.transaction_type === 'rent' && (
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
          )}
          {property.transaction_type === 'sale' ? 'Продажба' : 'Под наем'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{property.city_region}</div>
        <div className="text-sm text-gray-500">{property.district}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            property.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {property.active ? 'Активен' : 'Неактивен'}
          </span>
          {property.featured && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Препоръчан
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <Link
            to={`/properties/${property.property_code}`}
            target="_blank"
            className="text-blue-600 hover:text-blue-900 p-1 rounded"
            title="Преглед"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/edit/${property.id}`}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
            title="Редактиране"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onToggleFeatured(property.id, property.featured)}
            className={`p-1 rounded ${
              property.featured 
                ? 'text-yellow-600 hover:text-yellow-900' 
                : 'text-gray-400 hover:text-yellow-600'
            }`}
            title={property.featured ? 'Премахни от препоръчани' : 'Добави в препоръчани'}
          >
            <Star className="w-4 h-4" fill={property.featured ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => onToggleActive(property.id, property.active)}
            className={`px-2 py-1 text-xs rounded ${
              property.active 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            title={property.active ? 'Деактивирай' : 'Активирай'}
          >
            {property.active ? 'Скрий' : 'Покажи'}
          </button>
          <button
            onClick={() => onDelete(property.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded"
            title="Изтриване"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [sortedProperties, setSortedProperties] = useState<Property[]>([]);
  const itemsPerPage = 10;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Legacy localStorage functions removed - using database sort_order only

  // Legacy functions removed - using database sort_order only

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedProperties.findIndex(p => p.id === active.id);
    const newIndex = sortedProperties.findIndex(p => p.id === over.id);
    
    // Guard against invalid indexes
    if (oldIndex < 0 || newIndex < 0) return;
    
    // Calculate global position for the target
    const globalNewPosition = (currentPage - 1) * itemsPerPage + newIndex;
    
    try {
      // Use global position update for cross-page compatibility
      await updateGlobalPosition(active.id as string, globalNewPosition);
      
      // Refresh the current page to reflect the new order
      await fetchProperties(currentPage);
    } catch (error) {
      console.error('Error updating drag position:', error);
      setError('Грешка при обновяване на подредбата');
    }
  };

  // Update global position across all pages
  const updateGlobalPosition = async (propertyId: string, targetPosition: number) => {
    try {
      // Robust fetch with multiple fallback strategies
      let allProperties: Property[] = [];
      
      // Strategy 1: Use totalProperties if available
      if (totalProperties > 0) {
        const result = await apiService.getProperties({ active: 'all' }, 1, totalProperties);
        if (result.success && result.data && result.data.length > 0) {
          allProperties = result.data;
        }
      }
      
      // Strategy 2: Fallback to high limit if first attempt failed
      if (allProperties.length === 0) {
        const fallbackResult = await apiService.getProperties({ active: 'all' }, 1, 1000);
        if (fallbackResult.success && fallbackResult.data) {
          allProperties = fallbackResult.data;
        }
      }
      
      // Strategy 3: If still empty, try paginated fetch
      if (allProperties.length === 0) {
        let page = 1;
        const pageSize = 50;
        let hasMore = true;
        
        while (hasMore && page <= 20) { // Safety limit
          const pageResult = await apiService.getProperties({ active: 'all' }, page, pageSize);
          if (pageResult.success && pageResult.data && pageResult.data.length > 0) {
            allProperties.push(...pageResult.data);
            hasMore = pageResult.data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }
      }
      
      // Final validation
      if (allProperties.length === 0) {
        throw new Error('Unable to fetch properties for reordering');
      }
      
      // Find the property to move
      const propertyIndex = allProperties.findIndex(p => p.id === propertyId);
      if (propertyIndex === -1) {
        throw new Error('Property not found in current list');
      }

      // Remove the property from its current position
      const [movedProperty] = allProperties.splice(propertyIndex, 1);
      
      // Insert it at the target position
      allProperties.splice(targetPosition, 0, movedProperty);

      // Create new global order with updated sort_order values
      const orders = allProperties.map((property, index) => ({
        id: property.id,
        sort_order: index + 1
      }));

      // Update the database with the new global order
      const result = await apiService.updatePropertyOrder(orders);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update property order');
      }

      // Clear localStorage cache to force refresh from database
      localStorage.removeItem('property-custom-order');
      setCustomOrder([]);

    } catch (error) {
      throw error;
    }
  };

  // Handle position change from numeric input
  const handlePositionChange = async (propertyId: string, newPosition: number) => {
    // For global reordering, allow positions from 0 to totalProperties-1
    const clampedPosition = Math.max(0, Math.min(newPosition, totalProperties - 1));
    
    try {
      // Create a new global order by inserting the property at the target position
      await updateGlobalPosition(propertyId, clampedPosition);
      
      // Refresh the properties list to reflect the new order
      await fetchProperties(currentPage);
    } catch (error) {
      console.error('Error updating global position:', error);
      setError('Грешка при обновяване на позицията');
    }
  };

  // Reset to default order
  const resetOrder = () => {
    localStorage.removeItem('property-custom-order');
    setCustomOrder([]);
    setSortedProperties(properties);
  };

  useEffect(() => {
    // Check authentication
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    fetchProperties();
    // Custom order loading disabled - using database sort_order only
  }, [navigate]);

  // Apply custom order when properties or custom order changes
  useEffect(() => {
    // Use database ordering directly - properties are already sorted by sort_order
    setSortedProperties(properties);
  }, [properties]);

  const fetchProperties = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const result = await apiService.getProperties({ active: 'all' }, page, itemsPerPage);
      if (result.success && result.data) {
        setProperties(result.data);
        if (result.meta) {
          setTotalPages(result.meta.pages || 1);
          setTotalProperties(result.meta.total || 0);
          setCurrentPage(result.meta.page || 1);
        }
      } else {
        setError(result.error || 'Грешка при зареждане на имотите');
      }
    } catch (error) {
      setError('Грешка при зареждане на имотите');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await apiService.deleteProperty(id);
      if (result.success) {
        setProperties(prev => prev.filter(p => p.id !== id));
        setDeleteId(null);
        // Refresh the current page to maintain pagination
        fetchProperties(currentPage);
      } else {
        setError(result.error || 'Грешка при изтриване');
      }
    } catch (error) {
      setError('Грешка при изтриване');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchProperties(page);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/admin/login');
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      // Optimistic update
      setProperties(prev => prev.map(p => 
        p.id === id ? { ...p, featured: !featured } : p
      ));

      const result = await apiService.updateProperty(id, { featured: !featured });
      if (result.success) {
        // Trigger a refresh of featured properties on homepage
        window.dispatchEvent(new CustomEvent('featuredPropertiesChanged'));
      } else {
        // Revert on error
        setProperties(prev => prev.map(p => 
          p.id === id ? { ...p, featured: featured } : p
        ));
        setError(result.error || 'Грешка при обновяване');
      }
    } catch (error) {
      // Revert on error
      setProperties(prev => prev.map(p => 
        p.id === id ? { ...p, featured: featured } : p
      ));
      setError('Грешка при обновяване');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const result = await apiService.updateProperty(id, { active: !active });
      if (result.success) {
        setProperties(prev => prev.map(p => 
          p.id === id ? { ...p, active: !active } : p
        ));
      }
    } catch (error) {
      setError('Грешка при обновяване');
    }
  };

  if (loading) {
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
              <img 
                src="/logo.png" 
                alt="ConsultingG Logo" 
                className="w-12 h-12 rounded-xl object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">ConsultingG Real Estate</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Виж сайта
              </Link>
              <Link
                to="/admin/services"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Услуги
              </Link>
              <Link
                to="/admin/pages"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Страници
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Изход
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общо имоти</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активни</p>
                <p className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.active).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Препоръчани</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => p.featured).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">За продажба</p>
                <p className="text-2xl font-bold text-purple-600">
                  {properties.filter(p => p.transaction_type === 'sale').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Управление на имоти</h2>
              {customOrder.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-600">
                    Персонализиран ред активен
                  </span>
                  <button
                    onClick={resetOrder}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Възстанови оригиналния ред"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Нулирай реда
                  </button>
                </div>
              )}
            </div>
            <Link
              to="/admin/new"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Добави имот
            </Link>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ред
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имот
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Локация
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <SortableContext
                  items={sortedProperties.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProperties.map((property, index) => (
                      <SortablePropertyRow
                        key={property.id}
                        property={property}
                        index={index}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalProperties={totalProperties}
                        onToggleFeatured={toggleFeatured}
                        onToggleActive={toggleActive}
                        onDelete={setDeleteId}
                        onPositionChange={handlePositionChange}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>

          {properties.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма имоти</h3>
              <p className="text-gray-500 mb-4">Започнете като добавите първия имот</p>
              <Link
                to="/admin/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добави имот
              </Link>
            </div>
          )}

          {/* Pagination Controls */}
          {properties.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Показани <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> до{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProperties)}</span> от{' '}
                  <span className="font-medium">{totalProperties}</span> имота
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Предишна
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageNumber === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Следваща
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Потвърждение за изтриване</h3>
            <p className="text-gray-600 mb-6">
              Сигурни ли сте, че искате да изтриете този имот? Това действие не може да бъде отменено.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отказ
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Изтрий
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};