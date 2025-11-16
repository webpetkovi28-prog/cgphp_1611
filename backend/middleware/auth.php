<?php
require_once __DIR__ . '/../utils/JWT.php';

class AuthMiddleware {
    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(['error' => 'No authorization header']);
            exit;
        }
        
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid authorization header format']);
            exit;
        }
        
        $jwt = $matches[1];
        $decoded = JWT::decode($jwt);
        
        if (!$decoded) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }
        
        return $decoded;
    }
    
    public static function requireAdmin() {
        $user = self::authenticate();
        
        if (!isset($user['role']) || $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Admin access required']);
            exit;
        }
        
        return $user;
    }
}
?>