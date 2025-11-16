import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Bed, Bath, Square, Calendar, FileText } from 'lucide-react';
import { Property } from '../types/property';
import { apiService } from '../services/api';
import { ScrollableGallery } from './ScrollableGallery';
import { RESIDENTIAL_PROPERTY_TYPES } from '../data/constants';

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError('Липсва идентификатор на имота');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getProperty(id);
        
        if (result.success && result.data) {
          // Ensure images is always an array
          const propertyData = {
            ...result.data,
            images: Array.isArray(result.data.images) ? result.data.images : []
          };
          setProperty(propertyData);
        } else {
          const errorMsg = result.error || 'Имотът не е намерен';
          setError(errorMsg);
        }
      } catch (err) {
        const errorMsg = 'Грешка при зареждане на имота';
        console.error('Error fetching property:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Имотът не е намерен'}</p>
          <Link to="/properties" className="text-blue-400 hover:underline">
            Обратно към имотите
          </Link>
        </div>
      </div>
    );
  }

  const isResidentialProperty = RESIDENTIAL_PROPERTY_TYPES.includes(property.property_type);
  const images = property.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{property.title} - ConsultingG Real Estate</title>
        <meta name="description" content={property.description || `${property.title} - ${property.city_region}, ${property.area}м², €${Math.floor(property.price).toLocaleString()}`} />
        <link rel="canonical" href={`https://consultingg.com/properties/${property.property_code}`} />
      </Helmet>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/properties" 
            className="flex items-center text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад към търсенето
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.png" 
                alt="ConsultingG Logo" 
                className="w-16 h-16 rounded-full object-contain border-4 border-white/20"
              />
              <div className="text-white">
                <h1 className="text-xl font-bold">ConsultingG</h1>
                <p className="text-sm text-blue-200">Real Estate</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Main Image */}
              <div className="relative">
                <div className="aspect-video bg-gray-200 relative">
                  {currentImage ? (
                    <img
                      src={currentImage.image_url}
                      alt={currentImage.alt_text || property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Featured badge */}
                  {property.featured && (
                    <div className="absolute top-4 left-4">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Препоръчан
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                <ScrollableGallery
                  images={images}
                  currentImageIndex={currentImageIndex}
                  onImageSelect={setCurrentImageIndex}
                  propertyTitle={property.title}
                />
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Location and Title */}
              <div className="flex items-center text-blue-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg font-medium">
                  {property.district ? `${property.district}, ` : ''}{property.city_region}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-6">{property.title}</h1>
              
              <div className="text-4xl font-bold text-blue-600 mb-8">
                €{Math.floor(property.price).toLocaleString()}
                {property.transaction_type === 'rent' && (
                  <span className="text-lg text-gray-600 font-normal">/месец</span>
                )}
              </div>

              {/* Property Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Square className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{property.area}</div>
                  <div className="text-sm text-gray-600">м²</div>
                </div>

                {isResidentialProperty && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Bed className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{property.bedrooms || 0}</div>
                    <div className="text-sm text-gray-600">спални</div>
                  </div>
                )}

                {isResidentialProperty && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Bath className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{property.bathrooms || 0}</div>
                    <div className="text-sm text-gray-600">бани</div>
                  </div>
                )}

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{property.year_built || 2023}</div>
                  <div className="text-sm text-gray-600">година</div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Описание</h2>
                  
                  {/* Structured Description for prop-001 */}
                  {property.id === 'prop-001' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Модерна самостоятелна къща с просторен двор и панорамни гледки в Симеоново
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Представяме Ви елегантен дом, съчетаващ модерна архитектура, функционално разпределение и просторна градина в един от най-престижните райони на София – кв. Симеоново, ул. Крайречна, в непосредствена близост до Симеоновско шосе.
                        </p>
                      </div>

                      {/* Основни характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏡 Основни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Разрешение за ползване (Акт 16) – <strong>2023 г.</strong></li>
                          <li>• РЗП къща: <strong>400 кв.м</strong></li>
                          <li>• Двор: <strong>1200 кв.м</strong> с възможност за изграждане на зони за отдих и зеленина</li>
                          <li>• Отопление: газова инсталация</li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>I ниво:</strong> просторна и светла всекидневна, кабинет, мокро помещение и тоалетна</li>
                          <li>• <strong>II ниво:</strong> три самостоятелни спални, всяка с лична баня и дрешник, както и три тераси с впечатляващи гледки към града и планината</li>
                        </ul>
                        <p className="text-gray-700 mt-4 italic">
                          Имотът се предлага на шпакловка и замазка, което Ви дава свободата да реализирате своя личен стил и интериорни идеи.
                        </p>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Отлична локация в престижен и тих район</li>
                          <li>• Просторен двор, подходящ за градина, басейн или детска площадка</li>
                          <li>• Уникални панорамни гледки, осигуряващи усещане за свобода и уединение</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-002' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Модерна самостоятелна къща с двор и панорамни гледки в Драгалевци
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          На тиха улица Пчелица, в близост до Киноцентъра. Имотът е с разрешение за ползване (Акт 16 / 2023 г.) и предлага съчетание от простор, комфорт и прекрасни гледки към София и планината.
                        </p>
                      </div>

                      {/* Основни характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏡 Основни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• РЗП къща: <strong>460 кв.м</strong></li>
                          <li>• Двор: <strong>420 кв.м</strong></li>
                          <li>• Етажи: <strong>3</strong></li>
                          <li>• Разрешение за ползване: <strong>Акт 16 / 2023 г.</strong></li>
                          <li>• Състояние: <strong>завършена до ключ</strong></li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>I ниво:</strong> всекидневна, кухня, дрешник и тоалетна</li>
                          <li>• <strong>II ниво:</strong> три спални със самостоятелни бани</li>
                          <li>• <strong>III ниво:</strong> всекидневна, кухненски бокс, спалня, баня с тоалетна, камина</li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Подови настилки: гранитогрес и ламинат</li>
                          <li>• Отопление на ток с климатици и камина</li>
                          <li>• Просторен и функционален имот, готов за обитаване</li>
                          <li>• Прекрасни панорамни гледки</li>
                          <li>• Престижна и спокойна локация в подножието на планината</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-005' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Слънчев четиристаен апартамент в Оборище
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          В непосредствена близост до Малък Градски театър, парк „Заимов", метростанция Театрална и спирки на градски транспорт. Имотът предлага чудесна панорамна гледка към Витоша и храм-паметник „Св. Александър Невски".
                        </p>
                      </div>

                      {/* Основни характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏡 Основни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Тип имот: <strong>Апартамент, 4-стаен</strong></li>
                          <li>• Етаж: <strong>7 от 8</strong></li>
                          <li>• Изложение: <strong>Юг / Изток / Запад</strong></li>
                          <li>• Настилка: <strong>паркет</strong></li>
                          <li>• Отопление: <strong>ТЕЦ или климатици на ток</strong></li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Всекидневна</strong> с кухненски бокс</li>
                          <li>• <strong>Три самостоятелни спални</strong></li>
                          <li>• <strong>Две бани</strong> с тоалетни</li>
                          <li>• <strong>Отделна тоалетна</strong> за гости</li>
                          <li>• <strong>Три тераси</strong></li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Напълно оборудвано жилище, готово за обитаване</li>
                          <li>• Панорамни гледки към Витоша и „Ал. Невски"</li>
                          <li>• Възможност за наемане на паркомясто или гараж</li>
                          <li>• Отлична локация – близо до парк, метро и градски транспорт</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-004' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Офис площи / Обект "Метличина поляна 15", кв. Гоце Делчев ✨
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Този имот предлага функционални офис пространства, разположени в добре позиционирана реновирана сграда с отлична достъпност и силна локация.
                        </p>
                      </div>

                      {/* Характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏢 Основни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Обект: <strong>самостоятелен офис в сграда с монолитна стоманобетонова конструкция</strong></li>
                          <li>• Разрешение за ползване: <strong>Акт 16 / 2024 г. (очакван)</strong></li>
                          <li>• Площ: <strong>≈ 1 117.58 кв.м общо по документи</strong></li>
                          <li>• Нива: <strong>две нива (партер и първи етаж)</strong></li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение / помещения
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Партер:</strong> портиерна, фоайе и приемна, 16 самостоятелни работни стаи, санитарен възел</li>
                          <li>• <strong>Етаж 2:</strong> 21 самостоятелни работни стаи, санитарен възел</li>
                          <li>• <strong>Паркинг:</strong> възможност за паркоместа в подземния гараж на сградата</li>
                        </ul>
                      </div>

                      {/* Локация и удобства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌍 Локация и удобства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Квартал Гоце Делчев — граничен с бул. България, бул. Гоце Делчев, и кварталите Стрелбище, Борово и Манастирски ливади</li>
                          <li>• Ул. „Метличина поляна" е тихa и спокойна, близо до ул. Костенски Водопад и Южния парк</li>
                          <li>• Район с добре развита инфраструктура — услуги, транспортни връзки, зелени площи, удобства около сградата – парк / междублоково пространство</li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          ⚙️ Предимства / Удобства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Голям брой отделни офисни помещения — подходящо за фирми, колективи или споделени офиси</li>
                          <li>• Санитарни възли и приемни във всеки етаж</li>
                          <li>• Подземен гараж / паркоместа — за служители / посетители</li>
                          <li>• Тиха локация, но с добър достъп до основни булеварди и градски транспорт</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-006' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Самостоятелна къща с 360° панорамна гледка в кв. Бояна ✨
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Изключителен дом, предлагащ изглед към Витоша, Ботаническата градина и София. Ново строителство (2026 г.), разположен на обилен парцел в престижната Бояна, с материали и технологии от висок клас.
                        </p>
                      </div>

                      {/* Характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏡 Характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• РЗП: <strong>538,80 кв.м</strong></li>
                          <li>• Двор: <strong>1101 кв.м – ландшафтен дизайн</strong></li>
                          <li>• Конструкция: <strong>тухла Wienerberger</strong></li>
                          <li>• Дограма: <strong>алуминиева с троен стъклопакет ETEM</strong></li>
                          <li>• Отопление: <strong>термопомпа Daikin + газово котле + подово отопление + конвектори</strong></li>
                          <li>• Гараж: <strong>подземен за 3 автомобила + фитнес със сауна</strong></li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Партер:</strong> хол с камина, кухня + склад, стая за гости/офис, тоалетна за гости, дрешник, перално</li>
                          <li>• <strong>Етаж 2:</strong> родителска спалня с баня, 2 детски стаи с бани, горен хол/офис</li>
                          <li>• <strong>Панорамен покрив:</strong> с ток, вода и възможност за кухня, бар или басейн</li>
                          <li>• <strong>Подземно ниво:</strong> гараж, баня, котелно, склад, фитнес, сауна</li>
                        </ul>
                      </div>

                      {/* Удобства и допълнителни характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Удобства и допълнителни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Алуминиева входна врата</li>
                          <li>• Външна мазилка с врачански камък</li>
                          <li>• Южно изложение</li>
                          <li>• Тихо място с бърз достъп до града</li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏆 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Имоти без аналог — комбинация от стил, простор и гледка в сърцето на Бояна</li>
                          <li>• Високо качество на строителството и използваните материали</li>
                          <li>• Идеално за жилище, престиж / представителство или комфортен, луксозен начин на живот</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-007' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Слънчев четиристаен апартамент в Оборище с панорамни гледки ✨
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Представяме ви просторен и светъл апартамент, разположен в сърцето на кв. Оборище, в непосредствена близост до Малък градски театър, парк „Заимов", метростанция Театрална и удобни спирки на градски транспорт. Жилището разкрива впечатляващи гледки към Витоша и към емблематичния храм-паметник „Св. Александър Невски".
                        </p>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Просторна всекидневна</strong> с кухненски бокс</li>
                          <li>• <strong>Три самостоятелни спални</strong></li>
                          <li>• <strong>Две бани</strong> с тоалетни</li>
                          <li>• <strong>Отделна тоалетна</strong> за гости</li>
                          <li>• <strong>Три тераси</strong> с гледки</li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Отлична локация в престижен квартал</li>
                          <li>• Панорамни гледки към планината и центъра</li>
                          <li>• Баланс между градски комфорт и спокойствие</li>
                        </ul>
                      </div>

                      {/* Удобства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          ⚙️ Удобства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Възможност за паркомясто или гараж</li>
                          <li>• Панорамни гледки</li>
                          <li>• Напълно оборудвано жилище</li>
                          <li>• Тиха и престижна локация</li>
                        </ul>
                      </div>
                    </div>
                  ) : property.id === 'prop-008' ? (
                    <div className="space-y-8">
                      {/* Introduction */}
                      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ✨ Модерна самостоятелна къща с двор и панорамни гледки в Драгалевци ✨
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          Разположена на ул. Пчелица, в близост до Киноцентъра, къщата предлага комфорт, функционалност и завършеност до ключ. Имотът е с Акт 16 / 2023 г., разполага с РЗП 460 кв.м и самостоятелен двор от 420 кв.м.
                        </p>
                      </div>

                      {/* Основни характеристики */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🏡 Основни характеристики
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• РЗП къща: <strong>460 кв.м</strong></li>
                          <li>• Двор: <strong>420 кв.м</strong></li>
                          <li>• Етажи: <strong>3</strong></li>
                          <li>• Разрешение за ползване: <strong>Акт 16 / 2023 г.</strong></li>
                          <li>• Състояние: <strong>завършена до ключ</strong></li>
                        </ul>
                      </div>

                      {/* Разпределение */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          📐 Разпределение
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>I ниво:</strong> всекидневна, кухня, дрешник и тоалетна</li>
                          <li>• <strong>II ниво:</strong> три спални със самостоятелни бани</li>
                          <li>• <strong>III ниво:</strong> всекидневна, кухненски бокс, спалня, баня с тоалетна, камина</li>
                        </ul>
                      </div>

                      {/* Предимства */}
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                          🌿 Предимства
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Подови настилки: гранитогрес и ламинат</li>
                          <li>• Отопление на ток с климатици и камина</li>
                          <li>• Просторен и функционален имот, готов за обитаване</li>
                          <li>• Прекрасни панорамни гледки</li>
                          <li>• Престижна и спокойна локация в подножието на планината</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* Default description for other properties */
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </div>
                  )}
                </div>
              )}

              {/* Property Details - Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Основни характеристики</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тип имот:</span>
                      <span className="font-medium text-gray-900">{property.property_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тип сделка:</span>
                      <span className="font-medium text-gray-900">{property.transaction_type === 'sale' ? 'Продажба' : 'Наем'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Площ:</span>
                      <span className="font-medium text-gray-900">{property.area} м²</span>
                    </div>
                    {isResidentialProperty && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Спални:</span>
                          <span className="font-medium text-gray-900">{property.bedrooms || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Бани:</span>
                          <span className="font-medium text-gray-900">{property.bathrooms || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Тераси:</span>
                          <span className="font-medium text-gray-900">{property.terraces || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Етаж:</span>
                          <span className="font-medium text-gray-900">
                            {property.id === 'prop-002' ? '3 от 3' :
                             property.id === 'prop-006' ? '3 от 3' :
                             property.id === 'prop-007' ? '7 от 8' :
                             property.id === 'prop-008' ? '3 от 3' :
                             `${property.floor_number || 2} от ${property.floors || 2}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Допълнителни характеристики</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Година на строителство:</span>
                      <span className="font-medium text-gray-900">{property.year_built || 2023}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Строителство:</span>
                      <span className="font-medium text-gray-900">{property.construction_type || 'Тухла'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Отопление:</span>
                      <span className="font-medium text-gray-900">
                        {property.id === 'prop-006' ? 'Термопомпа + Газ + Подово' :
                         property.id === 'prop-007' ? 'ТЕЦ или електричество чрез климатици' :
                         property.heating || 'Локално'}
                      </span>
                    </div>
                    {isResidentialProperty && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Изложение:</span>
                          <span className="font-medium text-gray-900">
                            {property.exposure || 'Не е посочено'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Обзавеждане:</span>
                          <span className="font-medium text-gray-900">
                            {property.id === 'prop-007' ? 'Напълно оборудвано' :
                             property.furnishing_level === 'full' ? 'Напълно обзаведен' : 
                             property.furnishing_level === 'partial' ? 'Частично обзаведен' :
                             property.furnishing_level === 'unfurnished' ? 'Необзаведена' :
                             property.furnishing_level === 'none' ? 'Необзаведен' :
                             'Необзаведен'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isResidentialProperty && (
                <div className="mb-8 text-sm text-blue-900 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  Детайлите за помещения не са приложими за този тип имот.
                </div>
              )}

              {/* Features Tags */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Удобства</h3>
                <div className="flex flex-wrap gap-3">
                  {property.transaction_type === 'rent' && (
                    <span className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Под наем
                    </span>
                  )}
                  {(property.id === 'prop-001' || property.id === 'prop-007') && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Панорамни гледки
                    </span>
                  )}
                  {property.id === 'prop-001' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Просторен двор
                    </span>
                  )}
                  {property.id === 'prop-002' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Просторен двор
                    </span>
                  )}
                  {property.id === 'prop-008' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Завършена до ключ
                    </span>
                  )}
                  {property.id === 'prop-008' && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Панорамни гледки
                    </span>
                  )}
                  {property.has_elevator && property.id !== 'prop-001' && property.id !== 'prop-002' && property.id !== 'prop-006' && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Асансьор
                    </span>
                  )}
                  {property.id === 'prop-006' && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Подземен гараж
                    </span>
                  )}
                  {property.has_garage && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Гараж
                    </span>
                  )}
                  {property.id === 'prop-007' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Напълно оборудвано
                    </span>
                  )}
                  {property.id === 'prop-008' && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      Камина
                    </span>
                  )}
                  {property.has_southern_exposure && (
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Южно изложение
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                {/* Logo */}
                <div className="mb-6">
                  <img 
                    src="/logo.png" 
                    alt="ConsultingG Logo" 
                    className="w-24 h-24 mx-auto rounded-2xl object-contain"
                  />
                </div>

                {/* Company Name */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">ConsultingG</h2>
                  <p className="text-gray-600">Real Estate</p>
                </div>

                {/* Call Button */}
                <a 
                  href="tel:0888825445" 
                  className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-bold">Обадете се 0888825445</span>
                </a>
                
                {/* Email Button */}
                <a 
                  href="mailto:office@consultingg.com?subject=Запитване за имот&body=Здравейте,%0D%0A%0D%0AИмам въпрос относно:" 
                  className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-8"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">Изпратете имейл office@consultingg.com</span>
                </a>

                {/* Contact Information */}
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Контактна информация</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">бул. Янко Съкъзов 16, София, България</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">0888825445</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">office@consultingg.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Documents */}
              {property.documents && property.documents.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      // Open first PDF document in new tab
                      if (property.documents && property.documents.length > 0) {
                        window.open(`/api/documents/${property.documents[0].id}`, '_blank');
                      }
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Отвори PDF документи"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Виж документи ({property.documents.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};