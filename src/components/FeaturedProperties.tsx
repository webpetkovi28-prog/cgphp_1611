import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Eye } from 'lucide-react';
import { apiService } from '../services/api';
import { Property } from '../types/property';


export const FeaturedProperties: React.FC = () => {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  React.useEffect(() => {
    fetchFeaturedProperties();
    
    // Listen for changes from admin panel
    const handleFeaturedPropertiesChanged = () => {
      fetchFeaturedProperties();
    };
    
    window.addEventListener('featuredPropertiesChanged', handleFeaturedPropertiesChanged);
    
    return () => {
      window.removeEventListener('featuredPropertiesChanged', handleFeaturedPropertiesChanged);
    };
  }, [currentPage]);

  const fetchFeaturedProperties = async () => {
    setLoading(true);
    try {
      const result = await apiService.getProperties({ featured: 'true' }, currentPage, 16);
      if (result.success && result.data) {
        setFeaturedProperties(result.data);
        setMeta(result.meta || {});
      }
    } catch (error) {
      console.error('Error fetching featured properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Препоръчани имоти</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Открийте най-добрите предложения, селектирани специално за вас
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Препоръчани имоти</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Открийте най-добрите предложения, селектирани специално за вас
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProperties.map((property) => {
            const key = property.property_code || property.id;
            if (!key) {
              console.error('Property missing both property_code and id:', property);
              return null;
            }
            return (
            <Link
              to={`/properties/${key}`}
              key={key}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-2 ${
                property.transaction_type === 'rent' 
                  ? 'ring-2 ring-sky-200 bg-gradient-to-br from-white to-sky-50' 
                  : ''
              }`}
            >
              <div className="relative">
                <img
                  src={property.images?.[0]?.url || property.images?.[0]?.image_url || '/images/1_kachta_simeonovo.jpg'}
                  alt={property.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/1_kachta_simeonovo.jpg';
                  }}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {property.transaction_type === 'rent' && (
                    <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Под наем
                    </div>
                  )}
                  {property.featured && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      Препоръчан
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:text-blue-600 transition-all duration-200 shadow-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {property.district ? `${property.district}, ` : ''}{property.city_region || 'Всички области'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {property.title}
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-blue-600">
                    €{Math.floor(property.price || 0).toLocaleString()}
                    {property.transaction_type === 'rent' && (
                      <span className="text-sm text-sky-600 font-medium">/месец</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-600">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      <span className="text-sm">{property.bedrooms}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span className="text-sm">{property.bathrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="w-4 h-4" />
                    <span className="text-sm">{property.area || 0} м²</span>
                  </div>
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          {/* Pagination for featured properties */}
          {meta.pages > 1 && (
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!meta.hasPrev}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                
                {Array.from({ length: meta.pages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-4 py-2 rounded-lg ${
                      pageNumber === currentPage
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(meta.pages, prev + 1))}
                  disabled={!meta.hasNext}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Напред
                </button>
              </div>
            </div>
          )}
          
          <Link
            to="/properties"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Вижте всички имоти
          </Link>
        </div>
      </div>
    </section>
  );
};