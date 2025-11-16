<?php
require_once __DIR__ . '/../models/Section.php';

class SectionController {
    private $sectionModel;

    public function __construct() {
        $this->sectionModel = new Section();
    }

    public function getAll() {
        $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';
        $type = $_GET['type'] ?? null;
        
        $sections = $this->sectionModel->getAll($activeOnly, $type);

        echo json_encode([
            'success' => true,
            'data' => $sections
        ]);
    }

    public function getById($id) {
        $section = $this->sectionModel->getById($id);

        if (!$section) {
            http_response_code(404);
            echo json_encode(['error' => 'Section not found']);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $section
        ]);
    }

    public function create() {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::requireAdmin();

        $data = json_decode(file_get_contents("php://input"), true);

        $required = ['title', 'content', 'section_type'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }

        $sectionId = $this->sectionModel->create($data);

        if ($sectionId) {
            $section = $this->sectionModel->getById($sectionId);
            echo json_encode([
                'success' => true,
                'data' => $section
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create section']);
        }
    }

    public function update($id) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::requireAdmin();

        $data = json_decode(file_get_contents("php://input"), true);

        if ($this->sectionModel->update($id, $data)) {
            $section = $this->sectionModel->getById($id);
            echo json_encode([
                'success' => true,
                'data' => $section
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update section']);
        }
    }

    public function delete($id) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::requireAdmin();

        if ($this->sectionModel->delete($id)) {
            echo json_encode([
                'success' => true,
                'message' => 'Section deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete section']);
        }
    }

    public function updateSortOrder() {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::requireAdmin();

        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['sections']) || !is_array($data['sections'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Sections array is required']);
            return;
        }

        $success = true;
        foreach ($data['sections'] as $sectionData) {
            if (!$this->sectionModel->updateSortOrder($sectionData['id'], $sectionData['sort_order'])) {
                $success = false;
                break;
            }
        }

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Sort order updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update sort order']);
        }
    }
}
?>