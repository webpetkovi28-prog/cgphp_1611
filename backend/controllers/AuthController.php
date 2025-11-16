<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function login() {
        try {
            // Ensure we always output JSON
            if (ob_get_level()) ob_clean(); // Clear any previous output
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Log the login attempt
            error_log('[AUTH] Login attempt for: ' . ($data['email'] ?? 'unknown'));

            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Email and password are required'
                ]);
                exit;
            }

            $user = $this->userModel->getByEmail($data['email']);
            
            // Log user lookup result
            error_log('[AUTH] User found: ' . ($user ? 'YES' : 'NO'));

            if (!$user || !$this->userModel->verifyPassword($data['password'], $user['password_hash'])) {
                error_log('[AUTH] Login failed - invalid credentials');
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Невалиден имейл или парола'
                ]);
                exit;
            }

            error_log('[AUTH] Login successful for: ' . $user['email']);
            
            $payload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];

            $token = JWT::encode($payload);

            echo json_encode([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role']
                    ]
                ]
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[AUTH] Login error: ' . $e->getMessage());
            if (ob_get_level()) ob_clean(); // Clear any previous output
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function me() {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            $userData = AuthMiddleware::authenticate();

            $user = $this->userModel->getById($userData['user_id']);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'User not found']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[AUTH] Me error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function logout() {
        try {
            // For JWT, logout is handled client-side by removing the token
            echo json_encode([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[AUTH] Logout error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }
}
?>