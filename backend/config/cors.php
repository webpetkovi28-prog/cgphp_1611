<?php
// CORS Configuration for Development and Production

// Determine allowed origins based on environment
$allowedOrigins = [
    'http://localhost:5000',
    'https://localhost:5000',
    'http://localhost:5173',
    'https://localhost:5173', 
    'https://consultingg.com',
    'https://www.consultingg.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback for development and Replit
    if (strpos($origin, 'localhost') !== false || 
        strpos($origin, '127.0.0.1') !== false ||
        strpos($origin, '.replit.dev') !== false ||
        strpos($origin, 'replit.com') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header('Access-Control-Allow-Origin: https://consultingg.com');
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}
?>