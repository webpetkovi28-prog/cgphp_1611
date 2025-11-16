# ConsultingG Real Estate - PHP Backend

Пълнофункционален PHP backend за платформата за недвижими имоти.

## 🚀 Инсталация

### 1. Копиране на файловете
```bash
# Копирайте backend папката в root директорията на вашия хостинг
cp -r backend/* /path/to/your/website/
```

### 2. Конфигурация на базата данни
```bash
# Копирайте .env.example като .env
cp .env.example .env

# Редактирайте .env файла с вашите данни
nano .env
```

### 3. Настройка на базата данни
```bash
# Стартирайте инсталационния скрипт
php database/install.php
```

### 4. Права на файловете
```bash
# Дайте права за писане на uploads папката
chmod 755 uploads/
chmod 755 uploads/properties/
```

## 📁 Структура на файловете

```
backend/
├── api/
│   └── index.php           # API entry point
├── config/
│   ├── database.php        # Database connection
│   └── cors.php           # CORS configuration
├── controllers/
│   ├── AuthController.php  # Authentication
│   ├── PropertyController.php # Properties CRUD
│   └── ImageController.php # Image upload/management
├── middleware/
│   └── auth.php           # JWT authentication
├── models/
│   ├── Property.php       # Property model
│   ├── PropertyImage.php  # Image model
│   └── User.php          # User model
├── routes/
│   ├── auth.php          # Auth routes
│   ├── properties.php    # Property routes
│   └── images.php        # Image routes
├── utils/
│   └── JWT.php           # JWT utilities
├── uploads/
│   └── properties/       # Uploaded images
├── database/
│   ├── schema.sql        # Database schema
│   └── install.php       # Installation script
├── .htaccess            # Apache configuration
├── .env.example         # Environment template
└── README.md           # This file
```

## 🔌 API Endpoints

### Автентикация
- `POST /api/auth/login` - Вход в системата
- `GET /api/auth/me` - Информация за текущия потребител
- `POST /api/auth/logout` - Изход от системата

### Имоти
- `GET /api/properties` - Списък с имоти (с филтри)
- `GET /api/properties/{id}` - Детайли за конкретен имот
- `POST /api/properties` - Създаване на нов имот (admin)
- `PUT /api/properties/{id}` - Редактиране на имот (admin)
- `DELETE /api/properties/{id}` - Изтриване на имот (admin)
- `GET /api/properties/stats` - Статистики (admin)

### Снимки
- `POST /api/images/upload` - Качване на снимка (admin)
- `DELETE /api/images/{id}` - Изтриване на снимка (admin)
- `POST /api/images/set-main` - Задаване на главна снимка (admin)

## 🔐 Автентикация

### Вход в админ панела
```
Email: admin@consultingg.bg
Password: admin123
```

**ВАЖНО:** Сменете паролата след първия вход!

### JWT Token
API използва JWT токени за автентикация. Токенът се изпраща в Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Филтри за търсене

### Основни филтри
- `transaction_type` - sale/rent
- `city_region` - град/област
- `property_type` - тип имот
- `district` - квартал
- `featured` - препоръчани имоти
- `active` - активни имоти
- `limit` - ограничение на резултатите

### Ценови филтри
- `price_min` - минимална цена
- `price_max` - максимална цена

### Филтри по площ
- `area_min` - минимална площ
- `area_max` - максимална площ

## 🖼️ Управление на снимки

### Качване на снимки
```php
// POST /api/images/upload
// Form data:
// - image: файл
// - property_id: ID на имота
// - sort_order: ред на показване
// - is_main: главна снимка (true/false)
// - alt_text: alt текст
```

### Ограничения
- Максимален размер: 10MB
- Позволени формати: JPEG, PNG, WebP
- Максимум 30 снимки на имот

## 🛡️ Сигурност

### Защитени endpoints
Всички admin операции изискват валиден JWT токен:
- Създаване/редактиране/изтриване на имоти
- Качване/изтриване на снимки
- Достъп до статистики

### Валидация
- Server-side валидация на всички данни
- Защита срещу SQL injection
- XSS защита
- CSRF защита

## 🔧 Конфигурация

### Environment Variables (.env)
```bash
# Database
DB_HOST=localhost
DB_NAME=consultingg_db
DB_USER=your_username
DB_PASS=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_AUD=consultingg.bg

# Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/webp
```

### Apache Configuration (.htaccess)
- URL rewriting за API routes
- CORS headers
- Security headers
- File upload protection

## 📈 Performance

### Оптимизации
- Database indexing на ключови полета
- Efficient SQL queries
- Image optimization
- Caching headers

### Monitoring
- Error logging
- Performance tracking
- Security monitoring

## 🚨 Troubleshooting

### Чести проблеми

1. **Database connection failed**
   - Проверете .env конфигурацията
   - Уверете се, че MySQL сървърът работи

2. **File upload errors**
   - Проверете правата на uploads/ папката
   - Проверете PHP upload_max_filesize настройката

3. **CORS errors**
   - Проверете .htaccess файла
   - Уверете се, че mod_rewrite е включен

4. **JWT errors**
   - Проверете JWT_SECRET в .env
   - Уверете се, че токенът не е изтекъл

### Логове
Проверете PHP error log за детайлна информация за грешките.

## 📞 Поддръжка

За въпроси и поддръжка:
- Email: admin@consultingg.bg
- Документация: Вижте коментарите в кода