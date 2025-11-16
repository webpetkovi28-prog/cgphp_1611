<?php
require_once __DIR__ . '/../models/Page.php';

class PageController {
    private $pageModel;

    public function __construct() {
        $this->pageModel = new Page();
    }

    public function getAll() {
        try {
            $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';
            $pages = $this->pageModel->getAll($activeOnly);

            echo json_encode([
                'success' => true,
                'data' => $pages
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] GetAll error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function getBySlug($slug) {
        try {
            $page = $this->pageModel->getBySlug($slug);

            if (!$page) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Page not found']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'data' => $page
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] GetBySlug error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function getById($id) {
        try {
            $page = $this->pageModel->getById($id);

            if (!$page) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Page not found']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'data' => $page
            ]);
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] GetById error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function create() {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            AuthMiddleware::requireAdmin();

            $data = json_decode(file_get_contents("php://input"), true);

            $required = ['slug', 'title', 'content'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => "Field '$field' is required"]);
                    exit;
                }
            }

            $pageId = $this->pageModel->create($data);

            if ($pageId) {
                $page = $this->pageModel->getById($pageId);
                echo json_encode([
                    'success' => true,
                    'data' => $page
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create page']);
            }
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] Create error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function update($id) {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            AuthMiddleware::requireAdmin();

            $data = json_decode(file_get_contents("php://input"), true);

            if ($this->pageModel->update($id, $data)) {
                $page = $this->pageModel->getById($id);
                echo json_encode([
                    'success' => true,
                    'data' => $page
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update page']);
            }
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] Update error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }

    public function delete($id) {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            AuthMiddleware::requireAdmin();

            if ($this->pageModel->delete($id)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Page deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete page']);
            }
            exit;
        } catch (Throwable $e) {
            error_log('[PAGES] Delete error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error']);
            exit;
        }
    }
}
?>