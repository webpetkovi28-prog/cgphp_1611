<?php
/**
 * Image Integrity Check and Repair Script
 * Checks for missing files, broken URLs, and database inconsistencies
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ImageHelper.php';

class ImageIntegrityChecker {
    private $conn;
    private $results = [];
    
    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }
    
    public function runCheck() {
        echo "🔍 Starting Image Integrity Check...\n\n";
        
        $this->checkDatabaseConsistency();
        $this->checkFileExistence();
        $this->checkMainImageConstraints();
        $this->generateReport();
        
        return $this->results;
    }
    
    private function checkDatabaseConsistency() {
        echo "📊 Checking database consistency...\n";
        
        // Check for orphaned images (property doesn't exist)
        $query = "SELECT pi.id, pi.property_id, pi.image_url 
                  FROM property_images pi 
                  LEFT JOIN properties p ON pi.property_id = p.id 
                  WHERE p.id IS NULL";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $orphanedImages = $stmt->fetchAll();
        
        if (!empty($orphanedImages)) {
            $this->results['orphaned_images'] = $orphanedImages;
            echo "⚠️  Found " . count($orphanedImages) . " orphaned images\n";
        } else {
            echo "✅ No orphaned images found\n";
        }
    }
    
    private function checkFileExistence() {
        echo "📁 Checking file existence...\n";
        
        $query = "SELECT id, property_id, image_url, image_path FROM property_images";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $images = $stmt->fetchAll();
        
        $missingFiles = [];
        $baseDir = __DIR__ . '/../..';
        
        foreach ($images as $image) {
            $imagePath = $image['image_path'] ?: $image['image_url'];
            if ($imagePath) {
                $fullPath = $baseDir . $imagePath;
                if (!file_exists($fullPath)) {
                    $missingFiles[] = [
                        'id' => $image['id'],
                        'property_id' => $image['property_id'],
                        'path' => $imagePath,
                        'full_path' => $fullPath
                    ];
                }
            }
        }
        
        if (!empty($missingFiles)) {
            $this->results['missing_files'] = $missingFiles;
            echo "⚠️  Found " . count($missingFiles) . " missing files\n";
        } else {
            echo "✅ All image files exist\n";
        }
    }
    
    private function checkMainImageConstraints() {
        echo "🎯 Checking main image constraints...\n";
        
        // Properties with multiple main images
        $query = "SELECT property_id, COUNT(*) as main_count 
                  FROM property_images 
                  WHERE is_main = true 
                  GROUP BY property_id 
                  HAVING COUNT(*) > 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $multipleMain = $stmt->fetchAll();
        
        if (!empty($multipleMain)) {
            $this->results['multiple_main'] = $multipleMain;
            echo "⚠️  Found " . count($multipleMain) . " properties with multiple main images\n";
        } else {
            echo "✅ No properties with multiple main images\n";
        }
        
        // Properties with no main images but have images
        $query = "SELECT DISTINCT p.id as property_id, COUNT(pi.id) as image_count
                  FROM properties p
                  LEFT JOIN property_images pi ON p.id = pi.property_id
                  WHERE pi.id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM property_images pi2 
                      WHERE pi2.property_id = p.id AND pi2.is_main = true
                  )
                  GROUP BY p.id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $noMain = $stmt->fetchAll();
        
        if (!empty($noMain)) {
            $this->results['no_main'] = $noMain;
            echo "⚠️  Found " . count($noMain) . " properties with no main image\n";
        } else {
            echo "✅ All properties with images have a main image\n";
        }
    }
    
    private function generateReport() {
        echo "\n📋 INTEGRITY CHECK REPORT\n";
        echo "=" . str_repeat("=", 50) . "\n";
        
        $totalIssues = 0;
        
        if (isset($this->results['orphaned_images'])) {
            $count = count($this->results['orphaned_images']);
            echo "🗑️  Orphaned images: {$count}\n";
            $totalIssues += $count;
        }
        
        if (isset($this->results['missing_files'])) {
            $count = count($this->results['missing_files']);
            echo "📁 Missing files: {$count}\n";
            $totalIssues += $count;
        }
        
        if (isset($this->results['multiple_main'])) {
            $count = count($this->results['multiple_main']);
            echo "🎯 Multiple main images: {$count}\n";
            $totalIssues += $count;
        }
        
        if (isset($this->results['no_main'])) {
            $count = count($this->results['no_main']);
            echo "❌ No main images: {$count}\n";
            $totalIssues += $count;
        }
        
        echo "\n";
        if ($totalIssues === 0) {
            echo "🎉 All checks passed! No issues found.\n";
        } else {
            echo "⚠️  Total issues found: {$totalIssues}\n";
            echo "💡 Run the repair script to fix these issues.\n";
        }
    }
    
    public function repairIssues() {
        echo "🔧 Starting repair process...\n\n";
        
        // Remove orphaned images
        if (isset($this->results['orphaned_images'])) {
            foreach ($this->results['orphaned_images'] as $image) {
                $query = "DELETE FROM property_images WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $image['id']);
                $stmt->execute();
                echo "🗑️  Removed orphaned image: {$image['id']}\n";
            }
        }
        
        // Remove database records for missing files
        if (isset($this->results['missing_files'])) {
            foreach ($this->results['missing_files'] as $file) {
                $query = "DELETE FROM property_images WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $file['id']);
                $stmt->execute();
                echo "📁 Removed DB record for missing file: {$file['path']}\n";
            }
        }
        
        echo "\n✅ Repair completed!\n";
    }
}

// Run the check
if (php_sapi_name() === 'cli') {
    $checker = new ImageIntegrityChecker();
    $checker->runCheck();
    
    if (isset($argv[1]) && $argv[1] === '--repair') {
        $checker->repairIssues();
    }
} else {
    // Web interface
    header('Content-Type: application/json');
    $checker = new ImageIntegrityChecker();
    $results = $checker->runCheck();
    echo json_encode($results);
}
?>