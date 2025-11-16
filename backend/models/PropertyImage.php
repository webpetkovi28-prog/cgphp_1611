<?php
require_once __DIR__ . '/../config/database.php';

class PropertyImage {
    private $conn;
    private $table_name = "property_images";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (id, property_id, image_url, image_path, thumbnail_url, alt_text, sort_order, is_main, file_size, mime_type) 
                  VALUES 
                  (:id, :property_id, :image_url, :image_path, :thumbnail_url, :alt_text, :sort_order, :is_main, :file_size, :mime_type)";

        $stmt = $this->conn->prepare($query);
        
        $data['id'] = $this->generateUUID();
        $data['thumbnail_url'] = $data['thumbnail_url'] ?? null;
        $data['file_size'] = $data['file_size'] ?? 0;
        $data['mime_type'] = $data['mime_type'] ?? '';
        
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':image_path', $data['image_path']);
        $stmt->bindParam(':thumbnail_url', $data['thumbnail_url']);
        $stmt->bindParam(':alt_text', $data['alt_text']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':is_main', $data['is_main'], PDO::PARAM_BOOL);
        $stmt->bindParam(':file_size', $data['file_size']);
        $stmt->bindParam(':mime_type', $data['mime_type']);

        if ($stmt->execute()) {
            return $data['id'];
        }
        return false;
    }

    public function getByPropertyId($property_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE property_id = :property_id 
                  ORDER BY is_main DESC, sort_order ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $property_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }
    
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch();
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                  image_url = :image_url, image_path = :image_path, thumbnail_url = :thumbnail_url,
                  alt_text = :alt_text, sort_order = :sort_order, is_main = :is_main,
                  file_size = :file_size, mime_type = :mime_type
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':image_url', $data['image_url']);
        $stmt->bindParam(':image_path', $data['image_path']);
        $stmt->bindParam(':thumbnail_url', $data['thumbnail_url']);
        $stmt->bindParam(':alt_text', $data['alt_text']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':is_main', $data['is_main'], PDO::PARAM_BOOL);
        $stmt->bindParam(':file_size', $data['file_size']);
        $stmt->bindParam(':mime_type', $data['mime_type']);

        return $stmt->execute();
    }

    public function delete($id) {
        // Get image info before deleting
        $image = $this->getById($id);
        if (!$image) {
            return false;
        }

        $propertyId = $image['property_id'];
        $wasMainImage = (bool)$image['is_main'];

        // Start transaction for atomic operation
        $database = Database::getInstance();
        $conn = $database->getConnection();
        
        try {
            $conn->beginTransaction();

            // Delete from database first
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if (!$stmt->execute()) {
                $conn->rollback();
                error_log('[PropertyImage] Database delete failed for ID: ' . $id);
                return false;
            }
            
            // If we deleted the main image, set another image as main
            if ($wasMainImage) {
                error_log('[PropertyImage] Deleted image was main, finding replacement...');
                
                // Get the first remaining image (ordered by sort_order, then by id)
                $query = "SELECT id FROM " . $this->table_name . " 
                          WHERE property_id = :property_id 
                          ORDER BY sort_order ASC, id ASC 
                          LIMIT 1";
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':property_id', $propertyId);
                $stmt->execute();
                $nextImage = $stmt->fetch();
                
                if ($nextImage) {
                    // Set the first remaining image as main
                    $query = "UPDATE " . $this->table_name . " SET is_main = :true WHERE id = :id";
                    $stmt = $conn->prepare($query);
                    $stmt->bindValue(':true', true, PDO::PARAM_BOOL);
                    $stmt->bindParam(':id', $nextImage['id']);
                    $stmt->execute();
                    
                    error_log('[PropertyImage] Set new main image: ' . $nextImage['id']);
                } else {
                    error_log('[PropertyImage] No remaining images to set as main for property: ' . $propertyId);
                }
            }
            
            $conn->commit();
            error_log('[PropertyImage] Database delete successful for ID: ' . $id);
            
            // Delete physical files after successful database operation
            require_once __DIR__ . '/../utils/ImageProcessor.php';
            $mainImagePath = $image['image_path'] ? __DIR__ . '/../..' . $image['image_path'] : null;
            $thumbnailPath = $image['thumbnail_url'] ? __DIR__ . '/../..' . $image['thumbnail_url'] : null;
            
            if ($mainImagePath || $thumbnailPath) {
                $deleteResult = ImageProcessor::deleteImageFiles($mainImagePath, $thumbnailPath);
                error_log('[PropertyImage] File deletion result: ' . json_encode($deleteResult));
            }
            
            return true;
            
        } catch (Throwable $e) {
            $conn->rollback();
            error_log('[PropertyImage] Delete transaction failed: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteByPropertyId($property_id) {
        // Get all images for this property
        $images = $this->getByPropertyId($property_id);
        
        // Delete files from filesystem using ImageProcessor
        require_once __DIR__ . '/../utils/ImageProcessor.php';
        foreach ($images as $image) {
            $mainImagePath = $image['image_path'] ? __DIR__ . '/../..' . $image['image_path'] : null;
            $thumbnailPath = $image['thumbnail_url'] ? __DIR__ . '/../..' . $image['thumbnail_url'] : null;
            
            if ($mainImagePath || $thumbnailPath) {
                ImageProcessor::deleteImageFiles($mainImagePath, $thumbnailPath);
            }
        }

        // Delete from database
        $query = "DELETE FROM " . $this->table_name . " WHERE property_id = :property_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $property_id);
        
        return $stmt->execute();
    }

    public function unsetMainImages($property_id) {
        $query = "UPDATE " . $this->table_name . " SET is_main = false WHERE property_id = :property_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $property_id);
        return $stmt->execute();
    }

    public function setMainImage($property_id, $image_id) {
        $database = Database::getInstance();
        $conn = $database->getConnection();
        
        try {
            // Start transaction
            $conn->beginTransaction();
            
            // First, unset all main images for this property
            $query = "UPDATE " . $this->table_name . " SET is_main = :false WHERE property_id = :property_id";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':false', false, PDO::PARAM_BOOL);
            $stmt->bindParam(':property_id', $property_id);
            $stmt->execute();

            // Then set the specified image as main
            $query = "UPDATE " . $this->table_name . " SET is_main = :true WHERE id = :id AND property_id = :property_id";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':true', true, PDO::PARAM_BOOL);
            $stmt->bindParam(':id', $image_id);
            $stmt->bindParam(':property_id', $property_id);
        
            $result = $stmt->execute();
            $conn->commit();
            return $result;
        } catch (Throwable $e) {
            $conn->rollback();
            throw $e;
        }
    }

    public function deleteByPropertyAndImageId($propertyId, $imageId) {
        // Get image info before deleting
        $query = "SELECT image_path, thumbnail_url FROM " . $this->table_name . " WHERE id = :id AND property_id = :property_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $imageId);
        $stmt->bindParam(':property_id', $propertyId);
        $stmt->execute();
        $image = $stmt->fetch();
        
        if (!$image) {
            return false; // Image not found
        }

        // Delete files from filesystem using ImageProcessor
        require_once __DIR__ . '/../utils/ImageProcessor.php';
        $mainImagePath = $image['image_path'] ? __DIR__ . '/../..' . $image['image_path'] : null;
        $thumbnailPath = $image['thumbnail_url'] ? __DIR__ . '/../..' . $image['thumbnail_url'] : null;
        
        if ($mainImagePath || $thumbnailPath) {
            ImageProcessor::deleteImageFiles($mainImagePath, $thumbnailPath);
        }

        // Delete from database
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND property_id = :property_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $imageId);
        $stmt->bindParam(':property_id', $propertyId);
        
        return $stmt->execute();
    }

    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
?>