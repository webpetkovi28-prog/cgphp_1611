#!/bin/bash
# Quick Deployment Script for consultingg.com
# Run this BEFORE uploading to SuperHosting

echo "🚀 Подготовка за deployment на consultingg.com..."

# 1. Build Frontend
echo "📦 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 2. Create backend .env from template
echo "📝 Creating backend/.env template..."
cp backend/.env.example.consultingg backend/.env.production
echo "✅ Created backend/.env.production - configure this on server!"

# 3. Create deployment package
echo "📦 Creating deployment archive..."
tar -czf consultingg_deployment_$(date +%Y%m%d_%H%M%S).tar.gz \
    dist/ \
    backend/ \
    uploads/ \
    images/ \
    .htaccess \
    exports/full_mysql_dump.sql \
    --exclude='backend/node_modules' \
    --exclude='backend/.env' \
    --exclude='*.log'

echo "✅ Deployment package created!"
echo ""
echo "📋 Next steps:"
echo "1. Upload consultingg_deployment_*.tar.gz to SuperHosting"
echo "2. Extract to /home/yogahonc/consultingg.com/"
echo "3. Move dist/* to root: mv dist/* ./"
echo "4. Copy backend/.env.production to backend/.env and configure DB"
echo "5. Import exports/full_mysql_dump.sql to database"
echo "6. Set permissions: chmod 755 uploads/ && chmod 644 uploads/properties/*/*.jpg"
echo "7. Test: https://consultingg.com/"
echo ""
echo "📖 Full instructions: DEPLOY_CONSULTINGG.md"
