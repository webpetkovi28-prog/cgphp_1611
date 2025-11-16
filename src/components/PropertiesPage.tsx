import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Eye, Filter } from 'lucide-react';
import { SearchForm } from './SearchForm';
import { Footer } from './Footer';
import { apiService } from '../services/api';
import { Property } from '../types/property';
import Navbar from './Navbar';
import { useProperties } from '../hooks/useProperties';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState<any>({});

  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 16; // 4x4 grid

  // Parse URL parameters on component mount
  useEffect(() => {
    const pageParam = urlSearchParams.get('page');

    const initialPage = pageParam ? parseInt(pageParam) : 1;

    setCurrentPage(initialPage);

    const urlParams = new URLSearchParams(urlSearchParams.toString());
    const params: any = {};
    
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    
    setSearchParams(params);
    fetchPropertiesData(params, initialPage);
  }, []);

  const fetchPropertiesData = async (filters?: any, page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getProperties(filters, page, propertiesPerPage);
      if (result.success && result.data) {
        setProperties(result.data);
        setMeta(result.meta || {});
      } else {
        setProperties([]);
        setError(result.error || 'Грешка при зареждане на имотите');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setError('Грешка при зареждане на имотите');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters?: any) => {
    setSearchParams(filters || {});
    fetchPropertiesData(filters, 1);
    setCurrentPage(1); // Reset to first page on new search
    const newSearchParams = new URLSearchParams(filters);
    newSearchParams.set('page', '1');
    setUrlSearchParams(newSearchParams);
  };


  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    fetchPropertiesData(searchParams, pageNumber);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', pageNumber.toString());
    setUrlSearchParams(newSearchParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Имоти за продажба и наем в България - ConsultingG Real Estate</title>
        <meta name="description" content="Разгледайте всички налични имоти за продажба и наем в България. Апартаменти, къщи, офиси и други недвижими имоти от ConsultingG Real Estate." />
        <meta name="keywords" content="имоти продажба, имоти наем, апартаменти софия, къщи продажба, недвижими имоти българия" />
        <link rel="canonical" href="https://consultingg.com/properties" />
        
        <meta property="og:title" content="Имоти за продажба и наем в България - ConsultingG Real Estate" />
        <meta property="og:description" content="Разгледайте всички налични имоти за продажба и наем в България" />
        <meta property="og:url" content="https://consultingg.com/properties" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]`}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png" 
                alt="ConsultingG Logo" 
                className="w-24 h-24 rounded-xl shadow-lg object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">ConsultingG</h1>
                <p className="text-blue-200 text-sm">Real Estate</p>
              </div>
            </Link>
            
            <Navbar />
          </div>
          
          {/* Page Header */}
          <div className="text-center pb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Всички
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                имоти
              </span>
            </h1>
            <p className="text-xl text-blue-200">Открийте перфектния имот за вас</p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" fill="none" className="w-full h-20">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Search Filters */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Скрий филтрите' : 'Покажи филтрите'}
            </button>
          </div>
          
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100 mb-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h6m-6 4h6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Няма намерени имоти</h3>
            <p className="text-gray-600 mb-6">Няма имоти, които отговарят на зададените критерии.</p>
            <button
              onClick={() => fetchPropertiesData()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Покажи всички имоти
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
            {properties.map((property) => {
              const key = property.property_code || property.id;
              if (!key) {
                console.error('Property missing both property_code and id:', property);
                return null;
              }

              const mainImage =
                property.images?.find(img => (img as any).is_main) ??
                property.images?.[0];

              const mainImageUrl =
                (mainImage as any)?.thumbnail_url ||
                (mainImage as any)?.image_url ||
                (mainImage as any)?.url ||
                '/images/1_kachta_simeonovo.jpg';

              return (
              <Link
                to={`/properties/${key}`}
                key={key}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-2 border border-gray-100 ${
                  property.transaction_type === 'rent' 
                    ? 'ring-2 ring-sky-200 bg-gradient-to-br from-white to-sky-50 hover:border-sky-300' 
                    : 'hover:border-blue-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={mainImageUrl}
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
        )}

        {/* Pagination */}
        {properties.length > 0 && meta.pages > 1 && (
          <div className="flex justify-center bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => paginate(meta.page - 1)}
                disabled={!meta.hasPrev}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Предишна
              </button>
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className={`px-4 py-2 rounded-lg ${
                    pageNumber === meta.page
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => paginate(meta.page + 1)}
                disabled={!meta.hasNext}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Следваща
              </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};