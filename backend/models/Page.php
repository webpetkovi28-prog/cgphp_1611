<?php
require_once __DIR__ . '/../config/database.php';

class Page {
    private $conn;
    private $table_name = "pages";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function getAll($activeOnly = true) {
        $query = "SELECT * FROM " . $this->table_name;
        if ($activeOnly) {
            $query .= " WHERE active = true";
        }
        $query .= " ORDER BY title ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getBySlug($slug) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE slug = :slug AND active = true";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':slug', $slug);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (id, slug, title, content, meta_description, active) 
                  VALUES 
                  (:id, :slug, :title, :content, :meta_description, :active)";

        $stmt = $this->conn->prepare($query);
        
        $data['id'] = $this->generateUUID();
        $data['active'] = $data['active'] ?? true;
        
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':slug', $data['slug']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':meta_description', $data['meta_description']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);

        if ($stmt->execute()) {
            return $data['id'];
        }
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                  slug = :slug, title = :title, content = :content, 
                  meta_description = :meta_description, active = :active,
                  updated_at = CURRENT_TIMESTAMP 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':slug', $data['slug']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':meta_description', $data['meta_description']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);

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