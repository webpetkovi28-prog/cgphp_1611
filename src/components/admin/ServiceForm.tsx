import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { apiService } from '../../services/api';

interface ServiceFormData {
  title: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  active: boolean;
}

const iconOptions = [
  { value: 'Home', label: 'Дом' },
  { value: 'TrendingUp', label: 'Тенденция нагоре' },
  { value: 'Shield', label: 'Щит' },
  { value: 'Users', label: 'Потребители' },
  { value: 'Award', label: 'Награда' },
  { value: 'Headphones', label: 'Слушалки' },
  { value: 'Settings', label: 'Настройки' },
  { value: 'Star', label: 'Звезда' },
  { value: 'Heart', label: 'Сърце' },
  { value: 'Phone', label: 'Телефон' }
];

const colorOptions = [
  { value: 'from-blue-500 to-blue-600', label: 'Син' },
  { value: 'from-green-500 to-green-600', label: 'Зелен' },
  { value: 'from-purple-500 to-purple-600', label: 'Лилав' },
  { value: 'from-orange-500 to-orange-600', label: 'Оранжев' },
  { value: 'from-red-500 to-red-600', label: 'Червен' },
  { value: 'from-indigo-500 to-indigo-600', label: 'Индиго' },
  { value: 'from-pink-500 to-pink-600', label: 'Розов' },
  { value: 'from-yellow-500 to-yellow-600', label: 'Жълт' }
];

export const ServiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    icon: 'Home',
    color: 'from-blue-500 to-blue-600',
    sort_order: 1,
    active: true
  });

  useEffect(() => {
    if (isEdit && id) {
      loadService(id);
    }
  }, [isEdit, id]);

  const loadService = async (serviceId: string) => {
    setLoading(true);
    try {
      const result = await apiService.getService(serviceId);
      if (result.success && result.data) {
        setFormData({
          title: result.data.title,
          description: result.data.description,
          icon: result.data.icon,
          color: result.data.color,
          sort_order: result.data.sort_order,
          active: result.data.active
        });
      } else {
        setError(result.error || 'Грешка при зареждане на услугата');
      }
    } catch (error) {
      console.error('Error loading service:', error);
      setError('Грешка при зареждане на услугата');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      if (isEdit && id) {
        result = await apiService.updateService(id, formData);
      } else {
        result = await apiService.createService(formData);
      }

      if (result.success) {
        navigate('/admin/services');
      } else {
        setError(result.error || 'Грешка при запазване на услугата');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      setError('Грешка при запазване на услугата');
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
                onClick={() => navigate('/admin/services')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Редактиране на услуга' : 'Добавяне на нова услуга'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Редактирайте информацията за услугата' : 'Попълнете всички полета за новата услуга'}
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
                  placeholder="Например: Продажба на имоти"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Кратко описание на услугата..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Икона *
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цвят *
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ред на показване
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Активна услуга</span>
                </label>
              </div>
            </div>
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
              onClick={() => navigate('/admin/services')}
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
                  {isEdit ? 'Обнови услуга' : 'Създай услуга'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};