import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Settings, ArrowLeft } from 'lucide-react';
import { apiService } from '../../services/api';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  active: boolean;
}

export const ServicesList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiService.getServices();
      console.log('Services API result:', result);
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        console.error('Services API error:', result.error);
        setError(result.error || 'Грешка при зареждане на услугите');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Грешка при зареждане на услугите');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await apiService.deleteService(id);
      console.log('Delete service result:', result);
      if (result.success) {
        setServices(prev => prev.filter(s => s.id !== id));
        setDeleteId(null);
      } else {
        console.error('Delete service error:', result.error);
        setError(result.error || 'Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Грешка при изтриване');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const result = await apiService.updateService(id, { active: !active });
      console.log('Toggle active result:', result);
      if (result.success) {
        setServices(prev => prev.map(s => s.id === id ? { ...s, active: !active } : s));
      } else {
        console.error('Toggle active error:', result.error);
        setError(result.error || 'Грешка при обновяване');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Грешка при обновяване');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="h-16 w-16 bg-gray-200 rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Услуги</h1>
            <p className="text-gray-600">Управление на всички услуги ({services.length} общо)</p>
          </div>
        </div>
        <Link
          to="/admin/services/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Добави услуга
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-4`}>
                <Settings className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {service.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {service.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  service.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.active ? 'Активна' : 'Неактивна'}
                </span>
                <span className="text-xs text-gray-500">
                  Ред: {service.sort_order}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/services/${service.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Редактирай
                </Link>
                <button
                  onClick={() => toggleActive(service.id, service.active)}
                  className={`px-3 py-2 text-xs rounded-lg ${
                    service.active 
                      ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  title={service.active ? 'Деактивирай' : 'Активирай'}
                >
                  {service.active ? 'Скрий' : 'Покажи'}
                </button>
                <button
                  onClick={() => setDeleteId(service.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Изтриване"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Потвърждение за изтриване</h3>
            <p className="text-gray-600 mb-6">
              Сигурни ли сте, че искате да изтриете тази услуга? Това действие не може да бъде отменено.
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