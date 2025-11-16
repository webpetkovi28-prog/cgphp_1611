<?php
require_once __DIR__ . '/../config/database.php';

class Service {
    private $conn;
    private $table_name = "services";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function getAll($activeOnly = true) {
        $query = "SELECT * FROM " . $this->table_name;
        if ($activeOnly) {
            $query .= " WHERE active = true";
        }
        $query .= " ORDER BY sort_order ASC";

        $stmt = $this->conn->prepare($query);
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

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (id, title, description, icon, color, sort_order, active) 
                  VALUES 
                  (:id, :title, :description, :icon, :color, :sort_order, :active)";

        $stmt = $this->conn->prepare($query);
        
        $data['id'] = $this->generateUUID();
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['active'] = $data['active'] ?? true;
        
        $stmt->bindParam(':id', $data['id']);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':icon', $data['icon']);
        $stmt->bindParam(':color', $data['color']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);

        if ($stmt->execute()) {
            return $this->getById($data['id']);
        }
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET 
                  title = :title, description = :description, icon = :icon, 
                  color = :color, sort_order = :sort_order, active = :active,
                  updated_at = CURRENT_TIMESTAMP 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':description', $data['description']);
        $stmt->bindParam(':icon', $data['icon']);
        $stmt->bindParam(':color', $data['color']);
        $stmt->bindParam(':sort_order', $data['sort_order']);
        $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);

        if ($stmt->execute()) {
            return $this->getById($id);
        }
        return false;
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