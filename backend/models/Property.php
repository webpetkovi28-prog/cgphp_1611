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
        $this->conn->beginTransaction();
        
        try {
            $query = "INSERT INTO " . $this->table_name . " 
                      (id, title, description, price, currency, transaction_type, property_type, 
                       city_region, district, address, area, bedrooms, bathrooms, floors, 
                       floor_number, terraces, construction_type, condition_type, heating, exposure,
                       year_built, furnishing_level, has_elevator, has_garage, 
                       has_southern_exposure, new_construction, featured, active, property_code, sort_order) 
                      VALUES 
                      (:id, :title, :description, :price, :currency, :transaction_type, :property_type,
                       :city_region, :district, :address, :area, :bedrooms, :bathrooms, :floors,
                       :floor_number, :terraces, :construction_type, :condition_type, :heating, :exposure,
                       :year_built, :furnishing_level, :has_elevator, :has_garage,
                       :has_southern_exposure, :new_construction, :featured, :active, :property_code, :sort_order)";

            $stmt = $this->conn->prepare($query);
            
            $data['id'] = $this->generateUUID();
            
            if (empty($data['property_code'])) {
                $data['property_code'] = $this->generateNextPropertyCode();
            }
            
            if (!isset($data['sort_order'])) {
                $sortOrderQuery = "SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM " . $this->table_name;
                $sortOrderStmt = $this->conn->prepare($sortOrderQuery);
                $sortOrderStmt->execute();
                $data['sort_order'] = (int)$sortOrderStmt->fetchColumn();
            }
        
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
            $stmt->bindParam(':exposure', $data['exposure']);
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
                return $data['id'];
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
                  FROM " . $this->table_name . " p WHERE 1=1";

        $params = [];

        // ✅ SAFE KEYWORD SEARCH – работи с кирилица
        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            if ($keyword !== '') {
                $params[':keyword'] = '%' . $keyword . '%';

                $query .= " AND (
                    p.title          LIKE :keyword
                    OR p.description LIKE :keyword
                    OR p.city_region LIKE :keyword
                    OR p.district    LIKE :keyword
                    OR p.address     LIKE :keyword
                    OR p.property_code  LIKE :keyword
                    OR p.property_type  LIKE :keyword
                )";
            }
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

        $query .= " ORDER BY 
                    CASE WHEN p.sort_order IS NULL THEN 1 ELSE 0 END, 
                    p.sort_order ASC, 
                    p.created_at DESC, 
                    p.id ASC";

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
        $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($properties as &$property) {
            $this->normalizeBooleans($property);
            $property['images'] = $this->getPropertyImages($property['id']);
        }

        return $properties;
    }

    public function getById($id) {
        return $this->findOne($id);
    }

    public function getByCode($code) {
        return $this->findOne($code);
    }

    public function findOne(string $identifier): ?array {
        $identifier = trim($identifier);
        
        $sql = "SELECT
                  p.id, p.property_code, p.title, p.description, p.price, p.currency,
                  p.transaction_type, p.property_type, p.city_region, p.district, p.address, p.area,
                  p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, p.construction_type,
                  p.condition_type, p.heating, p.exposure, p.year_built, p.furnishing_level,
                  p.has_elevator, p.has_garage, p.has_southern_exposure, p.new_construction,
                  p.featured, p.active, p.sort_order, p.created_at, p.updated_at
                FROM properties p
                WHERE p.property_code = :ident
                LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':ident', $identifier);
        $stmt->execute();
        $property = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$property) {
            $sql = "SELECT
                      p.id, p.property_code, p.title, p.description, p.price, p.currency,
                      p.transaction_type, p.property_type, p.city_region, p.district, p.address, p.area,
                      p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, p.construction_type,
                      p.condition_type, p.heating, p.exposure, p.year_built, p.furnishing_level,
                      p.has_elevator, p.has_garage, p.has_southern_exposure, p.new_construction,
                      p.featured, p.active, p.sort_order, p.created_at, p.updated_at
                    FROM properties p
                    WHERE p.id = :ident
                    LIMIT 1";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':ident', $identifier);
            $stmt->execute();
            $property = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$property) {
            return null;
        }
        
        $this->normalizeBooleans($property);
        $property['images'] = $this->getPropertyImages($property['id']);
        
        if (file_exists(__DIR__ . '/Document.php')) {
            require_once __DIR__ . '/Document.php';
            try {
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
            } catch (Exception $e) {
                error_log('[Property@findOne] Failed to load documents: ' . $e->getMessage());
                $property['documents'] = [];
            }
        } else {
            $property['documents'] = [];
        }
        
        return $property;
    }

    public function update($id, $data) {
        $this->conn->beginTransaction();
        
        try {
            $fields = [];
            $params = [':id' => $id];
            
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
                    
                    $value = $data[$field];
                    if ($type === 'string' && empty($value)) {
                        $value = null;
                    } elseif (in_array($type, ['int', 'float']) && (!isset($value) || $value <= 0)) {
                        $value = null;
                    }
                    
                    $params[":$field"] = $value;
                }
            }
            
            $fields[] = "updated_at = CURRENT_TIMESTAMP";
            
            if (count($fields) === 1) {
                $this->conn->rollback();
                return false;
            }
            
            $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
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

        if (isset($filters['featured']) && $filters['featured'] !== null) {
            $where[] = 'p.featured = :featured';
            $params[':featured'] = $filters['featured'] ? 1 : 0;
        }

        // ✅ SAFE KEYWORD SEARCH – работи с кирилица
        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            if ($keyword !== '') {
                $params[':keyword'] = '%' . $keyword . '%';

                $where[] = "(
                    p.title          LIKE :keyword
                    OR p.description LIKE :keyword
                    OR p.city_region LIKE :keyword
                    OR p.district    LIKE :keyword
                    OR p.address     LIKE :keyword
                    OR p.property_code  LIKE :keyword
                    OR p.property_type  LIKE :keyword
                )";
            }
        }

        if (!empty($filters['transaction_type'])) {
            $where[] = 'p.transaction_type = :transaction_type';
            $params[':transaction_type'] = $filters['transaction_type'];
        }

        if (!empty($filters['city_region'])) {
            $city = trim($filters['city_region']);
            if ($city !== '') {
                $where[] = 'p.city_region LIKE :city_region';
                $params[':city_region'] = '%' . $city . '%';
            }
        }

        if (!empty($filters['property_type'])) {
            $where[] = 'p.property_type = :property_type';
            $params[':property_type'] = $filters['property_type'];
        }

        if (!empty($filters['district'])) {
            $district = trim($filters['district']);
            if ($district !== '') {
                $where[] = 'p.district LIKE :district';
                $params[':district'] = '%' . $district . '%';
            }
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

        // Debug logging for search filters (only when APP_DEBUG=true)
        try {
            $debug = ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?? 'false') === 'true';
            if ($debug) {
                $debugPayload = [
                    'filters'  => $filters,
                    'whereSql' => $whereSql,
                    'params'   => $params,
                    'page'     => $page,
                    'limit'    => $limit,
                ];
                error_log('[Property@getAllPaginated] DEBUG: ' . json_encode($debugPayload, JSON_UNESCAPED_UNICODE));
            }
        } catch (Throwable $e) {
            // If logging fails for any reason, don't break the API
            error_log('[Property@getAllPaginated] Failed to log debug info: ' . $e->getMessage());
        }

        $sqlCount = "SELECT COUNT(*) AS c FROM " . $this->table_name . " p WHERE $whereSql";
        $stmt = $this->conn->prepare($sqlCount);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();

        $sql = "SELECT p.id, p.property_code, p.title, p.description, p.price, p.currency, p.transaction_type, 
                       p.property_type, p.city_region, p.district, p.address, p.area, 
                       p.bedrooms, p.bathrooms, p.floors, p.floor_number, p.terraces, 
                       p.construction_type, p.condition_type, p.heating, p.exposure, 
                       p.year_built, p.furnishing_level, p.has_elevator, p.has_garage, 
                       p.has_southern_exposure, p.new_construction, p.featured, p.active, 
                       p.sort_order, p.created_at, p.updated_at
                FROM " . $this->table_name . " p 
                WHERE $whereSql
                ORDER BY 
                    CASE WHEN p.sort_order IS NULL THEN 1 ELSE 0 END, 
                    p.sort_order ASC, 
                    p.created_at DESC, 
                    p.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as &$item) {
            $this->normalizeBooleans($item);
            $item['images'] = $this->getPropertyImages($item['id']);
        }

        return ['items' => $items, 'total' => $total];
    }

    public function getStats() {
        $query = "SELECT 
                    COUNT(*) as total_properties,
                    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_properties,
                    SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured_properties,
                    AVG(price) as average_price
                  FROM " . $this->table_name;

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
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
        $query = "SELECT property_code FROM " . $this->table_name . " 
                  WHERE property_code IS NOT NULL AND property_code LIKE 'prop-%' 
                  ORDER BY property_code DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $nextNumber = 1;
        
        if ($result && !empty($result['property_code'])) {
            if (preg_match('/^prop-(\d+)$/', $result['property_code'], $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
        }
        
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
        
        $maxNumber = max($nextNumber - 1, 1);
        $paddingLength = max(3, strlen((string)$maxNumber));
        
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
     * Normalize boolean fields to true boolean type
     * Prevents "0" being rendered as text in frontend
     */
    private function normalizeBooleans(array &$property): void {
        $booleanFields = [
            'has_elevator',
            'has_garage',
            'has_southern_exposure',
            'new_construction',
            'featured',
            'active'
        ];
        
        foreach ($booleanFields as $field) {
            if (isset($property[$field])) {
                $property[$field] = (bool)((int)$property[$field]);
            }
        }
    }

    /**
     * Centralized method to fetch and process images for a property
     * MySQL-compatible - includes ImageHelper processing with ENHANCED error handling
     */
    private function getPropertyImages($propertyId) {
        try {
            error_log('[Property@getPropertyImages] Fetching images for property: ' . $propertyId);
            
            $query = "SELECT id, property_id, image_url, image_path, is_main, sort_order, alt_text, 
                             file_size, mime_type, thumbnail_url, created_at
                      FROM property_images 
                      WHERE property_id = :property_id
                      ORDER BY is_main DESC, sort_order ASC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':property_id', $propertyId);
            $stmt->execute();
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log('[Property@getPropertyImages] Found ' . count($images) . ' raw images in database for property: ' . $propertyId);
            
            if (empty($images)) {
                error_log('[Property@getPropertyImages] No images found in database for property: ' . $propertyId);
                return [];
            }
            
            // Filter out images with empty image_url BEFORE processing
            $validImages = [];
            foreach ($images as $img) {
                if (empty($img['image_url'])) {
                    error_log('[Property@getPropertyImages] SKIPPING image with empty URL - ID: ' . ($img['id'] ?? 'unknown') . ' for property: ' . $propertyId);
                    continue;
                }
                $validImages[] = $img;
            }
            
            if (empty($validImages)) {
                error_log('[Property@getPropertyImages] WARNING: No valid images (all had empty image_url) for property: ' . $propertyId);
                return [];
            }
            
            error_log('[Property@getPropertyImages] Filtered to ' . count($validImages) . ' valid images (non-empty URLs) for property: ' . $propertyId);
            
            // Normalize is_main to boolean
            foreach ($validImages as &$image) {
                $image['is_main'] = (bool)((int)$image['is_main']);
            }
            
            // Process with ImageHelper with error handling
            if (!file_exists(__DIR__ . '/../utils/ImageHelper.php')) {
                error_log('[Property@getPropertyImages] ERROR: ImageHelper.php not found!');
                return $validImages;
            }
            
            require_once __DIR__ . '/../utils/ImageHelper.php';
            
            try {
                $processedImages = ImageHelper::processImages($validImages);
                
                if (empty($processedImages)) {
                    error_log('[Property@getPropertyImages] WARNING: ImageHelper returned empty array for property: ' . $propertyId);
                    return $validImages;
                }
                
                error_log('[Property@getPropertyImages] SUCCESS: Processed ' . count($processedImages) . ' images for property: ' . $propertyId);
                return $processedImages;
                
            } catch (Exception $e) {
                error_log('[Property@getPropertyImages] ERROR: ImageHelper::processImages() failed for property ' . $propertyId . ': ' . $e->getMessage());
                error_log('[Property@getPropertyImages] Stack trace: ' . $e->getTraceAsString());
                return $validImages;
            }
            
        } catch (Exception $e) {
            error_log('[Property@getPropertyImages] CRITICAL ERROR: Database query failed for property ' . $propertyId . ': ' . $e->getMessage());
            error_log('[Property@getPropertyImages] Stack trace: ' . $e->getTraceAsString());
            return [];
        }
    }
}
?>
