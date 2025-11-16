# PostgreSQL to MySQL Migration Guide
## ConsultingG Real Estate - SuperHosting.bg Deployment

---

## 📋 Overview

This guide covers the complete migration from PostgreSQL (Replit/Neon) to MySQL for deployment on SuperHosting.bg.

**Migration Date:** October 12, 2025  
**Target Database:** MySQL (yogahonc_consultingg78)  
**Target Host:** SuperHosting.bg (consultingg.com)

---

## 📦 What's Been Prepared

### 1. Database Exports
All PostgreSQL data has been exported to multiple formats:

- **Binary Dump**: `exports/replit_db.dump` (27KB) - PostgreSQL custom format
- **SQL Dump**: `exports/replit_db.sql` (53KB) - Plain SQL
- **CSV Exports** (in `exports/csv/`):
  - `properties.csv` (11KB) - 10 properties
  - `property_images.csv` (27KB) - 74 images
  - `users.csv` (249B) - 1 user
  - `pages.csv` (1.1KB) - 3 pages
  - `services.csv` (1.4KB) - 6 services

### 2. MySQL Schema
- **File**: `exports/mysql_schema.sql`
- **Converted from PostgreSQL** with all type mappings:
  - `VARCHAR(36)` → `CHAR(36)` (for UUIDs)
  - `BOOLEAN` → `TINYINT(1)`
  - `NUMERIC(12,2)` → `DECIMAL(12,2)`
  - `TIMESTAMP WITHOUT TIME ZONE` → `DATETIME`
  - PostgreSQL CHECK constraints → application-level validation

### 3. Backend Code Updates
- ✅ `backend/config/database.php` - Now supports both PostgreSQL and MySQL
- ✅ `backend/models/*.php` - All PostgreSQL-specific SQL removed:
  - `RETURNING` → `lastInsertId()` or UUID generation
  - `ILIKE` → `LIKE`
  - `::text` type casts → removed
- ✅ `backend/db_mysql_check.php` - Connection test script
- ✅ `backend/.env.mysql.superhosting` - MySQL configuration template

---

## 🚀 Deployment Steps

### Step 1: Prepare SuperHosting MySQL Database

1. **Log into SuperHosting cPanel**
2. **Navigate to**: MySQL Databases
3. **Verify database exists**: `yogahonc_consultingg78`
   - If not, create it with charset: `utf8mb4` and collation: `utf8mb4_unicode_ci`
4. **Verify user**: `yogahonc_consultingg78` has ALL PRIVILEGES on the database

### Step 2: Import MySQL Schema

**Via phpMyAdmin:**
1. Open phpMyAdmin from cPanel
2. Select database: `yogahonc_consultingg78`
3. Go to **Import** tab
4. Upload file: `exports/mysql_schema.sql`
5. Click **Go** to execute
6. Verify all 7 tables are created:
   - users
   - properties
   - property_images
   - property_documents
   - pages
   - sections
   - services

**Via SSH (if available):**
```bash
mysql -u yogahonc_consultingg78 -p yogahonc_consultingg78 < exports/mysql_schema.sql
```

### Step 3: Import Data

**Option A: Using phpMyAdmin (Recommended)**

For each CSV file in `exports/csv/`:

1. Select the corresponding table
2. Go to **Import** tab
3. Choose file format: **CSV**
4. Configure import:
   - Fields terminated by: `,`
   - Fields enclosed by: `"`
   - Fields escaped by: `"`
   - Replace table data: **No** (append)
   - Column names in first row: **Yes**
5. Upload and import

**Important Boolean Conversions:**
- PostgreSQL `t/f` → MySQL `1/0`
- The CSV files have boolean values that need conversion
- In phpMyAdmin, after import, run these updates:

```sql
-- Convert boolean values in users table
UPDATE users SET active = IF(active = 't' OR active = 'true', 1, 0);

-- Convert boolean values in properties table
UPDATE properties SET 
  has_elevator = IF(has_elevator = 't' OR has_elevator = 'true', 1, 0),
  has_garage = IF(has_garage = 't' OR has_garage = 'true', 1, 0),
  has_southern_exposure = IF(has_southern_exposure = 't' OR has_southern_exposure = 'true', 1, 0),
  new_construction = IF(new_construction = 't' OR new_construction = 'true', 1, 0),
  featured = IF(featured = 't' OR featured = 'true', 1, 0),
  active = IF(active = 't' OR active = 'true', 1, 0);

-- Convert boolean values in property_images table
UPDATE property_images SET is_main = IF(is_main = 't' OR is_main = 'true', 1, 0);

-- Convert boolean values in pages table
UPDATE pages SET active = IF(active = 't' OR active = 'true', 1, 0);

-- Convert boolean values in services table
UPDATE services SET active = IF(active = 't' OR active = 'true', 1, 0);
```

**Option B: Using SQL Import Script**

Upload `exports/mysql_import_data.sql` and execute (requires `LOAD DATA LOCAL INFILE` permission).

### Step 4: Verify Data Import

```sql
-- Check row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'properties', COUNT(*) FROM properties
UNION ALL SELECT 'property_images', COUNT(*) FROM property_images
UNION ALL SELECT 'pages', COUNT(*) FROM pages
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'sections', COUNT(*) FROM sections
UNION ALL SELECT 'property_documents', COUNT(*) FROM property_documents;
```

**Expected Counts:**
- users: 1
- properties: 10
- property_images: 74
- pages: 3
- services: 6
- sections: 0
- property_documents: 0

### Step 5: Upload Backend Files

1. **Upload updated backend files** to SuperHosting via FTP/File Manager:
   ```
   backend/
   ├── config/database.php ✅ (updated for MySQL)
   ├── models/
   │   ├── Property.php ✅ (ILIKE → LIKE, removed ::text)
   │   ├── Document.php ✅ (removed RETURNING)
   │   └── ... (all models updated)
   ├── db_mysql_check.php ✅ (new test script)
   └── .env ⚠️ (configure next)
   ```

2. **Configure Environment Variables**:
   - Copy `backend/.env.mysql.superhosting` to `backend/.env`
   - Update with your actual SuperHosting MySQL credentials:
     * Database: `yogahonc_consultingg78`
     * Username: `yogahonc_consultingg78`
     * Password: **(get from SuperHosting cPanel → MySQL Databases)**
   
   **Example `.env` file:**
   ```env
   # Database Connection
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=yogahonc_consultingg78
   DB_USERNAME=yogahonc_consultingg78
   DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
   DB_CHARSET=utf8mb4
   DB_COLLATION=utf8mb4_unicode_ci

   # Application
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://consultingg.com

   # JWT (change this secret!)
   JWT_SECRET=YOUR_UNIQUE_JWT_SECRET_HERE
   JWT_AUD=consultingg.com
   ```

   **⚠️ SECURITY:**
   - Never commit `.env` to git (it's in `.gitignore`)
   - Use strong, unique passwords
   - Rotate credentials if exposed
   - Keep `.env` file permissions: `chmod 600 backend/.env`

### Step 6: Set File Permissions

```bash
# Via SSH or File Manager
chmod 755 uploads/
chmod 755 images/
chmod 644 backend/.env
```

### Step 7: Verify PHP Extensions

Ensure these PHP extensions are enabled in cPanel:
- ✅ `pdo_mysql`
- ✅ `mysqli`
- ✅ `mbstring`
- ✅ `json`
- ✅ `fileinfo`

### Step 8: Test Database Connection

1. **Navigate to**: `https://consultingg.com/backend/db_mysql_check.php`
2. **Expected Response**:
```json
{
    "ok": true,
    "message": "Successfully connected to MySQL",
    "database": "yogahonc_consultingg78",
    "mysql_version": "10.x.x-MariaDB",
    "host": "localhost",
    "port": "3306",
    "charset": "utf8mb4"
}
```

3. **If error**, check:
   - Database credentials in `.env`
   - PHP extensions enabled
   - Database user privileges

### Step 9: Test API Endpoints

```bash
# Health check
curl https://consultingg.com/api/

# Properties list
curl https://consultingg.com/api/properties

# Specific property
curl https://consultingg.com/api/properties/prop-001
```

### Step 10: Test Frontend Application

1. **Navigate to**: `https://consultingg.com`
2. **Verify**:
   - Homepage loads
   - Properties list displays
   - Property details show images
   - Search/filters work
   - Admin login works

---

## 🔄 PostgreSQL → MySQL Query Changes

### Summary of Code Changes

| PostgreSQL Syntax | MySQL Equivalent | Files Changed |
|-------------------|------------------|---------------|
| `RETURNING id` | Generate UUID in PHP, use `lastInsertId()` | `Document.php` |
| `ILIKE` | `LIKE` (case-insensitive by default) | `Property.php` |
| `::text` | Removed (not needed) | `Property.php` |
| `BOOLEAN` | `TINYINT(1)` | All models |
| `NUMERIC(12,2)` | `DECIMAL(12,2)` | Schema |
| `TIMESTAMP` | `DATETIME` | Schema |

### Database-Specific Features

**PostgreSQL Features Removed:**
- CHECK constraints (validation moved to application layer)
- JSON aggregation functions (`json_agg`, `json_build_object`) - images fetched separately
- `::type` casting syntax

**MySQL Features Added:**
- `ON UPDATE CURRENT_TIMESTAMP` for updated_at columns
- `utf8mb4` charset and `utf8mb4_unicode_ci` collation
- `InnoDB` engine for all tables

---

## 🐛 Troubleshooting

### Issue: Connection Failed
**Solution:**
1. Verify database credentials in `.env`
2. Check if MySQL service is running
3. Verify database user has permissions
4. Check PHP PDO MySQL extension is enabled

### Issue: Boolean Values Not Displaying Correctly
**Solution:**
Run the boolean conversion SQL from Step 3

### Issue: Images Not Loading
**Solution:**
1. Check file permissions on `uploads/` and `images/` (755)
2. Verify image paths in database
3. Check `.htaccess` rules for image serving

### Issue: Search Not Working
**Solution:**
- MySQL `LIKE` is case-insensitive by default with `utf8mb4_unicode_ci`
- Verify collation is set correctly on string columns

### Issue: Foreign Key Constraint Errors
**Solution:**
- Import tables in correct order (users → properties → property_images)
- Verify all UUID references match between tables

---

## 📊 Post-Migration Checklist

- [ ] Database schema created successfully
- [ ] All data imported (verify row counts)
- [ ] Boolean values converted (1/0 instead of t/f)
- [ ] Backend `.env` configured with MySQL credentials
- [ ] File permissions set (755 for uploads/images)
- [ ] PHP extensions enabled (pdo_mysql, mysqli)
- [ ] Connection test passes (`/backend/db_mysql_check.php`)
- [ ] API endpoints responding (`/api/`, `/api/properties`)
- [ ] Frontend loads and displays properties
- [ ] Images display correctly
- [ ] Search/filters work
- [ ] Admin panel login works
- [ ] Property creation/editing works

---

## 📁 Files Reference

### Migration Files
- `exports/mysql_schema.sql` - MySQL database schema
- `exports/mysql_import_data.sql` - Data import script (alternative method)
- `exports/csv/*.csv` - Data exports in CSV format
- `exports/export_summary.txt` - Export summary

### Configuration Files
- `backend/.env.mysql.superhosting` - MySQL environment template
- `backend/config/database.php` - Updated database class (supports MySQL & PostgreSQL)
- `backend/db_mysql_check.php` - MySQL connection test

### Updated Backend Files
- `backend/models/Property.php` - Removed ILIKE, ::text
- `backend/models/Document.php` - Removed RETURNING, added UUID generation
- All other models - Compatible with both databases

---

## 🔐 Security Notes

1. **Never commit `.env` file** to git
2. **Use strong JWT_SECRET** (change the default in production)
3. **Restrict database user** permissions (only needed access)
4. **Enable SSL** for production (already configured on SuperHosting)
5. **Set APP_DEBUG=false** in production

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all steps completed in order
3. Check SuperHosting error logs in cPanel
4. Contact SuperHosting support for server-specific issues

---

**Migration prepared by:** Replit Agent  
**Date:** October 12, 2025  
**Status:** Ready for deployment to SuperHosting.bg
