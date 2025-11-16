import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Layout, ArrowUp, ArrowDown } from 'lucide-react';
import { apiService } from '../../services/api';

interface Section {
  id: string;
  page_id: string;
  title: string;
  content: string;
  section_type: string;
  sort_order: number;
  active: boolean;
  meta_data?: any;
  page_title?: string;
  created_at: string;
  updated_at: string;
}

const sectionTypeLabels: Record<string, string> = {
  hero: 'Главна секция',
  about: 'За нас',
  services: 'Услуги',
  testimonials: 'Отзиви',
  contact: 'Контакти',
  footer: 'Футър',
  features: 'Характеристики'
};

export const SectionsList: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchSections();
  }, [filterType]);

  const fetchSections = async () => {
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const result = await apiService.getSections(params);
      if (result.success && result.data) {
        setSections(result.data);
      } else {
        setError(result.error || 'Грешка при зареждане на секциите');
      }
    } catch (error) {
      setError('Грешка при зареждане на секциите');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await apiService.deleteSection(id);
      if (result.success) {
        setSections(prev => prev.filter(s => s.id !== id));
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
      const result = await apiService.updateSection(id, { active: !active });
      if (result.success) {
        setSections(prev => prev.map(s => s.id === id ? { ...s, active: !active } : s));
      } else {
        setError(result.error || 'Грешка при обновяване');
      }
    } catch (error) {
      setError('Грешка при обновяване');
    }
  };

  const moveSectionUp = async (index: number) => {
    if (index === 0) return;
    
    const newSections = [...sections];
    const temp = newSections[index - 1].sort_order;
    newSections[index - 1].sort_order = newSections[index].sort_order;
    newSections[index].sort_order = temp;
    
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    
    setSections(newSections);
    await updateSortOrder(newSections);
  };

  const moveSectionDown = async (index: number) => {
    if (index === sections.length - 1) return;
    
    const newSections = [...sections];
    const temp = newSections[index + 1].sort_order;
    newSections[index + 1].sort_order = newSections[index].sort_order;
    newSections[index].sort_order = temp;
    
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    
    setSections(newSections);
    await updateSortOrder(newSections);
  };

  const updateSortOrder = async (sectionsToUpdate: Section[]) => {
    try {
      const sectionsData = sectionsToUpdate.map(section => ({
        id: section.id,
        sort_order: section.sort_order
      }));
      
      await apiService.updateSectionsSortOrder({ sections: sectionsData });
    } catch (error) {
      setError('Грешка при обновяване на реда');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Секции</h1>
          <p className="text-gray-600">Управление на всички секции ({sections.length} общо)</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Всички типове</option>
            {Object.entries(sectionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Link
            to="/admin/sections/new"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Добави секция
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Секция
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Страница
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Ред
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
              {sections.map((section, index) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Layout className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {section.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {section.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {sectionTypeLabels[section.section_type] || section.section_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{section.page_title || 'Неизвестна'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{section.sort_order}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Премести нагоре"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveSectionDown(index)}
                          disabled={index === sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Премести надолу"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      section.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {section.active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/sections/${section.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Редактиране"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleActive(section.id, section.active)}
                        className={`px-2 py-1 text-xs rounded ${
                          section.active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={section.active ? 'Деактивирай' : 'Активирай'}
                      >
                        {section.active ? 'Скрий' : 'Покажи'}
                      </button>
                      <button
                        onClick={() => setDeleteId(section.id)}
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

        {sections.length === 0 && !loading && (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Няма секции</h3>
            <p className="text-gray-500 mb-4">Започнете като добавите първата секция</p>
            <Link
              to="/admin/sections/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добави секция
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Потвърждение за изтриване</h3>
            <p className="text-gray-600 mb-6">
              Сигурни ли сте, че искате да изтриете тази секция? Това действие не може да бъде отменено.
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