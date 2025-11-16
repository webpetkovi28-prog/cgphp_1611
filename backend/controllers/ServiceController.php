<?php
require_once __DIR__ . '/../models/Service.php';

class ServiceController {
    private $serviceModel;

    public function __construct() {
        $this->serviceModel = new Service();
    }

    public function getAll() {
        try {
            $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';
            $services = $this->serviceModel->getAll($activeOnly);

            echo json_encode([
                'success' => true,
                'data' => $services
            ]);
        } catch (Throwable $e) {
            error_log('[SERVICES] GetAll error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
        }
        exit;
    }

    public function getById($id) {
        try {
            $service = $this->serviceModel->getById($id);

            if (!$service) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Service not found']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'data' => $service
            ]);
        } catch (Throwable $e) {
            error_log('[SERVICES] GetById error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
        }
        exit;
    }

    public function create() {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            $data = json_decode(file_get_contents("php://input"), true);

            $required = ['title', 'description', 'icon', 'color'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
                    exit;
                }
            }

            $result = $this->serviceModel->create($data);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'data' => $result
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create service']);
            }
        } catch (Throwable $e) {
            error_log('[SERVICES] Create error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
        }
        exit;
    }

    public function update($id) {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            $data = json_decode(file_get_contents("php://input"), true);

            $result = $this->serviceModel->update($id, $data);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'data' => $result
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update service']);
            }
        } catch (Throwable $e) {
            error_log('[SERVICES] Update error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
        }
        exit;
    }

    public function delete($id) {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            if ($this->serviceModel->delete($id)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Service deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete service']);
            }
        } catch (Throwable $e) {
            error_log('[SERVICES] Delete error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
        }
        exit;
    }
}
?>