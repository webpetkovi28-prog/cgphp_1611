#!/usr/bin/env php
<?php
/**
 * Property Deletion Script
 * Permanently deletes properties and all associated data
 * 
 * Usage: php delete_properties.php prop-004 prop-005
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Property.php';
require_once __DIR__ . '/../models/PropertyImage.php';

class PropertyDeleter {
    private $conn;
    private $propertyModel;
    private $imageModel;
    private $results = [];
    
    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        $this->propertyModel = new Property();
        $this->imageModel = new PropertyImage();
    }
    
    public function deleteProperty($propertyCode) {
        echo "\n🗑️  Starting deletion for property: {$propertyCode}\n";
        echo str_repeat("=", 60) . "\n";
        
        try {
            // Step 1: Find property by code or ID
            $property = $this->findProperty($propertyCode);
            if (!$property) {
                echo "❌ Property not found: {$propertyCode}\n";
                return false;
            }
            
            $propertyId = $property['id'];
            $propertyTitle = $property['title'];
            
            echo "✅ Found property: {$propertyTitle} (ID: {$propertyId})\n";
            
            // Step 2: Get all images for this property
            $images = $this->imageModel->getByPropertyId($propertyId);
            echo "📸 Found " . count($images) . " images to delete\n";
            
            // Step 3: Delete image files from filesystem
            $this->deleteImageFiles($propertyId, $images);
            
            // Step 4: Delete from database (images first due to FK constraints)
            $this->deleteDatabaseRecords($propertyId);
            
            // Step 5: Clear any caches
            $this->clearCaches($propertyId);
            
            echo "✅ Property {$propertyCode} deleted successfully!\n";
            
            $this->results[$propertyCode] = [
                'success' => true,
                'property_id' => $propertyId,
                'title' => $propertyTitle,
                'images_deleted' => count($images),
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            return true;
            
        } catch (Exception $e) {
            echo "❌ Error deleting property {$propertyCode}: " . $e->getMessage() . "\n";
            $this->results[$propertyCode] = [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
            return false;
        }
    }
    
    private function findProperty($propertyCode) {
        // Try to find by ID first, then by title pattern
        $queries = [
            "SELECT * FROM properties WHERE id = :code",
            "SELECT * FROM properties WHERE title LIKE :title_pattern"
        ];
        
        foreach ($queries as $query) {
            $stmt = $this->conn->prepare($query);
            
            if (strpos($query, 'title LIKE') !== false) {
                $titlePattern = '%' . str_replace('prop-', '', $propertyCode) . '%';
                $stmt->bindParam(':title_pattern', $titlePattern);
            } else {
                $stmt->bindParam(':code', $propertyCode);
            }
            
            $stmt->execute();
            $property = $stmt->fetch();
            
            if ($property) {
                return $property;
            }
        }
        
        return null;
    }
    
    private function deleteImageFiles($propertyId, $images) {
        echo "🗂️  Deleting image files...\n";
        
        // Delete individual image files
        foreach ($images as $image) {
            if ($image['image_path']) {
                $fullPath = __DIR__ . '/../..' . $image['image_path'];
                if (file_exists($fullPath)) {
                    if (unlink($fullPath)) {
                        echo "   ✅ Deleted: {$image['image_path']}\n";
                    } else {
                        echo "   ❌ Failed to delete: {$image['image_path']}\n";
                    }
                } else {
                    echo "   ⚠️  File not found: {$image['image_path']}\n";
                }
            }
            
            // Delete thumbnail if exists
            if ($image['thumbnail_url']) {
                $thumbnailPath = __DIR__ . '/../..' . $image['thumbnail_url'];
                if (file_exists($thumbnailPath)) {
                    if (unlink($thumbnailPath)) {
                        echo "   ✅ Deleted thumbnail: {$image['thumbnail_url']}\n";
                    }
                }
            }
        }
        
        // Delete property directory
        $propertyDir = __DIR__ . '/../../uploads/properties/' . $propertyId;
        if (is_dir($propertyDir)) {
            if ($this->deleteDirectory($propertyDir)) {
                echo "   ✅ Deleted directory: /uploads/properties/{$propertyId}/\n";
            } else {
                echo "   ❌ Failed to delete directory: /uploads/properties/{$propertyId}/\n";
            }
        } else {
            echo "   ⚠️  Directory not found: /uploads/properties/{$propertyId}/\n";
        }
        
        // Delete from public/images if exists
        $publicDir = __DIR__ . '/../../public/images/prop-' . substr($propertyId, -3);
        if (is_dir($publicDir)) {
            if ($this->deleteDirectory($publicDir)) {
                echo "   ✅ Deleted public directory: /public/images/prop-" . substr($propertyId, -3) . "/\n";
            }
        }
        
        // Delete from dist/images if exists
        $distDir = __DIR__ . '/../../dist/images/prop-' . substr($propertyId, -3);
        if (is_dir($distDir)) {
            if ($this->deleteDirectory($distDir)) {
                echo "   ✅ Deleted dist directory: /dist/images/prop-" . substr($propertyId, -3) . "/\n";
            }
        }
    }
    
    private function deleteDirectory($dir) {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }
        
        return rmdir($dir);
    }
    
    private function deleteDatabaseRecords($propertyId) {
        echo "🗄️  Deleting database records...\n";
        
        try {
            $this->conn->beginTransaction();
            
            // Delete property images first (FK constraint)
            $stmt = $this->conn->prepare("DELETE FROM property_images WHERE property_id = :property_id");
            $stmt->bindParam(':property_id', $propertyId);
            $imagesDeleted = $stmt->execute();
            $imageCount = $stmt->rowCount();
            echo "   ✅ Deleted {$imageCount} image records\n";
            
            // Delete from any other related tables if they exist
            $relatedTables = [
                'property_features' => 'property_id',
                'property_amenities' => 'property_id',
                'property_views' => 'property_id',
                'favorites' => 'property_id'
            ];
            
            foreach ($relatedTables as $table => $column) {
                try {
                    $stmt = $this->conn->prepare("DELETE FROM {$table} WHERE {$column} = :property_id");
                    $stmt->bindParam(':property_id', $propertyId);
                    $stmt->execute();
                    $count = $stmt->rowCount();
                    if ($count > 0) {
                        echo "   ✅ Deleted {$count} records from {$table}\n";
                    }
                } catch (PDOException $e) {
                    // Table might not exist, continue
                    echo "   ⚠️  Table {$table} not found (skipping)\n";
                }
            }
            
            // Delete the property itself
            $stmt = $this->conn->prepare("DELETE FROM properties WHERE id = :property_id");
            $stmt->bindParam(':property_id', $propertyId);
            $propertyDeleted = $stmt->execute();
            $propertyCount = $stmt->rowCount();
            
            if ($propertyCount > 0) {
                echo "   ✅ Deleted property record\n";
            } else {
                echo "   ❌ Failed to delete property record\n";
            }
            
            $this->conn->commit();
            echo "   ✅ Database transaction committed\n";
            
        } catch (Exception $e) {
            $this->conn->rollback();
            echo "   ❌ Database transaction rolled back: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    private function clearCaches($propertyId) {
        echo "🧹 Clearing caches...\n";
        
        // Clear any PHP opcache
        if (function_exists('opcache_reset')) {
            opcache_reset();
            echo "   ✅ PHP opcache cleared\n";
        }
        
        // Clear any file-based caches
        $cacheDirectories = [
            __DIR__ . '/../cache/',
            __DIR__ . '/../../cache/',
            __DIR__ . '/../../tmp/'
        ];
        
        foreach ($cacheDirectories as $cacheDir) {
            if (is_dir($cacheDir)) {
                $this->clearCacheDirectory($cacheDir);
                echo "   ✅ Cleared cache directory: {$cacheDir}\n";
            }
        }
    }
    
    private function clearCacheDirectory($dir) {
        $files = glob($dir . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
    
    public function verifyDeletion($propertyCodes) {
        echo "\n🔍 VERIFICATION REPORT\n";
        echo str_repeat("=", 60) . "\n";
        
        foreach ($propertyCodes as $code) {
            echo "\nVerifying deletion of: {$code}\n";
            echo str_repeat("-", 40) . "\n";
            
            // Check database
            $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM properties WHERE id = :code OR title LIKE :title_pattern");
            $titlePattern = '%' . str_replace('prop-', '', $code) . '%';
            $stmt->bindParam(':code', $code);
            $stmt->bindParam(':title_pattern', $titlePattern);
            $stmt->execute();
            $propertyCount = $stmt->fetchColumn();
            
            if ($propertyCount == 0) {
                echo "✅ Database: Property not found (deleted)\n";
            } else {
                echo "❌ Database: Property still exists ({$propertyCount} records)\n";
            }
            
            // Check images
            $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM property_images WHERE property_id = :code");
            $stmt->bindParam(':code', $code);
            $stmt->execute();
            $imageCount = $stmt->fetchColumn();
            
            if ($imageCount == 0) {
                echo "✅ Database: No image records found (deleted)\n";
            } else {
                echo "❌ Database: {$imageCount} image records still exist\n";
            }
            
            // Check filesystem
            $propertyDir = __DIR__ . '/../../uploads/properties/' . $code;
            if (!is_dir($propertyDir)) {
                echo "✅ Filesystem: Upload directory not found (deleted)\n";
            } else {
                echo "❌ Filesystem: Upload directory still exists\n";
            }
            
            // Check public images
            $publicDir = __DIR__ . '/../../public/images/' . $code;
            if (!is_dir($publicDir)) {
                echo "✅ Filesystem: Public directory not found (deleted)\n";
            } else {
                echo "❌ Filesystem: Public directory still exists\n";
            }
        }
    }
    
    public function getResults() {
        return $this->results;
    }
}

// Main execution
if (php_sapi_name() === 'cli') {
    echo "🚀 ConsultingG Real Estate - Property Deletion Script\n";
    echo "=" . str_repeat("=", 59) . "\n";
    echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
    echo "=" . str_repeat("=", 59) . "\n";
    
    $propertiesToDelete = ['prop-004', 'prop-005'];
    
    if (isset($argv[1])) {
        $propertiesToDelete = array_slice($argv, 1);
    }
    
    echo "Properties to delete: " . implode(', ', $propertiesToDelete) . "\n";
    
    // Confirmation prompt
    echo "\n⚠️  WARNING: This will permanently delete the properties and ALL associated data!\n";
    echo "Are you sure you want to continue? (yes/no): ";
    $handle = fopen("php://stdin", "r");
    $confirmation = trim(fgets($handle));
    fclose($handle);
    
    if (strtolower($confirmation) !== 'yes') {
        echo "❌ Deletion cancelled by user.\n";
        exit(1);
    }
    
    $deleter = new PropertyDeleter();
    $successCount = 0;
    
    foreach ($propertiesToDelete as $propertyCode) {
        if ($deleter->deleteProperty($propertyCode)) {
            $successCount++;
        }
    }
    
    // Verification
    $deleter->verifyDeletion($propertiesToDelete);
    
    // Final report
    echo "\n📊 FINAL REPORT\n";
    echo str_repeat("=", 60) . "\n";
    echo "Total properties processed: " . count($propertiesToDelete) . "\n";
    echo "Successfully deleted: {$successCount}\n";
    echo "Failed: " . (count($propertiesToDelete) - $successCount) . "\n";
    
    $results = $deleter->getResults();
    foreach ($results as $code => $result) {
        echo "\n{$code}: " . ($result['success'] ? '✅ SUCCESS' : '❌ FAILED') . "\n";
        if (isset($result['error'])) {
            echo "  Error: {$result['error']}\n";
        }
    }
    
    echo "\n🎯 Next steps:\n";
    echo "1. Clear frontend cache/localStorage\n";
    echo "2. Test API endpoints for deleted properties\n";
    echo "3. Verify properties don't appear in UI\n";
    echo "4. Check DevTools for 404 image requests\n";
    
    exit($successCount === count($propertiesToDelete) ? 0 : 1);
} else {
    // Web interface (admin only)
    header('Content-Type: application/json');
    
    // Simple auth check
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? null;
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $propertiesToDelete = $input['property_codes'] ?? [];
    
    if (empty($propertiesToDelete)) {
        http_response_code(400);
        echo json_encode(['error' => 'No property codes provided']);
        exit;
    }
    
    $deleter = new PropertyDeleter();
    $results = [];
    
    foreach ($propertiesToDelete as $code) {
        $results[$code] = $deleter->deleteProperty($code);
    }
    
    echo json_encode([
        'success' => true,
        'results' => $deleter->getResults()
    ]);
}
?>