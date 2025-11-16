# Deployment File Checklist for consultingg.com

## ✅ Files Ready for Upload

### Frontend (Built)
- [x] dist/index.html
- [x] dist/assets/*.js
- [x] dist/assets/*.css

### Backend
- [x] backend/api/
- [x] backend/controllers/
- [x] backend/models/
- [x] backend/utils/
- [x] backend/config/
- [x] backend/middleware/
- [x] backend/.htaccess (configured for consultingg.com)

### Configuration Templates
- [x] backend/.env.example.consultingg (copy to backend/.env on server)
- [x] .htaccess (SPA routing)

### Database
- [x] exports/full_mysql_dump.sql

### Images
- [x] uploads/properties/prop-001/
- [x] uploads/properties/prop-002/
- [x] uploads/properties/prop-004/
- [x] uploads/properties/prop-006/
- [x] uploads/properties/prop-007/
- [x] uploads/properties/prop-008/
- [x] uploads/properties/prop-009/
- [x] uploads/properties/prop-010/

### Static Assets
- [x] images/ (placeholder images)

## 📋 Deployment Steps

1. Upload all files to: `/home/yogahonc/consultingg.com/`
2. Move dist/* to root: `mv dist/* ./`
3. Create backend/.env from backend/.env.example.consultingg
4. Import database: `exports/full_mysql_dump.sql`
5. Set permissions: `chmod 755 uploads/` and `chmod 644 uploads/properties/*/*.jpg`
6. Test: https://consultingg.com/

## 🎯 Critical Configuration

### backend/.env
```env
APP_URL=https://consultingg.com
PUBLIC_BASE_URL=https://consultingg.com  ← ВАЖНО за снимките!
```

### backend/.htaccess
```apache
Access-Control-Allow-Origin "https://consultingg.com"  ← ВАЖНО за CORS!
```

## ✅ Expected Result

После deployment:
- ✅ Homepage зарежда на https://consultingg.com/
- ✅ API работи на https://consultingg.com/api/properties
- ✅ Снимките се зареждат от https://consultingg.com/uploads/properties/...
- ✅ No CORS errors в browser console
- ✅ Admin login работи
