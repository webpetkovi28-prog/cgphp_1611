import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, Plus, FileText, ArrowLeft } from 'lucide-react';
import { apiService } from '../../services/api';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const PagesList: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const result = await apiService.getPages();
      if (result.success && result.data) {
        setPages(result.data);
      } else {
        setError(result.error || 'Грешка при зареждане на страниците');
      }
    } catch (error) {
      setError('Грешка при зареждане на страниците');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await apiService.deletePage(id);
      if (result.success) {
        setPages(prev => prev.filter(p => p.id !== id));
        setDeleteId(null);
      } else {
        setError(result.error || 'Грешка при изтриване');
      }
    } catch (error) {
      setError('Грешка при изтриване');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const result = await apiService.updatePage(id, { active: !active });
      if (result.success) {
        setPages(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p));
      } else {
        setError(result.error || 'Грешка при обновяване');
      }
    } catch (error) {
      setError('Грешка при обновяване');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад към панел
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Страници</h1>
            <p className="text-gray-600">Управление на всички страници ({pages.length} общо)</p>
          </div>
        </div>
        <Link
          to="/admin/pages/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Добави страница
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Страница
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {page.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {page.meta_description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">/{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      page.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {page.active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/${page.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Преглед"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/pages/${page.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Редактиране"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleActive(page.id, page.active)}
                        className={`px-2 py-1 text-xs rounded ${
                          page.active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={page.active ? 'Деактивирай' : 'Активирай'}
                      >
                        {page.active ? 'Скрий' : 'Покажи'}
                      </button>
                      <button
                        onClick={() => setDeleteId(page.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Изтриване"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Потвърждение за изтриване</h3>
            <p className="text-gray-600 mb-6">
              Сигурни ли сте, че искате да изтриете тази страница? Това действие не може да бъде отменено.
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