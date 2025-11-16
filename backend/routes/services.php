<?php
require_once __DIR__ . '/../controllers/ServiceController.php';

try {
    $serviceController = new ServiceController();
    $method = $_SERVER['REQUEST_METHOD'];
    
    // --- Normalized path, consistent with index.php ---
    $path = $_SERVER['CONSULTINGG_API_PATH'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
    
    $pathParts = explode('/', trim($path, '/'));
    
    // Strip leading 'services' only if present
    if (isset($pathParts[0]) && $pathParts[0] === 'services') {
        array_shift($pathParts);
    }

    switch ($method) {
    case 'GET':
        if (empty($pathParts[0])) {
            $serviceController->getAll();
        } else {
            $serviceController->getById($pathParts[0]);
        }
        break;
        
    case 'POST':
        if (empty($pathParts[0])) {
            $serviceController->create();
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
        }
        break;
        
    case 'PUT':
        if (!empty($pathParts[0])) {
            $serviceController->update($pathParts[0]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Service ID is required']);
        }
        break;
        
    case 'DELETE':
        if (!empty($pathParts[0])) {
            $serviceController->delete($pathParts[0]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Service ID is required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
    }
} catch (Throwable $e) {
    error_log('[SERVICES] Fatal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>