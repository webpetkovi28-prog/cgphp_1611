# Property Deletion Scripts

## delete_properties.php

Permanently deletes properties and all associated data including:
- Database records (properties, property_images, related tables)
- Image files from filesystem (uploads/properties/{id}/)
- Public image directories
- Cache files

### Usage

**Command Line:**
```bash
# Delete specific properties
php backend/scripts/delete_properties.php prop-004 prop-005

# Delete single property
php backend/scripts/delete_properties.php prop-001
```

**Web API (Admin only):**
```bash
curl -X POST "http://localhost:5173/api/admin/delete-properties" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_codes": ["prop-004", "prop-005"]}'
```

### Safety Features

- Confirmation prompt in CLI mode
- Transaction rollback on errors
- Detailed logging of all operations
- Verification report after deletion
- Admin authentication required for web API

### What Gets Deleted

1. **Database Records:**
   - properties table row
   - property_images table rows
   - Any related table rows (features, amenities, etc.)

2. **File System:**
   - `/uploads/properties/{property_id}/` directory and all contents
   - `/public/images/prop-{xxx}/` directories
   - `/dist/images/prop-{xxx}/` directories
   - Thumbnail files

3. **Caches:**
   - PHP opcache
   - File-based caches

### Verification

The script automatically verifies deletion by:
- Checking database for remaining records
- Checking filesystem for remaining directories
- Providing detailed report of what was deleted

### Example Output

```
🚀 ConsultingG Real Estate - Property Deletion Script
============================================================
Properties to delete: prop-004, prop-005

🗑️  Starting deletion for property: prop-004
============================================================
✅ Found property: Луксозна самостоятелна къща в кв. Бояна (ID: prop-004)
📸 Found 5 images to delete
🗂️  Deleting image files...
   ✅ Deleted: /uploads/properties/prop-004/image1.jpg
   ✅ Deleted directory: /uploads/properties/prop-004/
🗄️  Deleting database records...
   ✅ Deleted 5 image records
   ✅ Deleted property record
✅ Property prop-004 deleted successfully!
```