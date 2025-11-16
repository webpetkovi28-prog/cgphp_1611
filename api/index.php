<?php
// ВРЕМЕННИ НАСТРОЙКИ ЗА ДЕБЪГВАНЕ: ПОКАЗВАНЕ НА ВСИЧКИ ГРЕШКИ В БРАУЗЪРА
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

error_log("API index.php hit! Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A'));

// Load CORS configuration first
require_once __DIR__ . '/../backend/config/cors.php';

// Ensure clean output buffer
if (ob_get_level()) {
    ob_end_clean();
}

// === Unified JSON/CORS headers (single block) ===
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Disable error display, enable logging
// Тези редове са дублирани от горните временни настройки, но ги оставяме за пълнота.
// Временните настройки ще имат предимство.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
} else {
    // Fallback environment variables for production  
    $_ENV['DB_HOST'] = 'localhost';
    $_ENV['DB_NAME'] = 'yogahonc_consultingg55';
    $_ENV['DB_USER'] = 'yogahonc_consultingg55';
    $_ENV['DB_PASS'] = 'PoloSport88*';
    $_ENV['JWT_SECRET'] = 'consultingg-production-jwt-secret-key-2024';
    $_ENV['JWT_AUD'] = 'consultingg.com';
    $_ENV['APP_ENV'] = 'production';
    $_ENV['APP_DEBUG'] = 'true';
}

// Set WebContainer environment flag for demo mode
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'bolt.new') !== false) {
    $_ENV['WEBCONTAINER_ENV'] = 'true';
    $_ENV['DEMO_MODE'] = 'true';
}

// Disable error display in production, enable logging
// Отново, временните настройки отгоре ще имат предимство.
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
    if (!file_exists(__DIR__ . '/backend/vendor/autoload.php')) {
        error_log("Warning: Composer dependencies not installed. Some features may not work properly.");
    }
    
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Log the incoming request for debugging
    error_log("API Request: " . $_SERVER['REQUEST_METHOD'] . " " . $path);
    error_log("DEBUG: Original REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A'));
    error_log("DEBUG: SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'N/A'));
    error_log("DEBUG: PHP_SELF: " . ($_SERVER['PHP_SELF'] ?? 'N/A'));
    error_log("DEBUG: Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'N/A'));
    error_log("DEBUG: POST data: " . print_r($_POST, true));
    error_log("DEBUG: FILES data: " . print_r($_FILES, true));
    
    // Remove both /api and /backend/api prefixes
    $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
    error_log("DEBUG: Path after preg_replace: " . $path);
    
    // Set normalized path for routes to reuse
    if (!isset($_SERVER['CONSULTINGG_API_PATH'])) {
        $_SERVER['CONSULTINGG_API_PATH'] = $path;
    }
    
    $pathParts = explode('/', trim($path, '/'));
    error_log("DEBUG: Path parts: " . implode(', ', $pathParts));
    $route = $pathParts[0] ?? '';
    error_log("DEBUG: Determined route: " . $route);
    
    // Handle empty route - health check
    if (empty($route) || $route === 'health') {
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
                'images' => '/api/images',
                'documents' => '/api/documents'
            ]
        ]);
        exit;
    }
    
    switch ($route) {
        case 'auth':
            error_log("DEBUG: Loading auth route");
            require_once __DIR__ . '/../backend/routes/auth.php';
            break;
            
        case 'properties':
            error_log("DEBUG: Loading properties route");
            require_once __DIR__ . '/../backend/routes/properties.php';
            break;
            
        case 'images':
            error_log("DEBUG: Loading images route");
            require_once __DIR__ . '/../backend/routes/images.php';
            break;
            
        case 'services':
            error_log("DEBUG: Loading services route");
            require_once __DIR__ . '/../backend/routes/services.php';
            break;
            
        case 'pages':
            error_log("DEBUG: Loading pages route");
            require_once __DIR__ . '/../backend/routes/pages.php';
            break;
            
        case 'sections':
            error_log("DEBUG: Loading sections route");
            require_once __DIR__ . '/../backend/routes/sections.php';
            break;
            
        case 'documents':
            error_log("DEBUG: Loading documents route");
            require_once __DIR__ . '/../backend/routes/documents.php';
            break;
            
        default:
            error_log("DEBUG: Unknown route: " . $route . " (available: auth, properties, images, services, pages, sections, documents)");
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'API endpoint not found',
                'available_endpoints' => ['auth', 'properties', 'images', 'services', 'pages', 'sections', 'documents'],
                'requested_route' => $route,
                'path_parts' => $pathParts
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