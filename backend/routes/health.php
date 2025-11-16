<?php
// Health check endpoint for deployment verification
// Headers are already set by index.php

try {
    // Check database connection
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Verify database connection with SELECT NOW()
    $stmt = $pdo->query('SELECT NOW() as db_time');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $response = [
        'success' => true,
        'status' => 'ok',
        'database' => 'connected',
        'db_time' => $result['db_time'],
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
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("[HEALTH] Database connection failed: " . $e->getMessage());
    $response = [
        'success' => false,
        'status' => 'error',
        'database' => 'disconnected',
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ];
    
    http_response_code(500);
    echo json_encode($response);
}