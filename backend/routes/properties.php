<?php
require_once __DIR__ . '/../controllers/PropertyController.php';
header('Content-Type: application/json; charset=utf-8');

try {
  $propertyController = new PropertyController();
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

  $path = $_SERVER['CONSULTINGG_API_PATH'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
  $path = preg_replace('#^/(backend/)?api/?#', '/', $path);
  $pathParts = explode('/', trim($path, '/'));
  if (isset($pathParts[0]) && $pathParts[0] === 'properties') array_shift($pathParts);

  $jsonError = function (int $code, string $msg) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
  };

  switch ($method) {
    case 'GET':
      if (empty($pathParts[0])) {
        $propertyController->getAll();
      } elseif ($pathParts[0] === 'stats') {
        $propertyController->getStats();
      } else {
        $idOrSlug = trim((string)$pathParts[0]);
        if ($idOrSlug === '' || $idOrSlug === 'undefined' || $idOrSlug === 'null') {
          $jsonError(400, 'Missing or invalid property identifier');
        }
        $propertyController->getById($idOrSlug);
      }
      break;

    case 'POST':
      if (empty($pathParts[0])) $propertyController->create();
      else $jsonError(404, 'Endpoint not found');
      break;

    case 'PUT':
      if (!empty($pathParts[0])) {
        if (isset($pathParts[1]) && $pathParts[1] === 'images' && isset($pathParts[2])) {
          require_once __DIR__ . '/../controllers/ImageController.php';
          $imageController = new ImageController();
          if (isset($pathParts[3]) && $pathParts[3] === 'main') $imageController->setMainFromUrl($pathParts[0], $pathParts[2]);
          else $imageController->update($pathParts[2]);
        } else {
          $propertyController->update($pathParts[0]);
        }
      } else $jsonError(400, 'Property ID is required');
      break;

    case 'PATCH':
      $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
      $isJson = is_string($contentType) && (stripos($contentType, 'application/json') === 0);
      if (empty($pathParts[0])) {
        if ($isJson) $propertyController->updateOrder();
        else $jsonError(400, 'Invalid content type');
      } else {
        if (isset($pathParts[1]) && $pathParts[1] === 'images' && isset($pathParts[2]) && isset($pathParts[3]) && $pathParts[3] === 'main') {
          require_once __DIR__ . '/../controllers/ImageController.php';
          $imageController = new ImageController();
          $imageController->setMainFromUrl($pathParts[0], $pathParts[2]);
        } else $jsonError(400, 'Invalid PATCH endpoint');
      }
      break;

    case 'DELETE':
      if (!empty($pathParts[0]) && !isset($pathParts[1])) $propertyController->delete($pathParts[0]);
      elseif (!empty($pathParts[0]) && isset($pathParts[1]) && $pathParts[1] === 'images' && isset($pathParts[2])) {
        require_once __DIR__ . '/../controllers/ImageController.php';
        $imageController = new ImageController();
        $imageController->delete($pathParts[2]);
      } else $jsonError(400, 'Property ID is required');
      break;

    default:
      $jsonError(405, 'Method not allowed');
  }
} catch (Throwable $e) {
  error_log('[PROPERTIES] Fatal error: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Server error']);
}
