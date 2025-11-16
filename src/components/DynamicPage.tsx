import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Footer } from './Footer';
import Navbar from './Navbar';
import { apiService } from '../services/api';

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  active: boolean;
}

export const DynamicPage: React.FC = () => {
  const { slug } = useParams();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchPage(slug);
    }
  }, [slug]);

  const fetchPage = async (pageSlug: string) => {
    try {
      const result = await apiService.getPageBySlug(pageSlug);
      if (result.success && result.data) {
        setPageData(result.data);
      } else {
        setError(result.error || 'Страницата не е намерена');
      }
    } catch (error) {
      setError('Грешка при зареждане на страницата');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="relative z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-3">
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
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Страницата не е намерена</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link 
              to="/" 
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Върнете се към началната страница
            </Link>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageData.title} - ConsultingG Real Estate</title>
        <meta name="description" content={pageData.meta_description || `${pageData.title} - ConsultingG Real Estate`} />
        <link rel="canonical" href={`https://consultingg.com/${pageData.slug}`} />
        
        <meta property="og:title" content={`${pageData.title} - ConsultingG Real Estate`} />
        <meta property="og:description" content={pageData.meta_description || pageData.title} />
        <meta property="og:url" content={`https://consultingg.com/${pageData.slug}`} />
        <meta property="og:type" content="article" />
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
              {pageData.title}
            </h1>
            {pageData.meta_description && (
              <p className="text-xl text-blue-200">{pageData.meta_description}</p>
            )}
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};