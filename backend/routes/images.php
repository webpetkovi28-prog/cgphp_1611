<?php
require_once __DIR__ . '/../controllers/ImageController.php';

try {
    $imageController = new ImageController();
    $method = $_SERVER['REQUEST_METHOD'];
    
    error_log("[IMAGES] Route loaded successfully");
    error_log("[IMAGES] Method: " . $method);
    
    // --- Normalized path, consistent with index.php ---
    $path = $_SERVER['CONSULTINGG_API_PATH'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
    
    $pathParts = explode('/', trim($path, '/'));
    
    // Strip leading 'images' only if present
    if (isset($pathParts[0]) && $pathParts[0] === 'images') {
        array_shift($pathParts);
    }
    
    // Enhanced logging for debugging
    error_log("[IMAGES] Original path: " . $path);
    error_log("[IMAGES] Path parts: " . implode(', ', $pathParts));
    error_log("[IMAGES] First path part: " . ($pathParts[0] ?? 'EMPTY'));
    
    if ($method === 'POST') {
        error_log("[IMAGES] POST data: " . print_r($_POST, true));
        error_log("[IMAGES] FILES data: " . print_r($_FILES, true));
    }
    
    // Now $pathParts[0] is expected to be 'upload' or an image id, etc.

    switch ($method) {
        case 'POST':
            error_log("[IMAGES] POST request detected");
            if (empty($pathParts[0]) || $pathParts[0] === 'upload') {
                error_log("[IMAGES] Calling upload method");
                $imageController->upload();
            } elseif ($pathParts[0] === 'set-main') {
                error_log("[IMAGES] Calling setMain method");
                $imageController->setMain();
            } else {
                error_log("[IMAGES] Unknown POST endpoint: " . ($pathParts[0] ?? 'EMPTY'));
                http_response_code(404);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Endpoint not found',
                    'requested_endpoint' => $pathParts[0] ?? 'EMPTY',
                    'available_endpoints' => ['upload', 'set-main']
                ]);
            }
            break;
            
        case 'PUT':
            if (!empty($pathParts[0])) {
                $imageController->update($pathParts[0]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Image ID is required']);
            }
            break;
            
        case 'DELETE':
            if (!empty($pathParts[0])) {
                $imageController->delete($pathParts[0]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Image ID is required']);
            }
            break;
            
        default:
            error_log("[IMAGES] Method not allowed: " . $method);
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    error_log('[IMAGES] Fatal error: ' . $e->getMessage());
    error_log('[IMAGES] Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>