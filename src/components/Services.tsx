import React from 'react';
import { Home, TrendingUp, Shield, Users, Award, Headphones } from 'lucide-react';

// Статични данни за услугите
const staticServices = [
  {
    id: 'service-001',
    title: 'Продажба на имоти',
    description: 'Професионално съдействие при продажба на всички видове недвижими имоти',
    icon: 'Home',
    color: 'from-blue-500 to-blue-600',
    sort_order: 1,
    active: true
  },
  {
    id: 'service-002',
    title: 'Инвестиционни консултации',
    description: 'Експертни съвети за инвестиции в недвижими имоти с висока доходност',
    icon: 'TrendingUp',
    color: 'from-green-500 to-green-600',
    sort_order: 2,
    active: true
  },
  {
    id: 'service-003',
    title: 'Правна защита',
    description: 'Пълна правна защита и съдействие при всички сделки с имоти',
    icon: 'Shield',
    color: 'from-purple-500 to-purple-600',
    sort_order: 3,
    active: true
  },
  {
    id: 'service-004',
    title: 'Управление на имоти',
    description: 'Професионално управление и поддръжка на вашите недвижими имоти',
    icon: 'Users',
    color: 'from-orange-500 to-orange-600',
    sort_order: 4,
    active: true
  },
  {
    id: 'service-005',
    title: 'Оценка на имоти',
    description: 'Точна и професионална оценка на пазарната стойност на имотите',
    icon: 'Award',
    color: 'from-red-500 to-red-600',
    sort_order: 5,
    active: true
  },
  {
    id: 'service-006',
    title: '24/7 Поддръжка',
    description: 'Непрекъсната поддръжка и консултации за всички ваши въпроси',
    icon: 'Headphones',
    color: 'from-indigo-500 to-indigo-600',
    sort_order: 6,
    active: true
  }
];

// Icon mapping
const iconMap = {
  Home,
  TrendingUp,
  Shield,
  Users,
  Award,
  Headphones
};

export const Services: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Нашите услуги</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Предлагаме пълен спектър от професионални услуги в областта на недвижимите имоти
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staticServices.map((service) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Home;
            return (
              <div
                key={service.id}
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};