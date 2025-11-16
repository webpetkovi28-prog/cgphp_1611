<?php
require_once __DIR__ . '/../controllers/SectionController.php';

$sectionController = new SectionController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api' and 'sections' from path parts
array_shift($pathParts); // remove 'api'
array_shift($pathParts); // remove 'sections'

switch ($method) {
    case 'GET':
        if (empty($pathParts[0])) {
            $sectionController->getAll();
        } else {
            $sectionController->getById($pathParts[0]);
        }
        break;
        
    case 'POST':
        if (empty($pathParts[0])) {
            $sectionController->create();
        } elseif ($pathParts[0] === 'sort-order') {
            $sectionController->updateSortOrder();
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
        
    case 'PUT':
        if (!empty($pathParts[0])) {
            $sectionController->update($pathParts[0]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Section ID is required']);
        }
        break;
        
    case 'DELETE':
        if (!empty($pathParts[0])) {
            $sectionController->delete($pathParts[0]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Section ID is required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>