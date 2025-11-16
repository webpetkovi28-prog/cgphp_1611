import { Helmet } from 'react-helmet-async';
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Footer } from './Footer';
import Navbar from './Navbar';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Контакти - ConsultingG Real Estate</title>
        <meta name="description" content="Свържете се с ConsultingG Real Estate - телефон 0888825445, имейл office@consultingg.com, адрес бул. Янко Съкъзов 16, София. Професионални консултации за недвижими имоти." />
        <meta name="keywords" content="контакти консултинг, недвижими имоти софия, телефон брокер, имейл консултации, офис адрес" />
        <link rel="canonical" href="https://consultingg.com/contact" />
        
        {/* Local Business Structured Data */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://consultingg.com/#organization",
          "name": "ConsultingG Real Estate",
          "description": "Водещата компания за недвижими имоти в България",
          "url": "https://consultingg.com",
          "telephone": "+359888825445",
          "email": "office@consultingg.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "бул. Янко Съкъзов 16",
            "addressLocality": "София",
            "postalCode": "1504",
            "addressCountry": "BG"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "42.6977",
            "longitude": "23.3219"
          },
          "openingHours": ["Mo-Fr 09:00-18:00", "Sa 10:00-16:00"],
          "priceRange": "€€€",
          "image": "https://consultingg.com/logo.png",
          "logo": "https://consultingg.com/logo.png",
          "sameAs": [
            "https://www.facebook.com/consultingg",
            "https://www.instagram.com/consultingg"
          ]
        })}
        </script>
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
              Свържете се
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                с нас
              </span>
            </h1>
            <p className="text-xl text-blue-200">Нашият екип е на ваше разположение</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Контактна информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Phone */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Телефон</h3>
                    <a 
                      href="tel:0888825445" 
                      className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      0888 825 445
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Имейл</h3>
                    <a 
                      href="mailto:office@consultingg.com" 
                      className="text-green-600 font-medium hover:text-green-700 transition-colors"
                    >
                      office@consultingg.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Адрес</h3>
                    <div className="text-purple-600 font-medium">
                      <div>бул. Янко Съкъзов 16</div>
                      <div>София 1504, България</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Работно време</h3>
                    <div className="text-orange-600 font-medium">
                      <div>Пон-Пет: 09:00-18:00</div>
                      <div>Събота: 10:00-16:00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Намерете ни</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="h-96 bg-gray-100 flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2932.8!2d23.3219!3d42.6977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40aa8682cb317bf5%3A0x400a01269bf5e60!2z0LHRg9C7LiDQr9C90LrQviDQodGK0LrRitC30L7QsiAxNiwgMTUwNCDQodC-0YTQuNGPLCDQkdGK0LvQs9Cw0YDQuNGP!5e0!3m2!1sen!2sbg!4v1640995200000!5m2!1sen!2sbg"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ConsultingG Real Estate Office Location"
                ></iframe>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">София</h4>
                <p className="text-gray-600 text-sm">
                  бул. Янко Съкъзов 16, София 1504, България
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};