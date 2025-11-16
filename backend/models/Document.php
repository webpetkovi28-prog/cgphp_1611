<?php
require_once __DIR__ . '/../config/database.php';

class Document {
    private $conn;
    private $table_name = "property_documents";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        // Generate UUID for new document (MySQL-compatible)
        $data['id'] = $this->generateUUID();
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (id, property_id, filename, original_filename, file_path, file_size, mime_type) 
                  VALUES 
                  (:id, :property_id, :filename, :original_filename, :file_path, :file_size, :mime_type)";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':filename', $data['filename']);
        $stmt->bindParam(':original_filename', $data['original_filename']);
        $stmt->bindParam(':file_path', $data['file_path']);
        $stmt->bindParam(':file_size', $data['file_size']);
        $stmt->bindParam(':mime_type', $data['mime_type']);

        if ($stmt->execute()) {
            return $data['id'];
        }
        return false;
    }

    public function getByPropertyId($propertyId) {
        $query = "SELECT id, filename, original_filename, file_path, file_size, mime_type, created_at 
                  FROM " . $this->table_name . " 
                  WHERE property_id = :property_id 
                  ORDER BY created_at ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $propertyId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function deleteByPropertyId($propertyId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE property_id = :property_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $propertyId);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
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