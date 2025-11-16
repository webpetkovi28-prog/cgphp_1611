<?php
require_once __DIR__ . '/../controllers/PageController.php';

try {
    $pageController = new PageController();
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Remove both /api and /backend/api prefixes
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
    
    $pathParts = explode('/', trim($path, '/'));

    // Remove 'pages' from path parts
    if (isset($pathParts[0]) && $pathParts[0] === 'pages') {
        array_shift($pathParts);
    }

    switch ($method) {
        case 'GET':
            if (empty($pathParts[0])) {
                $pageController->getAll();
            } elseif ($pathParts[0] === 'slug' && !empty($pathParts[1])) {
                $pageController->getBySlug($pathParts[1]);
            } else {
                $pageController->getById($pathParts[0]);
            }
            break;
            
        case 'POST':
            if (empty($pathParts[0])) {
                $pageController->create();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
            }
            break;
            
        case 'PUT':
            if (!empty($pathParts[0])) {
                $pageController->update($pathParts[0]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Page ID is required']);
            }
            break;
            
        case 'DELETE':
            if (!empty($pathParts[0])) {
                $pageController->delete($pathParts[0]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Page ID is required']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    error_log('[PAGES] Fatal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>