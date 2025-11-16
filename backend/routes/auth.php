<?php
require_once __DIR__ . '/../controllers/AuthController.php';

try {
    $authController = new AuthController();
    $method = $_SERVER['REQUEST_METHOD'];

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    // Remove both /api and /backend/api prefixes
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);

    $pathParts = explode('/', trim($path, '/'));

    // Remove 'auth' from path parts
    if (isset($pathParts[0]) && $pathParts[0] === 'auth') {
        array_shift($pathParts);
    }

    $action = $pathParts[0] ?? '';

    switch ($method) {
        case 'POST':
            if (empty($action) || $action === 'login') {
                $authController->login();
            } elseif ($action === 'logout') {
                $authController->logout();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
            }
            break;
            
        case 'GET':
            if ($action === 'me') {
                $authController->me();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    error_log('[AUTH] Fatal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}
?>