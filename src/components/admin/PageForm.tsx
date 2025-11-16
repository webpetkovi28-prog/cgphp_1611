import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { apiService } from '../../services/api';

interface PageFormData {
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  active: boolean;
}

export const PageForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<PageFormData>({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    active: true
  });

  useEffect(() => {
    if (isEdit && id) {
      loadPage(id);
    }
  }, [isEdit, id]);

  const loadPage = async (pageId: string) => {
    setLoading(true);
    try {
      const result = await apiService.getPage(pageId);
      if (result.success && result.data) {
        setFormData({
          slug: result.data.slug,
          title: result.data.title,
          content: result.data.content,
          meta_description: result.data.meta_description || '',
          active: result.data.active
        });
      } else {
        setError(result.error || 'Грешка при зареждане на страницата');
      }
    } catch (error) {
      setError('Грешка при зареждане на страницата');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PageFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      if (isEdit && id) {
        result = await apiService.updatePage(id, formData);
      } else {
        result = await apiService.createPage(formData);
      }

      if (result.success) {
        navigate('/admin/pages');
      } else {
        setError(result.error || 'Грешка при запазване на страницата');
      }
    } catch (error) {
      setError('Грешка при запазване на страницата');
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
                onClick={() => navigate('/admin/pages')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Редактиране на страница' : 'Добавяне на нова страница'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Редактирайте информацията за страницата' : 'Попълнете всички полета за новата страница'}
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
                  placeholder="Например: За нас"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL адрес *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="about"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta описание
                </label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Кратко описание за SEO"
                />
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
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="<h2>Заглавие</h2><p>Съдържание...</p>"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Можете да използвате HTML тагове за форматиране на текста.
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Настройки</h2>
            
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Активна страница</span>
              </label>
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
              onClick={() => navigate('/admin/pages')}
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
                  {isEdit ? 'Обнови страница' : 'Създай страница'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};