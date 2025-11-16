# ConsultingG Real Estate

## Overview

ConsultingG Real Estate is a modern, full-stack real estate management platform built for the Bulgarian market. The application serves as a comprehensive property listing and management system with a React-based frontend and PHP backend API. The platform features property search, detailed listings, content management, and administrative tools for real estate professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React hooks with custom hooks for business logic
- **SEO**: React Helmet Async for dynamic meta tags and structured data
- **Forms**: React Hook Form with Yup validation

### Backend Architecture
- **Language**: PHP 8.0+ with object-oriented design
- **API Design**: RESTful API with centralized routing
- **Environment Variables**: vlucas/phpdotenv for `.env` file loading
- **Authentication**: JWT-based authentication using Firebase JWT
- **File Handling**: Custom image upload and management system
- **Architecture Pattern**: MVC pattern with controllers, models, and services
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Security**: CORS configuration, input validation, and SQL injection protection

### Database Design
- **Production Database**: MySQL 5.7+ on SuperHosting.bg (yogahonc_consultingg78)
- **Development Database**: PostgreSQL (Replit DATABASE_URL)
- **Migration History**: MySQL → PostgreSQL (Replit) → Neon Cloud PostgreSQL → MySQL (SuperHosting.bg)
- **Schema**: Normalized database with properties, property_images, property_documents, users, pages, sections, and services tables
- **Features**: UUID primary keys (CHAR(36)), optimized indexes, foreign key constraints
- **Multi-Database Support**: Backend supports both PostgreSQL and MySQL via DB_CONNECTION environment variable

#### Database Configuration Notes
- **Development (Replit)**: PostgreSQL via DATABASE_URL (automatic)
- **Production (SuperHosting)**: MySQL via DB_CONNECTION=mysql and discrete DB_* variables
- **Database Exports**: Full exports available in `/exports` directory
  - PostgreSQL dumps: replit_db.dump (binary), replit_db.sql (SQL)
  - MySQL schema: mysql_schema.sql
  - CSV exports: properties, property_images, users, pages, services
- **Migration Documentation**: See MYSQL_MIGRATION.md for complete SuperHosting deployment guide
- **Connection Test Scripts**: 
  - MySQL: backend/db_mysql_check.php
  - PostgreSQL: backend/db_neon_check.php

#### MySQL Migration (October 2025)
- **Target**: SuperHosting.bg with MySQL for production deployment
- **Schema Conversion**: All PostgreSQL-specific features converted to MySQL
  - BOOLEAN → TINYINT(1)
  - NUMERIC → DECIMAL  
  - TIMESTAMP → DATETIME
  - ILIKE → LIKE
  - Removed RETURNING clauses (use UUID generation)
- **Backend Updates**: Models refactored to be database-agnostic
- **Configuration**: backend/config/database.php supports both PostgreSQL and MySQL
- **Status**: Migration complete, production-ready, architect-approved

### File Structure
- **Frontend**: Standard React/TypeScript structure in `/src`
- **Backend**: PHP API in `/backend` with clear separation of concerns
- **Public Assets**: Static images and files in `/public` and `/images`
- **Deployment**: Multiple deployment packages for different hosting environments

### Key Design Decisions
- **Database Migration**: Chose PostgreSQL over MySQL for better JSON support, UUID handling, and advanced features
- **Image Management**: Local file storage with organized directory structure for better performance
- **API Architecture**: Single entry point (`/api/index.php`) with route-based dispatch for clean URLs
- **Environment Flexibility**: Multiple configuration setups for development, production, and various hosting providers

## External Dependencies

### Database Services
- **Neon PostgreSQL (Primary)**: Cloud-hosted serverless PostgreSQL database
  - **Host**: ep-noisy-pine-agnly9s.eu-central-1.aws.neon.tech (Direct, non-pooler)
  - **Region**: EU-Central-1 (AWS Frankfurt)
  - **Database**: neondb
  - **SNI Support**: Auto-detected and configured in backend/config/database.php
  - **Connection Test**: Available at `/backend/db_neon_check.php`
  - **Backup**: Database exports stored in `/exports` directory
- **Supabase (Frontend Only)**: Used for frontend Supabase client features if needed
  - **Connection**: Frontend configured with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

### PHP Dependencies (Composer)
- **vlucas/phpdotenv**: Environment variable loading from `.env` files
- **firebase/php-jwt**: JWT token generation and validation for authentication
- **ext-pdo**: PostgreSQL database connectivity
- **ext-pgsql**: PostgreSQL extension
- **ext-json**: JSON data handling
- **ext-mbstring**: String manipulation for Bulgarian language support
- **ext-fileinfo**: File type detection for uploads

### Frontend Dependencies (npm)
- **@supabase/supabase-js**: Direct database client for additional features
- **lucide-react**: Modern icon library
- **react-router-dom**: Client-side routing
- **react-hook-form**: Form handling and validation
- **react-helmet-async**: SEO meta tag management
- **yup**: Schema validation
- **qrcode.react**: QR code generation for contact information

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting with React-specific rules
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **PostCSS/Autoprefixer**: CSS post-processing

### Hosting Integration
- **SuperHosting.bg**: Primary deployment target (consultingg.com)
  - **Server Path**: `/home/yogahonc/consultingg.com/`
  - **Database**: MySQL `yogahonc_consultingg78` on localhost
  - **Domain**: https://consultingg.com
- **Apache/PHP Configuration**: .htaccess rules for clean URLs, API routing, and MIME types
- **SSL/HTTPS**: Enforced secure connections with CSP headers
- **File Permissions**: Proper upload directory permissions for image management
- **Production Database**: MySQL 5.7+ on SuperHosting localhost
- **PHP Extensions Required**: pdo_mysql, mysqli, mbstring, json, fileinfo (enable in cPanel)
- **Environment Config**: Production templates:
  - `backend/.env.example.consultingg` - MySQL configuration for consultingg.com
  - `backend/.htaccess.consultingg` - CORS for consultingg.com
- **Health Checks**: `/backend/db_test.php`, `/api/`
- **Deployment Guide**: See `DEPLOY_CONSULTINGG.md` for complete deployment instructions
- **Quick Deploy**: Run `./QUICK_DEPLOY.sh` to prepare deployment package