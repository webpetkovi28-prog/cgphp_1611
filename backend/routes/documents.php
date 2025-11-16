<?php
require_once __DIR__ . '/../models/Document.php';
require_once __DIR__ . '/../middleware/auth.php';

$documentModel = new Document();

// Get normalized path consistent with index.php
$path = $_SERVER['CONSULTINGG_API_PATH'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/(backend/)?api/?#', '/', $path);
$method = $_SERVER['REQUEST_METHOD'];

// Parse path components
$pathParts = explode('/', trim($path, '/'));

// Strip leading 'documents' only if present
if (isset($pathParts[0]) && $pathParts[0] === 'documents') {
    array_shift($pathParts);
}

$action = $pathParts[0] ?? '';

try {
    switch ($method) {
        case 'POST':
            if ($action === 'upload') {
                AuthMiddleware::requireAdmin();
                handleDocumentUpload();
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
            }
            break;

        case 'GET':
            if ($action === 'serve' && isset($pathParts[1])) {
                // Serve document file via /api/documents/serve/{id}
                serveDocument($pathParts[1]);
            } elseif ($action && ctype_alnum(str_replace('-', '', $action))) {
                // Serve document file via /api/documents/{id}
                serveDocument($action);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
            }
            break;

        case 'DELETE':
            if ($action && ctype_alnum(str_replace('-', '', $action))) {
                AuthMiddleware::requireAdmin();
                deleteDocument($action);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid document ID']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Throwable $e) {
    error_log('[DocumentsRoute] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

function handleDocumentUpload() {
    global $documentModel;
    
    if (!isset($_FILES['document']) || !isset($_POST['property_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing document file or property ID']);
        return;
    }

    $file = $_FILES['document'];
    $propertyId = $_POST['property_id'];
    
    // Get property to retrieve property_code
    require_once __DIR__ . '/../models/Property.php';
    $propertyModel = new Property();
    $property = $propertyModel->getById($propertyId);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Property not found']);
        return;
    }
    
    $propertyCode = $property['property_code'] ?? $propertyId; // Fallback to ID if no code

    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File upload error']);
        return;
    }

    // Validate file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if ($mimeType !== 'application/pdf') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Only PDF files are allowed']);
        return;
    }

    // Validate file size (max 10MB)
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File size exceeds 10MB limit']);
        return;
    }

    // Create upload directory using property_code
    $uploadDir = __DIR__ . '/../../uploads/properties/' . $propertyCode . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = 'pdf';
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save file']);
        return;
    }

    // Save to database
    $documentData = [
        'property_id' => $propertyId,
        'filename' => $filename,
        'original_filename' => $file['name'],
        'file_path' => $filePath,
        'file_size' => $file['size'],
        'mime_type' => $mimeType
    ];

    $documentId = $documentModel->create($documentData);

    if ($documentId) {
        // Get document details to return
        $document = $documentModel->getById($documentId);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $document['id'],
                'filename' => $document['original_filename'],
                'size' => $document['file_size'],
                'url' => '/api/documents/serve/' . $document['id']
            ]
        ]);
    } else {
        // Clean up file if database save failed
        unlink($filePath);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save document metadata']);
    }
}

function serveDocument($documentId) {
    global $documentModel;
    
    $document = $documentModel->getById($documentId);
    
    if (!$document || !file_exists($document['file_path'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Document not found']);
        return;
    }

    // Set security headers for PDF serving
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . addslashes($document['original_filename']) . '"');
    header('Content-Length: ' . $document['file_size']);
    header('Cache-Control: private, no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Serve file
    readfile($document['file_path']);
    exit;
}

function deleteDocument($documentId) {
    global $documentModel;
    
    $document = $documentModel->getById($documentId);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Document not found']);
        return;
    }

    // Delete file from filesystem
    if (file_exists($document['file_path'])) {
        unlink($document['file_path']);
    }

    // Delete from database
    if ($documentModel->delete($documentId)) {
        echo json_encode(['success' => true, 'message' => 'Document deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete document']);
    }
}
?>