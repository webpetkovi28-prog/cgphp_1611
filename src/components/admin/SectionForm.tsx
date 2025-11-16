import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { apiService } from '../../services/api';

interface SectionFormData {
  page_id: string;
  title: string;
  content: string;
  section_type: string;
  sort_order: number;
  active: boolean;
  meta_data?: any;
}

const sectionTypes = [
  { value: 'hero', label: 'Главна секция' },
  { value: 'about', label: 'За нас' },
  { value: 'services', label: 'Услуги' },
  { value: 'features', label: 'Характеристики' },
  { value: 'testimonials', label: 'Отзиви' },
  { value: 'contact', label: 'Контакти' },
  { value: 'footer', label: 'Футър' }
];

export const SectionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pages, setPages] = useState<Array<{id: string; title: string}>>([]);
  const [formData, setFormData] = useState<SectionFormData>({
    page_id: 'page-001',
    title: '',
    content: '',
    section_type: 'hero',
    sort_order: 1,
    active: true
  });

  useEffect(() => {
    fetchPages();
    if (isEdit && id) {
      loadSection(id);
    }
  }, [isEdit, id]);

  const fetchPages = async () => {
    try {
      const result = await apiService.getPages();
      if (result.success && result.data) {
        setPages(result.data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const loadSection = async (sectionId: string) => {
    setLoading(true);
    try {
      const result = await apiService.getSection(sectionId);
      if (result.success && result.data) {
        setFormData({
          page_id: result.data.page_id,
          title: result.data.title,
          content: result.data.content,
          section_type: result.data.section_type,
          sort_order: result.data.sort_order || 1,
          active: result.data.active,
          meta_data: result.data.meta_data
        });
      } else {
        setError(result.error || 'Грешка при зареждане на секцията');
      }
    } catch (error) {
      setError('Грешка при зареждане на секцията');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isEdit && id) {
        result = await apiService.updateSection(id, formData);
      } else {
        result = await apiService.createSection(formData);
      }

      if (result.success) {
        navigate('/admin/sections');
      } else {
        setError(result.error || 'Грешка при запазване на секцията');
      }
    } catch (error) {
      setError('Грешка при запазване на секцията');
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
                onClick={() => navigate('/admin/sections')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Редактиране на секция' : 'Добавяне на нова секция'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Редактирайте информацията за секцията' : 'Попълнете всички полета за новата секция'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заглавие *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например: Главна секция"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип секция *
                </label>
                <select
                  value={formData.section_type}
                  onChange={(e) => handleInputChange('section_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {sectionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Страница *
                </label>
                <select
                  value={formData.page_id}
                  onChange={(e) => handleInputChange('page_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {pages.map(page => (
                    <option key={page.id} value={page.id}>{page.title}</option>
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
                  <span className="text-sm font-medium text-gray-700">Активна секция</span>
                </label>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Съдържание</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML съдържание *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="<h2>Заглавие</h2><p>Съдържание...</p>"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Можете да използвате HTML тагове за форматиране на текста.
              </p>
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
              onClick={() => navigate('/admin/sections')}
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
                  {isEdit ? 'Обнови секция' : 'Създай секция'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};