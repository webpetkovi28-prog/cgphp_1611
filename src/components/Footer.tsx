import React from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const Footer: React.FC = () => {
  const vCardData = `BEGIN:VCARD
VERSION:3.0
N:Георгиев;Георги;;;
FN:ConsultingG Real Estate
ORG:ConsultingG Real Estate
TEL;TYPE=CELL:+35988882445
EMAIL:office@consultingg.com
ADR;TYPE=WORK:;;бул. Янко Съкъзов 16;София;;1504;България
END:VCARD`;

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/logo.png" 
                alt="ConsultingG Logo" 
                className="w-12 h-12 rounded-xl shadow-lg object-contain"
              />
              <div>
                <h3 className="text-xl font-bold">ConsultingG</h3>
                <p className="text-blue-200 text-sm">Real Estate</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm">
              Водещата компания за недвижими имоти в България с над 15 години опит 
              и хиляди доволни клиенти.
            </p>
          </div>

          {/* Team Photo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-blue-100 to-purple-100 p-1 transform hover:scale-105 transition-transform duration-300 relative">
                {/* 3D raised effect with multiple shadows */}
                <div className="absolute inset-0 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3),0_16px_64px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.1)]"></div>
                {/* Subtle highlight on top */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-sm"></div>
                <img 
                  src="/images/georgiev.jpg" 
                  alt="Георги Георгиев" 
                  className="w-full h-full rounded-full object-cover relative z-10"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">Контакти</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">бул. Янко Съкъзов 16, София, България</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-400" />
                <a href="tel:0888825445" className="text-gray-300 text-sm hover:text-blue-400 transition-colors">0888825445</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <a href="mailto:office@consultingg.com?subject=Запитване за недвижим имот&body=Здравейте,%0D%0A%0D%0AИмам въпрос относно:" className="text-gray-300 text-sm hover:text-blue-400 transition-colors">office@consultingg.com</a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4 text-center">Сканирайте за контакт</h4>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG 
                  value={vCardData}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-bold mb-6">Последвайте ни</h4>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/search/top/?q=consultingg%20real%20estate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/consultinggrealestate?igsh=MThvazF6OHI5YnVuOA%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="relative mt-8 pt-8 text-center">
          {/* Elegant divider line with shadow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent shadow-lg"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent shadow-2xl blur-sm"></div>
          <p className="text-gray-400 text-sm">
            © 2024 ConsultingG Real Estate. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
};