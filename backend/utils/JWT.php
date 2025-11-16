<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;

class JWT {
    private static function getSecretKey() {
        return $_ENV['JWT_SECRET'] ?? 'your-secret-key-consultingg-2024-change-in-production';
    }
    
    private static $algorithm = 'HS256';
    
    public static function encode($payload) {
        // Ensure token has expiry if not set
        if (!isset($payload['exp'])) {
            $payload['exp'] = time() + (24 * 60 * 60); // 24 hours default
        }
        if (!isset($payload['iat'])) {
            $payload['iat'] = time();
        }
        
        return FirebaseJWT::encode($payload, self::getSecretKey(), self::$algorithm);
    }
    
    public static function decode($jwt) {
        try {
            $decoded = FirebaseJWT::decode($jwt, new Key(self::getSecretKey(), self::$algorithm));
            return (array) $decoded;
        } catch (Exception $e) {
            error_log('[JWT] Decode error: ' . $e->getMessage());
            return false;
        }
    }
}
?>