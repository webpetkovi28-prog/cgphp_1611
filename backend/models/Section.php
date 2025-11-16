<?php
require_once __DIR__ . '/../config/database.php';

class Section {
    private $conn;
    private $table_name = "sections";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function getAll($activeOnly = true, $type = null) {
        $query = "SELECT s.*, p.title as page_title FROM " . $this->table_name . " s 
                  LEFT JOIN pages p ON s.page_id = p.id WHERE 1=1";
        
        if ($activeOnly) {
            $query .= " AND s.active = true";
        }
        
        if ($type) {
            $query .= " AND s.section_type = :type";
        }
        
        $query .= " ORDER BY s.sort_order ASC, s.created_at DESC";

        $stmt = $this->conn->prepare($query);
        
        if ($type) {
            $stmt->bindParam(':type', $type);
        }
        
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getById($id) {
        $query = "SELECT s.*, p.title as page_title FROM " . $this->table_name . " s 
                  LEFT JOIN pages p ON s.page_id = p.id 
                  WHERE s.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (id, page_id, title, content, section_type, sort_order, active, meta_data) 
                  VALUES 
                  (:id, :page_id, :title, :content, :section_type, :sort_order, :active, :meta_data)";

        $stmt = $this->conn->prepare($query);
        
        $data['id'] = $this->generateUUID();
        $data['page_id'] = $data['page_id'] ?? 'page-001'; // Default to home page
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['active'] = $data['active'] ?? true;
        
        // Handle meta_data for PostgreSQL JSONB
        if (isset($data['meta_data'])) {
            if (is_array($data['meta_data']) || is_object($data['meta_data'])) {
                $data['meta_data'] = json_encode($data['meta_data']);
            }
        } else {
            $data['meta_data'] = null;
        }
        
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':page_id', $data['page_id']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':section_type', $data['section_type']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);
        $stmt->bindParam(':meta_data', $data['meta_data']);

        if ($stmt->execute()) {
            return $data['id'];
        }
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                  page_id = :page_id, title = :title, content = :content, 
                  section_type = :section_type, sort_order = :sort_order, 
                  active = :active, meta_data = :meta_data,
                  updated_at = CURRENT_TIMESTAMP 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        // Handle meta_data for PostgreSQL JSONB
        if (isset($data['meta_data'])) {
            if (is_array($data['meta_data']) || is_object($data['meta_data'])) {
                $data['meta_data'] = json_encode($data['meta_data']);
            }
        } else {
            $data['meta_data'] = null;
        }
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':page_id', $data['page_id']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':section_type', $data['section_type']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);
        $stmt->bindParam(':meta_data', $data['meta_data']);

        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updateSortOrder($id, $sortOrder) {
        $query = "UPDATE " . $this->table_name . " SET sort_order = :sort_order WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':sort_order', $sortOrder);
        
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