# ConsultingG Real Estate - Replit Environment

A modern real estate management platform with React frontend and PHP backend, optimized for the Replit environment.

## 🚀 Development Setup

### Prerequisites
- The project runs automatically in Replit with pre-configured environment
- PostgreSQL database is provisioned and managed by Replit
- All dependencies are automatically installed via workflows

### Running the Application

1. **Automatic Startup**: The project uses Replit workflows to automatically start both frontend and backend servers
2. **Manual Startup**: Run `bash run.sh` to start both servers manually
3. **Frontend**: Available on port 5000 (Vite dev server)
4. **Backend API**: Available on port 8080 (PHP development server)

### Project Structure

```
├── src/                    # React frontend source
├── backend/                # PHP backend API
│   ├── controllers/       # API controllers
│   ├── models/           # Database models  
│   ├── config/           # Configuration files
│   └── routes/           # API route handlers
├── api/                   # API entry point
├── uploads/               # File upload directory
├── scripts/               # Utility scripts
└── run.sh                 # Development startup script
```

## 🛠️ Build Instructions

### Development Build
```bash
# Install dependencies (automatic in Replit)
npm install
cd backend && composer install

# Start development servers
bash run.sh
```

### Production Build
```bash
# Build frontend assets
npm run build

# Production deployment handled by Replit deployment configuration
```

## 🗄️ Database Management

### Database Configuration
- Uses Replit-managed PostgreSQL database
- Connection configured via `DATABASE_URL` environment variable
- Supports both individual env vars (PGHOST, PGUSER, etc.) and DATABASE_URL parsing

### Database Export
Export database for backup or migration:
```bash
# Run export script
bash scripts/export_db.sh

# Creates files in exports/:
# - db_YYYYMMDD.sql      (SQL dump)
# - db_YYYYMMDD.dump     (Binary format)  
# - schema_YYYYMMDD.sql  (Schema only)
# - data_YYYYMMDD.sql    (Data only)
```

### Import to SuperHosting PostgreSQL
```bash
# Import SQL dump
psql -U username -d database_name -f exports/db_YYYYMMDD.sql

# Import binary dump (recommended)
pg_restore -U username -d database_name exports/db_YYYYMMDD.dump
```

## 📡 API Endpoints

### Health Check
- `GET /api/` - API health check and endpoints list

### Properties
- `GET /api/properties` - List properties with filtering
- `GET /api/properties/{id}` - Get property details
- `POST /api/properties` - Create property (admin)
- `PUT /api/properties/{id}` - Update property (admin)
- `DELETE /api/properties/{id}` - Delete property (admin)

### Images
- `POST /api/images/upload` - Upload property images (admin)
- `DELETE /api/images/{id}` - Delete image (admin)

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (managed by Replit)
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` - Individual DB config
- `JWT_SECRET` - JWT token signing key
- `APP_DEBUG` - Enable debug mode

### CORS Configuration
Configured for Replit environment with support for:
- `*.replit.dev` domains
- `localhost` and `127.0.0.1`
- Production domains

## 🚀 Deployment

### Replit Deployment
- Configured for autoscale deployment target
- Build command: `npm run build`
- Run command: Starts both PHP API and frontend preview
- Automatic SSL and domain management

### Migration Notes
For deployment to external hosting:
1. Export database using `scripts/export_db.sh`
2. Configure PHP environment (PHP 8.2+, Composer)
3. Set up PostgreSQL database and import data
4. Update environment variables for production
5. Configure web server (Apache/Nginx) for React SPA routing

## 📁 File Uploads

### Image Upload System
- **Storage**: `uploads/properties/{property_id}/`
- **Formats**: JPEG, PNG, WebP (validated and optimized)
- **Limits**: Max 50 images per property, 10MB per file
- **Processing**: Automatic thumbnail generation and optimization

### Directory Structure
```
uploads/
└── properties/
    ├── prop-001/
    │   ├── image1.jpg
    │   └── image1_thumb.jpg
    └── prop-002/
        └── ...
```

## 🔐 Security

- JWT-based authentication for admin functions
- CSRF protection via proper CORS configuration  
- File upload validation and sanitization
- SQL injection prevention with prepared statements
- Environment-based configuration (no hardcoded secrets)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify `DATABASE_URL` is set in Replit Secrets
- Check if PostgreSQL database is provisioned

**File Upload Errors**
- Ensure `uploads/properties/` directory exists and is writable
- Check file size limits and allowed formats

**API CORS Errors**
- Verify frontend and backend are running on correct ports
- Check CORS configuration includes Replit preview domains

**Build/Start Failures**
- Run `npm install` and `composer install` manually
- Check error logs in workflow console

For additional support, check the workflow logs in Replit console.

---

Website: consultingg.com