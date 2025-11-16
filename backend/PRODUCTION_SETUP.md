# Production Setup Instructions for SuperHosting

## Critical Configuration Issue Found

### Problem: Images не се показват на goro.consultingg.com

**Причина:** CORS блокира API заявките защото Origin не съвпада.

### Solution

#### 1. Актуализирайте backend/.htaccess на SuperHosting

**Текущ (грешен):**
```apache
Header always set Access-Control-Allow-Origin "https://consultingg.com"
```

**Правилен:**
```apache
Header always set Access-Control-Allow-Origin "https://goro.consultingg.com"
```

**Пълен файл:** Използвайте съдържанието от `backend/.htaccess.production`

#### 2. Проверка на конфигурацията

**backend/.env на SuperHosting трябва да съдържа:**
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=yogahonc_consultingg78
DB_USERNAME=yogahonc_consultingg78
DB_PASSWORD=PoloSport88*
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

APP_ENV=production
APP_DEBUG=false
APP_URL=https://goro.consultingg.com
PUBLIC_BASE_URL=https://goro.consultingg.com

JWT_SECRET=consultingg-jwt-secret-key-2024
JWT_AUD=consultingg.com
```

#### 3. Deployment Steps

1. **Upload .htaccess:**
   ```bash
   # На SuperHosting в /home/yogahonc/public_html/backend/
   cp backend/.htaccess.production /home/yogahonc/public_html/backend/.htaccess
   ```

2. **Verify CORS:**
   ```bash
   curl -I -H "Origin: https://goro.consultingg.com" \
     https://goro.consultingg.com/backend/api/properties
   ```
   
   Трябва да видите:
   ```
   Access-Control-Allow-Origin: https://goro.consultingg.com
   ```

3. **Test Images:**
   - Отворете: https://goro.consultingg.com/
   - Отворете DevTools (F12) → Console
   - Проверете за CORS грешки
   - Снимките трябва да се заредят!

#### 4. Troubleshooting

**Ако снимките все още не се виждат:**

1. **Check Browser Console (F12):**
   ```
   Access to image at 'https://goro.consultingg.com/uploads/...' 
   from origin 'https://goro.consultingg.com' has been blocked by CORS
   ```
   → Проблем с CORS конфигурацията

2. **Check Network Tab:**
   - Отворете Network tab
   - Filter: XHR
   - Проверете /api/properties response
   - Трябва да видите images[].url със пълни URLs

3. **Verify .htaccess е активен:**
   ```bash
   # На SuperHosting
   cat /home/yogahonc/public_html/backend/.htaccess | grep "Allow-Origin"
   ```

4. **Check Apache mod_headers:**
   ```bash
   # В cPanel → Select PHP Version → Extensions
   # Проверете дали има mod_headers
   ```

#### 5. Alternative: Allow Multiple Origins

Ако искате да позволите и consultingg.com И goro.consultingg.com:

```apache
<IfModule mod_headers.c>
  SetEnvIf Origin "^https://(www\.)?(consultingg|goro\.consultingg)\.com$" ORIGIN_ALLOWED=$0
  Header always set Access-Control-Allow-Origin "%{ORIGIN_ALLOWED}e" env=ORIGIN_ALLOWED
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
  Header always set Access-Control-Allow-Credentials "true"
  Header always set Access-Control-Max-Age "3600"
</IfModule>
```

---

## Summary

**ГЛАВНИЯТ ПРОБЛЕМ:** Backend .htaccess позволява само `consultingg.com`, но сайтът е на `goro.consultingg.com`

**РЕШЕНИЕ:** Променете CORS Origin в backend/.htaccess на `https://goro.consultingg.com`

**ФАЙЛ ЗА UPLOAD:** `backend/.htaccess.production` (copy to SuperHosting)
