<?php
require_once __DIR__ . '/../vendor/autoload.php';
Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();
header('Content-Type: application/json; charset=utf-8');

// Load CORS configuration
require_once __DIR__ . '/../config/cors.php';

// Ensure clean output buffer
if (ob_get_level()) {
    ob_end_clean();
}

// Additional headers
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');


// Disable error display, enable logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set WebContainer environment flag for demo mode
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'bolt.new') !== false) {
    $_ENV['WEBCONTAINER_ENV'] = 'true';
    $_ENV['DEMO_MODE'] = 'true';
}

// Disable error display in production, enable logging
if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Global error handler - always return JSON
set_error_handler(function($severity, $message, $file, $line) {
    if (ob_get_level()) ob_end_clean(); // Clear any previous output
    if (ob_get_level()) ob_end_clean(); // Clear any previous output
    error_log("PHP Error: $message in $file on line $line");
    
    // Don't throw for warnings in production
    if ($severity === E_WARNING || $severity === E_NOTICE) {
        return true;
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
    exit;
});

// Global exception handler - always return JSON
set_exception_handler(function($exception) {
    if (ob_get_level()) ob_end_clean(); // Clear any previous output
    if (ob_get_level()) ob_end_clean(); // Clear any previous output
    error_log("Uncaught exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
    exit;
});

try {
    // Check if composer dependencies are installed
    if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
        error_log("Warning: Composer dependencies not installed. Some features may not work properly.");
    }
    
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Log the incoming request for debugging
    error_log("API Request: " . $_SERVER['REQUEST_METHOD'] . " " . $path);
    
    // Remove both /api and /backend/api prefixes
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
    
    // Set normalized path for routes to reuse
    if (!isset($_SERVER['CONSULTINGG_API_PATH'])) {
        $_SERVER['CONSULTINGG_API_PATH'] = $path;
    }
    
    $pathParts = explode('/', trim($path, '/'));
    $route = $pathParts[0] ?? '';
    
    // Handle health route
    if ($route === 'health') {
        include __DIR__ . '/../routes/health.php';
        exit;
    }
    
    // Handle empty route - health check
    if (empty($route)) {
        echo json_encode([
            'success' => true,
            'ok' => true,
            'message' => 'ConsultingG Real Estate API - Production',
            'version' => '1.0',
            'domain' => 'consultingg.com',
            'timestamp' => date('c'),
            'endpoints' => [
                'auth' => '/api/auth/login',
                'properties' => '/api/properties',
                'services' => '/api/services',
                'pages' => '/api/pages',
                'sections' => '/api/sections',
                'images' => '/api/images'
            ]
        ]);
        exit;
    }
    
    switch ($route) {
        case 'auth':
            require_once __DIR__ . '/../routes/auth.php';
            break;
            
        case 'properties':
            require_once __DIR__ . '/../routes/properties.php';
            break;
            
        case 'images':
            require_once __DIR__ . '/../routes/images.php';
            break;
            
        case 'documents':
            require_once __DIR__ . '/../routes/documents.php';
            break;
            
        case 'services':
            require_once __DIR__ . '/../routes/services.php';
            break;
            
        case 'pages':
            require_once __DIR__ . '/../routes/pages.php';
            break;
            
        case 'sections':
            require_once __DIR__ . '/../routes/sections.php';
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'API endpoint not found',
                'available_endpoints' => ['auth', 'properties', 'images', 'documents', 'services', 'pages', 'sections']
            ]);
            exit;
    }
    
} catch (Throwable $e) {
    error_log("API Fatal Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    error_log("Request URI: " . $_SERVER['REQUEST_URI']);
    error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
    
    // Ensure we return valid JSON even on fatal error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'timestamp' => date('c')
    ]);
    exit;
}
?>