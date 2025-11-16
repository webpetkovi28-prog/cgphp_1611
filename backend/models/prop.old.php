<?php
require_once __DIR__ . '/../config/database.php';

class Property {
    private $conn;
    private $table_name = "properties";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        // Begin transaction
        $this->conn->beginTransaction();
        
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                      (id, title, description, price, currency, transaction_type, property_type, 
                       city_region, district, address, area, bedrooms, bathrooms, floors, 
                       floor_number, terraces, construction_type, condition_type, heating, 
                       year_built, furnishing_level, has_elevator, has_garage, 
                       has_southern_exposure, new_construction, featured, active, property_code, sort_order) 
                      VALUES 
                      (:id, :title, :description, :price, :currency, :transaction_type, :property_type,
                       :city_region, :district, :address, :area, :bedrooms, :bathrooms, :floors,
                       :floor_number, :terraces, :construction_type, :condition_type, :heating,
                       :year_built, :furnishing_level, :has_elevator, :has_garage,
                       :has_southern_exposure, :new_construction, :featured, :active, :property_code, :sort_order)";

            $stmt = $this->conn->prepare($query);
            
            // Generate UUID
            $data['id'] = $this->generateUUID();
            
            // Generate sequential property code if not provided
            if (empty($data['property_code'])) {
                $data['property_code'] = $this->generateNextPropertyCode();
            }
            
            // Generate next sort_order value if not provided
            if (!isset($data['sort_order'])) {
                $sortOrderQuery = "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM " . $this->table_name;
                $sortOrderStmt = $this->conn->prepare($sortOrderQuery);
                $sortOrderStmt->execute();
                $data['sort_order'] = (int)$sortOrderStmt->fetchColumn();
            }
        
            // Handle optional fields - use NULL for missing/empty values in detail fields
            $data['description'] = !empty($data['description']) ? $data['description'] : null;
            $data['district'] = !empty($data['district']) ? $data['district'] : null;
            $data['address'] = !empty($data['address']) ? $data['address'] : null;
            $data['floors'] = isset($data['floors']) && $data['floors'] > 0 ? $data['floors'] : null;
            $data['floor_number'] = isset($data['floor_number']) && $data['floor_number'] > 0 ? $data['floor_number'] : null;
            $data['construction_type'] = !empty($data['construction_type']) ? $data['construction_type'] : null;
            $data['condition_type'] = !empty($data['condition_type']) ? $data['condition_type'] : null;
            $data['heating'] = !empty($data['heating']) ? $data['heating'] : null;
            $data['year_built'] = isset($data['year_built']) && $data['year_built'] > 0 ? $data['year_built'] : null;
            $data['furnishing_level'] = !empty($data['furnishing_level']) ? $data['furnishing_level'] : null;
            $data['bedrooms'] = isset($data['bedrooms']) && $data['bedrooms'] > 0 ? $data['bedrooms'] : null;
            $data['bathrooms'] = isset($data['bathrooms']) && $data['bathrooms'] > 0 ? $data['bathrooms'] : null;
            $data['terraces'] = isset($data['terraces']) && $data['terraces'] > 0 ? $data['terraces'] : null;
            $data['exposure'] = !empty($data['exposure']) ? $data['exposure'] : null;
            
            // Bind parameters
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':price', $data['price']);
            $stmt->bindParam(':currency', $data['currency']);
            $stmt->bindParam(':transaction_type', $data['transaction_type']);
            $stmt->bindParam(':property_type', $data['property_type']);
            $stmt->bindParam(':city_region', $data['city_region']);
            $stmt->bindParam(':district', $data['district']);
            $stmt->bindParam(':address', $data['address']);
            $stmt->bindParam(':area', $data['area']);
            $stmt->bindParam(':bedrooms', $data['bedrooms']);
            $stmt->bindParam(':bathrooms', $data['bathrooms']);
            $stmt->bindParam(':floors', $data['floors']);
            $stmt->bindParam(':floor_number', $data['floor_number']);
            $stmt->bindParam(':terraces', $data['terraces']);
            $stmt->bindParam(':construction_type', $data['construction_type']);
            $stmt->bindParam(':condition_type', $data['condition_type']);
            $stmt->bindParam(':heating', $data['heating']);
            $stmt->bindParam(':year_built', $data['year_built']);
            $stmt->bindParam(':furnishing_level', $data['furnishing_level']);
            $stmt->bindParam(':has_elevator', $data['has_elevator'], PDO::PARAM_BOOL);
            $stmt->bindParam(':has_garage', $data['has_garage'], PDO::PARAM_BOOL);
            $stmt->bindParam(':has_southern_exposure', $data['has_southern_exposure'], PDO::PARAM_BOOL);
            $stmt->bindParam(':new_construction', $data['new_construction'], PDO::PARAM_BOOL);
            $stmt->bindParam(':featured', $data['featured'], PDO::PARAM_BOOL);
            $stmt->bindParam(':active', $data['active'], PDO::PARAM_BOOL);
            $stmt->bindParam(':property_code', $data['property_code']);
            $stmt->bindParam(':sort_order', $data['sort_order'], PDO::PARAM_INT);

            if ($stmt->execute()) {
                $this->conn->commit();
                return $data['id']; // Return UUID
            } else {
                $this->conn->rollback();
                return false;
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log('[Property@create] Transaction failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getAll($filters = []) {
        $query = "SELECT p.id, p.property_code, p.title, p.description, p.price, p.currency, p.transaction_type, 
                         p.property_type, p.city_region, p.district, p.address, p.area, 
                         p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, 
                         p.construction_type, p.condition_type, p.heating, p.exposure, 
                         p.year_built, p.furnishing_level, p.has_elevator, p.has_garage, 
                         p.has_southern_exposure, p.new_construction, p.featured, p.active, 
                         p.sort_order, p.created_at, p.updated_at
                  FROM " . $this->table_name . " p WHERE true";

        $params = [];

        // Apply filters
        if (!empty($filters['keyword'])) {
            $query .= " AND (
                p.title LIKE :keyword_like
                OR p.description LIKE :keyword_like
                OR p.city_region LIKE :keyword_like
                OR p.district LIKE :keyword_like
                OR p.address LIKE :keyword_like
            )";
            $params[':keyword_like'] = '%' . $filters['keyword'] . '%';
        }

        if (!empty($filters['transaction_type'])) {
            $query .= " AND p.transaction_type = :transaction_type";
            $params[':transaction_type'] = $filters['transaction_type'];
        }

        if (!empty($filters['city_region'])) {
            $query .= " AND p.city_region = :city_region";
            $params[':city_region'] = $filters['city_region'];
        }

        if (!empty($filters['property_type'])) {
            $query .= " AND p.property_type = :property_type";
            $params[':property_type'] = $filters['property_type'];
        }

        if (!empty($filters['district'])) {
            $query .= " AND p.district = :district";
            $params[':district'] = $filters['district'];
        }

        if (!empty($filters['price_min'])) {
            $query .= " AND p.price >= :price_min";
            $params[':price_min'] = $filters['price_min'];
        }

        if (!empty($filters['price_max'])) {
            $query .= " AND p.price <= :price_max";
            $params[':price_max'] = $filters['price_max'];
        }

        if (!empty($filters['area_min'])) {
            $query .= " AND p.area >= :area_min";
            $params[':area_min'] = $filters['area_min'];
        }

        if (!empty($filters['area_max'])) {
            $query .= " AND p.area <= :area_max";
            $params[':area_max'] = $filters['area_max'];
        }

        if (isset($filters['featured']) && $filters['featured'] === 'true') {
            $query .= " AND p.featured = TRUE";
        }

        if (!isset($filters['active']) || $filters['active'] !== 'all') {
            $query .= " AND p.active = TRUE";
        }

        $query .= " ORDER BY (p.sort_order IS NULL), p.sort_order ASC, p.created_at DESC, p.id ASC";

        if (!empty($filters['limit'])) {
            $query .= " LIMIT :limit";
            $params[':limit'] = (int)$filters['limit'];
        }

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            if ($key === ':limit') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        
        $stmt->execute();
        $properties = $stmt->fetchAll();

        // Fetch images for each property
        foreach ($properties as &$property) {
            $property['images'] = $this->getImagesForProperty($property['id']);
            
            // Process images with ImageHelper
            require_once __DIR__ . '/../utils/ImageHelper.php';
            $property['images'] = ImageHelper::processImages($property['images']);
        }

        return $properties;
    }

    public function getById($id) {
        error_log("Property::getById called with ID: " . $id);
        return $this->getByIdOrCode($id);
    }

    public function getByCode($code) {
        error_log("Property::getByCode called with code: " . $code);
        return $this->getByIdOrCode($code, true);
    }

    public function findOne(string $identifier): ?array {
      $identifier = trim($identifier);
      $where = " (p.id = :ident OR p.property_code = :ident) ";
      $sql = "
        SELECT
          p.id, p.property_code, p.title, p.description, p.price, p.currency,
          p.transaction_type, p.property_type, p.city_region, p.district, p.address, p.area,
          p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, p.construction_type,
          p.condition_type, p.heating, p.exposure, p.year_built, p.furnishing_level,
          p.has_elevator, p.has_garage, p.has_southern_exposure, p.new_construction,
          p.featured, p.active, p.created_at, p.updated_at
        FROM properties p
        WHERE {$where}
        LIMIT 1
      ";
      $stmt = $this->conn->prepare($sql);
      $stmt->bindValue(':ident', $identifier);
      $stmt->execute();
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($row) {
        // Fetch images separately
        $row['images'] = $this->getImagesForProperty($row['id']);
        
        // Process images with ImageHelper
        require_once __DIR__ . '/../utils/ImageHelper.php';
        $row['images'] = ImageHelper::processImages($row['images']);
      }
      
      return $row ?: null;
    }

    private function getByIdOrCode($identifier, $preferCode = false) {
        error_log("Property::getByIdOrCode called with identifier: " . $identifier);
        
        // If preferCode is true, lookup by property_code first, otherwise by id first
        if ($preferCode) {
            $whereClause = "p.property_code = :identifier";
        } else {
            // Try to determine if identifier is a UUID or a property code
            if (preg_match('/^prop-[0-9]+$/', $identifier)) {
                $whereClause = "p.property_code = :identifier";
            } else {
                $whereClause = "p.id = :identifier";
            }
        }
        
        $query = "SELECT p.id, p.property_code, p.title, p.description, p.price, p.currency, p.transaction_type, 
                         p.property_type, p.city_region, p.district, p.address, p.area, 
                         p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, 
                         p.construction_type, p.condition_type, p.heating, p.exposure, 
                         p.year_built, p.furnishing_level, p.has_elevator, p.has_garage, 
                         p.has_southern_exposure, p.new_construction, p.featured, p.active, 
                         p.created_at, p.updated_at
                  FROM " . $this->table_name . " p WHERE " . $whereClause;

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':identifier', $identifier);
        $stmt->execute();

        $property = $stmt->fetch();
        error_log("Query executed. Property found: " . ($property ? 'YES' : 'NO'));
        if ($property) {
            // Fetch images separately
            $property['images'] = $this->getImagesForProperty($property['id']);
            
            // Process images with ImageHelper
            require_once __DIR__ . '/../utils/ImageHelper.php';
            $property['images'] = ImageHelper::processImages($property['images']);
            
            // Add documents
            require_once __DIR__ . '/Document.php';
            $documentModel = new Document();
            $documents = $documentModel->getByPropertyId($property['id']);
            $property['documents'] = array_map(function($doc) {
                return [
                    'id' => $doc['id'],
                    'filename' => $doc['original_filename'],
                    'size' => $doc['file_size'],
                    'url' => '/api/documents/serve/' . $doc['id']
                ];
            }, $documents);
        }

        return $property;
    }

    public function update($id, $data) {
        // Begin transaction
        $this->conn->beginTransaction();
        
        try {
            // Build dynamic query based on provided fields only
            $fields = [];
            $params = [':id' => $id];
            
            // Define field mappings and their types
            $fieldMappings = [
                'title' => 'string',
                'description' => 'string',
                'price' => 'float',
                'currency' => 'string',
                'transaction_type' => 'string',
                'property_type' => 'string',
                'city_region' => 'string',
                'district' => 'string',
                'address' => 'string',
                'area' => 'float',
                'bedrooms' => 'int',
                'bathrooms' => 'int',
                'floors' => 'int',
                'floor_number' => 'int',
                'terraces' => 'int',
                'construction_type' => 'string',
                'condition_type' => 'string',
                'heating' => 'string',
                'year_built' => 'int',
                'furnishing_level' => 'string',
                'has_elevator' => 'bool',
                'has_garage' => 'bool',
                'has_southern_exposure' => 'bool',
                'new_construction' => 'bool',
                'featured' => 'bool',
                'active' => 'bool',
                'property_code' => 'string',
                'exposure' => 'string'
            ];
            
            foreach ($fieldMappings as $field => $type) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = :$field";
                    
                    // Handle optional fields with null values
                    $value = $data[$field];
                    if ($type === 'string' && empty($value)) {
                        $value = null;
                    } elseif (in_array($type, ['int', 'float']) && (!isset($value) || $value <= 0)) {
                        $value = null;
                    }
                    
                    $params[":$field"] = $value;
                }
            }
            
            // Always update timestamp
            $fields[] = "updated_at = CURRENT_TIMESTAMP";
            
            if (empty($fields)) {
                $this->conn->rollback();
                return false;
            }
            
            $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            // Bind parameters with proper types
            foreach ($params as $key => $value) {
                if ($key === ':id') {
                    $stmt->bindValue($key, $value);
                } else {
                    $fieldName = str_replace(':', '', $key);
                    if (isset($fieldMappings[$fieldName])) {
                        $type = $fieldMappings[$fieldName];
                        if ($type === 'bool') {
                            $stmt->bindValue($key, $value, PDO::PARAM_BOOL);
                        } elseif ($type === 'int') {
                            $stmt->bindValue($key, $value, PDO::PARAM_INT);
                        } else {
                            $stmt->bindValue($key, $value);
                        }
                    } else {
                        $stmt->bindValue($key, $value);
                    }
                }
            }

            if ($stmt->execute()) {
                $this->conn->commit();
                return true;
            } else {
                $this->conn->rollback();
                return false;
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log('[Property@update] Transaction failed: ' . $e->getMessage());
            return false;
        }
    }

    public function delete($id) {
        // First delete associated images
        require_once __DIR__ . '/PropertyImage.php';
        $imageModel = new PropertyImage();
        $imageModel->deleteByPropertyId($id);

        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function getAllPaginated(array $filters, int $page, int $limit): array {
        $where = ['1=1'];
        $params = [];

        // Apply filters
        if (isset($filters['featured']) && $filters['featured'] !== null) {
            $where[] = 'p.featured = :featured';
            $params[':featured'] = $filters['featured'] ? 1 : 0;
        }

        if (!empty($filters['keyword'])) {
            $where[] = '(
                p.title LIKE :keyword_like
                OR p.description LIKE :keyword_like
                OR p.city_region LIKE :keyword_like
                OR p.district LIKE :keyword_like
                OR p.address LIKE :keyword_like
            )';
            $params[':keyword_like'] = '%' . $filters['keyword'] . '%';
        }

        if (!empty($filters['transaction_type'])) {
            $where[] = 'p.transaction_type = :transaction_type';
            $params[':transaction_type'] = $filters['transaction_type'];
        }

        if (!empty($filters['city_region'])) {
            $where[] = 'p.city_region = :city_region';
            $params[':city_region'] = $filters['city_region'];
        }

        if (!empty($filters['property_type'])) {
            $where[] = 'p.property_type = :property_type';
            $params[':property_type'] = $filters['property_type'];
        }

        if (!empty($filters['district'])) {
            $where[] = 'p.district = :district';
            $params[':district'] = $filters['district'];
        }

        if (!empty($filters['price_min'])) {
            $where[] = 'p.price >= :price_min';
            $params[':price_min'] = $filters['price_min'];
        }

        if (!empty($filters['price_max'])) {
            $where[] = 'p.price <= :price_max';
            $params[':price_max'] = $filters['price_max'];
        }

        if (!empty($filters['area_min'])) {
            $where[] = 'p.area >= :area_min';
            $params[':area_min'] = $filters['area_min'];
        }

        if (!empty($filters['area_max'])) {
            $where[] = 'p.area <= :area_max';
            $params[':area_max'] = $filters['area_max'];
        }

        if (!isset($filters['active']) || $filters['active'] !== 'all') {
            $where[] = 'p.active = TRUE';
        }

        $whereSql = implode(' AND ', $where);
        $offset = max(0, ($page - 1) * $limit);

        // COUNT query
        $sqlCount = "SELECT COUNT(*) AS c FROM " . $this->table_name . " p WHERE $whereSql";
        $stmt = $this->conn->prepare($sqlCount);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();

        // DATA query
        $sql = "SELECT p.id, p.property_code, p.title, p.description, p.price, p.currency, p.transaction_type, 
                       p.property_type, p.city_region, p.district, p.address, p.area, 
                       p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, 
                       p.construction_type, p.condition_type, p.heating, p.exposure, 
                       p.year_built, p.furnishing_level, p.has_elevator, p.has_garage, 
                       p.has_southern_exposure, p.new_construction, p.featured, p.active, 
                       p.sort_order, p.created_at, p.updated_at
                FROM " . $this->table_name . " p 
                WHERE $whereSql
                ORDER BY (p.sort_order IS NULL), p.sort_order ASC, p.created_at DESC, p.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        // Fetch images for each property
        foreach ($items as &$item) {
            $item['images'] = $this->getImagesForProperty($item['id']);
            
            // Process images with ImageHelper
            require_once __DIR__ . '/../utils/ImageHelper.php';
            $item['images'] = ImageHelper::processImages($item['images']);
        }

        return ['items' => $items, 'total' => $total];
    }

    public function getStats() {
        $query = "SELECT 
                    COUNT(*) as total_properties,
                    COUNT(CASE WHEN active = true THEN 1 END) as active_properties,
                    COUNT(CASE WHEN featured = true THEN 1 END) as featured_properties,
                    AVG(price) as average_price
                  FROM " . $this->table_name;

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch();
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
    
    private function generateNextPropertyCode() {
        // Get existing property codes from database
        $query = "SELECT property_code FROM " . $this->table_name . " 
                  WHERE property_code IS NOT NULL AND property_code LIKE 'prop-%' 
                  ORDER BY property_code DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        
        $nextNumber = 1; // Default start
        
        if ($result && !empty($result['property_code'])) {
            // Extract number from prop-XXX format
            if (preg_match('/^prop-(\d+)$/', $result['property_code'], $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
        }
        
        // Also check existing filesystem folders to be safe
        $uploadsDir = __DIR__ . '/../../uploads/properties';
        if (is_dir($uploadsDir)) {
            $folders = glob($uploadsDir . '/prop-*', GLOB_ONLYDIR);
            foreach ($folders as $folder) {
                $folderName = basename($folder);
                if (preg_match('/^prop-(\d+)$/', $folderName, $matches)) {
                    $folderNumber = (int)$matches[1];
                    if ($folderNumber >= $nextNumber) {
                        $nextNumber = $folderNumber + 1;
                    }
                }
            }
        }
        
        // Determine padding based on existing codes
        $maxNumber = max($nextNumber - 1, 1);
        $paddingLength = max(3, strlen((string)$maxNumber)); // Minimum 3 digits, or match existing
        
        return 'prop-' . str_pad($nextNumber, $paddingLength, '0', STR_PAD_LEFT);
    }

    public function updateSortOrder($id, $sortOrder) {
        $query = "UPDATE " . $this->table_name . " 
                  SET sort_order = :sort_order, updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':sort_order', $sortOrder, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function updateMultipleSortOrders($orderData) {
        $this->conn->beginTransaction();
        try {
            foreach ($orderData as $item) {
                if (isset($item['id']) && isset($item['sort_order'])) {
                    $success = $this->updateSortOrder($item['id'], $item['sort_order']);
                    if (!$success) {
                        throw new Exception("Failed to update sort order for property ID: " . $item['id']);
                    }
                }
            }
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log('[PROPERTY] Update sort orders error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Helper method to fetch images for a property (MySQL compatible)
     * Replaces PostgreSQL json_agg() and json_build_object()
     */
    private function getImagesForProperty($propertyId) {
        $query = "SELECT id, property_id, image_url, image_path, is_main, sort_order, alt_text, created_at
                  FROM property_images
                  WHERE property_id = :property_id
                  ORDER BY is_main DESC, sort_order ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':property_id', $propertyId);
        $stmt->execute();
        
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Return as array (compatible with ImageHelper::processImages)
        return $images ?: [];
    }
}
?>