import { Helmet } from 'react-helmet-async';
import React from 'react';
import { SearchForm } from './SearchForm';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, TrendingUp, Award, Users } from 'lucide-react';
import Navbar from './Navbar';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (searchParams: any) => {
    // Convert search parameters to URL query string
    const queryParams = new URLSearchParams();
    
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] && searchParams[key] !== '') {
        queryParams.append(key, searchParams[key]);
      }
    });
    
    // Navigate to properties page with search parameters
    const queryString = queryParams.toString();
    navigate(`/properties${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-visible">
      {/* SEO Meta Tags for Homepage */}
      <Helmet>
        <title>ConsultingG Real Estate - Недвижими имоти в България | Продажба и Наем</title>
        <meta name="description" content="Водещата платформа за недвижими имоти в България с над 15 години опит. Намерете перфектния дом, апартамент или инвестиция. Професионални услуги за продажба и наем." />
        <meta name="keywords" content="недвижими имоти българия, имоти софия, апартаменти продажба, къщи наем, консултинг недвижими имоти, брокер имоти софия, инвестиции недвижими имоти" />
        <link rel="canonical" href="https://consultingg.com" />
        
        {/* Structured Data for Website */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ConsultingG Real Estate",
          "description": "Водещата платформа за недвижими имоти в България",
          "url": "https://consultingg.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://consultingg.com/properties?keyword={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ConsultingG Real Estate",
            "logo": "https://consultingg.com/logo.png"
          }
        })}
        </script>
      </Helmet>

      {/* Elegant Building Outlines */}
      <div className="absolute inset-0 opacity-10">
        {/* Modern Skyscraper - Left */}
        <svg className="absolute left-10 top-20 w-32 h-80" viewBox="0 0 120 300" fill="none">
          <path d="M20 300V50L40 30H80L100 50V300H20Z" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
          <path d="M30 80H90M30 100H90M30 120H90M30 140H90M30 160H90M30 180H90M30 200H90M30 220H90M30 240H90M30 260H90" stroke="white" strokeWidth="0.5" opacity="0.2"/>
          <rect x="35" y="60" width="8" height="12" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="50" y="60" width="8" height="12" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="65" y="60" width="8" height="12" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="80" y="60" width="8" height="12" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
        </svg>

        {/* Residential Building - Right */}
        <svg className="absolute right-20 top-32 w-28 h-64" viewBox="0 0 100 240" fill="none">
          <path d="M10 240V40L30 20H70L90 40V240H10Z" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
          <path d="M20 60H80M20 80H80M20 100H80M20 120H80M20 140H80M20 160H80M20 180H80M20 200H80" stroke="white" strokeWidth="0.5" opacity="0.2"/>
          <rect x="25" y="45" width="6" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="40" y="45" width="6" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="55" y="45" width="6" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
          <rect x="70" y="45" width="6" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.25"/>
        </svg>

        {/* Office Complex - Center Background */}
        <svg className="absolute left-1/2 top-16 transform -translate-x-1/2 w-40 h-72" viewBox="0 0 150 270" fill="none">
          <path d="M25 270V60L45 40H105L125 60V270H25Z" stroke="white" strokeWidth="1" fill="none" opacity="0.2"/>
          <path d="M35 80H115M35 100H115M35 120H115M35 140H115M35 160H115M35 180H115M35 200H115M35 220H115M35 240H115" stroke="white" strokeWidth="0.5" opacity="0.15"/>
          <rect x="40" y="65" width="7" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="55" y="65" width="7" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="70" y="65" width="7" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="85" y="65" width="7" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="100" y="65" width="7" height="10" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
        </svg>

        {/* Small Buildings - Bottom Left */}
        <svg className="absolute left-32 bottom-32 w-24 h-48" viewBox="0 0 90 180" fill="none">
          <path d="M5 180V80L15 70H35L45 80V180H5Z" stroke="white" strokeWidth="1" fill="none" opacity="0.25"/>
          <path d="M50 180V100L60 90H80L90 100V180H50Z" stroke="white" strokeWidth="1" fill="none" opacity="0.25"/>
          <rect x="10" y="85" width="5" height="8" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="20" y="85" width="5" height="8" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <rect x="30" y="85" width="5" height="8" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
        </svg>

        {/* Modern Tower - Right Background */}
        <svg className="absolute right-32 bottom-20 w-20 h-60" viewBox="0 0 75 225" fill="none">
          <path d="M15 225V45L25 35H50L60 45V225H15Z" stroke="white" strokeWidth="1" fill="none" opacity="0.2"/>
          <path d="M20 60H55M20 75H55M20 90H55M20 105H55M20 120H55M20 135H55M20 150H55M20 165H55M20 180H55M20 195H55" stroke="white" strokeWidth="0.5" opacity="0.15"/>
          <circle cx="30" cy="52" r="2" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
          <circle cx="45" cy="52" r="2" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2"/>
        </svg>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="ConsultingG Logo" 
              className="w-24 h-24 rounded-xl shadow-lg object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">ConsultingG</h1>
              <p className="text-blue-200 text-sm">Real Estate</p>
            </div>
          </div>
          
          <Navbar />
        </header>

        {/* Hero Content */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Намерете своя
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              перфектен дом
            </span>
          </h2>
        </div>

        {/* Search Form */}
        <div className="max-w-6xl mx-auto">
          <SearchForm onSearch={handleSearch} />
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" fill="none" className="w-full h-20">
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="white" fillOpacity="0.1"/>
        </svg>
      </div>
    </div>
  );
};