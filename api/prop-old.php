<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $host = 'localhost';
    $dbname = 'yogahonc_consultingg788';
    $username = 'yogahonc_consultingg788';
    $password = 'PoloSport88*';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $keyword = $_GET['keyword'] ?? '';
    $transaction_type = $_GET['transaction_type'] ?? '';
    $property_type = $_GET['property_type'] ?? '';
    $city_region = $_GET['city_region'] ?? '';
    $district = $_GET['district'] ?? '';
    $min_price = $_GET['min_price'] ?? 0;
    $max_price = $_GET['max_price'] ?? 999999999;
    $featured = isset($_GET['featured']) ? (int)$_GET['featured'] : null;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 16;
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT 
                p.*,
                (SELECT pi.image_url 
                 FROM property_images pi 
                 WHERE pi.property_id = p.id 
                 AND pi.is_main = 1 
                 LIMIT 1) as main_image,
                (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.sort_order SEPARATOR '|||')
                 FROM property_images pi2
                 WHERE pi2.property_id = p.id) as all_images
            FROM properties p
            WHERE p.active = 1";
    
    $params = [];
    
    if (!empty($keyword)) {
        $sql .= " AND (
            LOWER(p.title) LIKE LOWER(:keyword1) OR
            LOWER(p.description) LIKE LOWER(:keyword2) OR
            LOWER(p.city_region) LIKE LOWER(:keyword3) OR
            LOWER(p.district) LIKE LOWER(:keyword4) OR
            LOWER(p.address) LIKE LOWER(:keyword5)
        )";
        $searchTerm = "%{$keyword}%";
        $params[':keyword1'] = $searchTerm;
        $params[':keyword2'] = $searchTerm;
        $params[':keyword3'] = $searchTerm;
        $params[':keyword4'] = $searchTerm;
        $params[':keyword5'] = $searchTerm;
    }
    
    if (!empty($transaction_type) && $transaction_type !== 'all') {
        $sql .= " AND p.transaction_type = :transaction_type";
        $params[':transaction_type'] = $transaction_type;
    }
    
    if (!empty($property_type) && $property_type !== 'all') {
        $sql .= " AND p.property_type = :property_type";
        $params[':property_type'] = $property_type;
    }
    
    if (!empty($city_region) && $city_region !== 'all') {
        $sql .= " AND LOWER(p.city_region) LIKE LOWER(:city_region)";
        $params[':city_region'] = "%{$city_region}%";
    }
    
    if (!empty($district)) {
        $sql .= " AND LOWER(p.district) LIKE LOWER(:district)";
        $params[':district'] = "%{$district}%";
    }
    
    if ($min_price > 0) {
        $sql .= " AND p.price >= :min_price";
        $params[':min_price'] = $min_price;
    }
    if ($max_price < 999999999) {
        $sql .= " AND p.price <= :max_price";
        $params[':max_price'] = $max_price;
    }
    
    if ($featured !== null) {
        $sql .= " AND p.featured = :featured";
        $params[':featured'] = $featured;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as count_query";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $sql .= " ORDER BY p.sort_order ASC, p.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $baseUrl = 'https://consultingg.com';
    $formattedProperties = array_map(function($property) use ($baseUrl) {
        $mainImage = $property['main_image'];
        if (empty($mainImage)) {
            $propId = $property['id'];
            $uploadsDir = __DIR__ . '/../uploads/properties/' . $propId;
            if (is_dir($uploadsDir)) {
                $images = glob($uploadsDir . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);
                if (!empty($images)) {
                    $mainImage = 'uploads/properties/' . $propId . '/' . basename($images[0]);
                }
            }
        }
        
        $gallery = [];
        if (!empty($property['all_images'])) {
            $gallery = explode('|||', $property['all_images']);
        } elseif (is_dir(__DIR__ . '/../uploads/properties/' . $property['id'])) {
            $images = glob(__DIR__ . '/../uploads/properties/' . $property['id'] . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);
            $gallery = array_map(function($img) use ($property) {
                return 'uploads/properties/' . $property['id'] . '/' . basename($img);
            }, $images);
        }
        
        $imageUrl = !empty($mainImage) ? $baseUrl . '/' . $mainImage : $baseUrl . '/images/placeholder-property.jpg';
        $thumbnailUrl = $imageUrl;
        $galleryUrls = array_map(function($img) use ($baseUrl) {
            return $baseUrl . '/' . $img;
        }, $gallery);
        
        return [
            'id' => $property['id'],
            'title' => $property['title'],
            'description' => $property['description'],
            'price' => (float)$property['price'],
            'currency' => $property['currency'],
            'transaction_type' => $property['transaction_type'],
            'property_type' => $property['property_type'],
            'city_region' => $property['city_region'],
            'district' => $property['district'],
            'address' => $property['address'],
            'area' => (float)$property['area'],
            'bedrooms' => (int)$property['bedrooms'],
            'bathrooms' => (int)$property['bathrooms'],
            'floors' => (int)$property['floors'],
            'floor_number' => (int)$property['floor_number'],
            'property_code' => $property['property_code'],
            'featured' => (bool)$property['featured'],
            'imageUrl' => $imageUrl,
            'thumbnail' => $thumbnailUrl,
            'images' => $galleryUrls,
            'gallery' => $galleryUrls,
            'created_at' => $property['created_at'],
            'updated_at' => $property['updated_at']
        ];
    }, $properties);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedProperties,
        'total' => $totalCount,
        'page' => $page,
        'limit' => $limit,
        'totalPages' => ceil($totalCount / $limit)
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
