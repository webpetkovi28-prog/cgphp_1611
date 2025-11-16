<?php
require_once __DIR__ . '/../models/PropertyImage.php';
require_once __DIR__ . '/../models/Property.php';
require_once __DIR__ . '/../utils/ImageProcessor.php';
require_once __DIR__ . '/../utils/ErrorLogger.php';

class ImageController {
    private $imageModel;
    private $propertyModel;
    
    // Configurable upload paths
    private $uploadsFS;
    private $uploadsPublic;

    public function __construct() {
        $this->imageModel = new PropertyImage();
        $this->propertyModel = new Property();
        
        // FS base for uploaded files (absolute)
        $this->uploadsFS = $_ENV['UPLOADS_FS_BASE'] ?? realpath(__DIR__ . '/../../uploads') ?: __DIR__ . '/../../uploads';
        
        // Public URL base (what the browser should use)
        $this->uploadsPublic = $_ENV['UPLOADS_PUBLIC_BASE'] ?? '/uploads';
    }

    public function upload() {
        try {
            // Set strict JSON content type headers
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            error_log('[ImageController] Upload started');
            error_log('[ImageController] Request method: ' . $_SERVER['REQUEST_METHOD']);
            error_log('[ImageController] Request URI: ' . $_SERVER['REQUEST_URI']);
            error_log('[ImageController] Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
            
            // Check if we have multipart/form-data
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'multipart/form-data') === false) {
                error_log('[ImageController] Invalid content type for file upload: ' . $contentType);
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Invalid content type. Expected multipart/form-data for file upload.',
                    'received_content_type' => $contentType
                ]);
                exit;
            }
            
            error_log('[ImageController] FILES: ' . print_r($_FILES, true));
            error_log('[ImageController] POST: ' . print_r($_POST, true));

            if (!isset($_FILES['image']) || !isset($_POST['property_id'])) {
                error_log('[ImageController] Missing required fields');
                error_log('[ImageController] Available FILES keys: ' . implode(', ', array_keys($_FILES)));
                error_log('[ImageController] Available POST keys: ' . implode(', ', array_keys($_POST)));
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Image file and property_id are required',
                    'debug' => [
                        'files_received' => array_keys($_FILES),
                        'post_received' => array_keys($_POST),
                        'expected' => ['image' => 'file', 'property_id' => 'string']
                    ]
                ]);
                exit;
            }

            $file = $_FILES['image'];
            $propertyId = trim($_POST['property_id']);
            $sortOrder = $_POST['sort_order'] ?? 0;
            $isMain = isset($_POST['is_main']) ? (bool)$_POST['is_main'] : false;
            
            // Step 1: Validate property_id exists
            if (empty($propertyId)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Property ID is required and cannot be empty']);
                exit;
            }
            
            $property = $this->propertyModel->getById($propertyId);
            if (!$property) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Property not found. Please verify the property ID exists.']);
                exit;
            }
            $altText = $_POST['alt_text'] ?? '';

            // Step 2: Enhanced file validation with specific HTTP status codes
            $validationErrors = ImageProcessor::validateImage($file, 10485760); // 10MB max
            if (!empty($validationErrors)) {
                error_log('[ImageController] Validation errors: ' . implode(', ', $validationErrors));
                
                // Map specific validation errors to appropriate HTTP status codes
                $errorMessage = implode(', ', $validationErrors);
                if (strpos($errorMessage, 'too large') !== false) {
                    http_response_code(413); // Payload Too Large
                } elseif (strpos($errorMessage, 'Invalid file type') !== false) {
                    http_response_code(415); // Unsupported Media Type
                } else {
                    http_response_code(400); // Bad Request
                }
                
                echo json_encode(['success' => false, 'error' => $errorMessage]);
                exit;
            }

            // Check existing images for this property
            $existingImages = $this->imageModel->getByPropertyId($propertyId);
            
            // If this is the first image for the property, automatically make it the main image
            if (count($existingImages) == 0) {
                $isMain = true;
                error_log('[ImageController] First image for property - automatically setting as main');
            }

            // If this is set as main image, unset all other main images for this property first
            if ($isMain) {
                $this->imageModel->unsetMainImages($propertyId);
            }

            // Check if property already has 50 images
            if (count($existingImages) >= 50) {
                error_log('[ImageController] Too many images for property');
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Maximum 50 images per property allowed']);
                exit;
            }

            // Step 3: Get property details to use property_code for folder naming
            $property = $this->propertyModel->getById($propertyId);
            $folderName = !empty($property['property_code']) ? $property['property_code'] : $propertyId;
            
            $propertyDirFS = rtrim($this->uploadsFS, '/\\') . "/properties/$folderName";
            $propertyUrlBase = rtrim($this->uploadsPublic, '/\\') . "/properties/$folderName";
            
            // Check parent directory exists and is writable first
            $parentDir = dirname($propertyDirFS);
            if (!is_dir($parentDir) || !is_writable($parentDir)) {
                error_log('[ImageController] Parent directory not accessible: ' . $parentDir);
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Upload directory not accessible']);
                exit;
            }
            
            if (!is_dir($propertyDirFS)) {
                if (!mkdir($propertyDirFS, 0755, true)) {
                    $lastError = error_get_last();
                    error_log('[ImageController] Failed to create directory: ' . $propertyDirFS);
                    error_log('[ImageController] Last error: ' . ($lastError['message'] ?? 'Unknown'));
                    error_log('[ImageController] Parent writable: ' . (is_writable($parentDir) ? 'YES' : 'NO'));
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
                    exit;
                }
                error_log('[ImageController] Created directory: ' . $propertyDirFS);
            }
            
            // Final writability check
            if (!is_writable($propertyDirFS)) {
                error_log('[ImageController] Directory not writable: ' . $propertyDirFS);
                error_log('[ImageController] Directory permissions: ' . substr(sprintf('%o', fileperms($propertyDirFS)), -4));
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Upload directory not writable']);
                exit;
            }

            require_once __DIR__ . '/../utils/ImageHelper.php';
            $filename = ImageHelper::preserveOriginalFilename($file['name']);
            
            // Handle duplicate filenames by appending a number
            $originalFilename = $filename;
            $counter = 1;
            while (file_exists($propertyDirFS . '/' . $filename)) {
                $pathInfo = pathinfo($originalFilename);
                $basename = $pathInfo['filename'];
                $extension = $pathInfo['extension'];
                $filename = $basename . '_' . $counter . '.' . $extension;
                $counter++;
            }
            
            $filePath = $propertyDirFS . '/' . $filename;
            $thumbnailFilename = pathinfo($filename, PATHINFO_FILENAME) . '_thumb.' . pathinfo($filename, PATHINFO_EXTENSION);
            $thumbnailPath = $propertyDirFS . '/' . $thumbnailFilename;
            
            // Step 4: Atomic operations - Track files created for potential rollback
            $createdFiles = [];

            error_log('[ImageController] Attempting to move file to: ' . $filePath);
            
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                error_log('[ImageController] File moved successfully');
                $createdFiles[] = $filePath; // Track for rollback
                
                // Verify file was actually created
                if (!file_exists($filePath)) {
                    error_log('[ImageController] File does not exist after move');
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'File upload verification failed. File not found after move.']);
                    exit;
                }
                
                // Optimize main image
                $tempOptimizedPath = $filePath . '.tmp';
                if (ImageProcessor::optimizeImage($filePath, $tempOptimizedPath, 90)) {
                    rename($tempOptimizedPath, $filePath);
                    error_log('[ImageController] Image optimized successfully');
                }

                // Create thumbnail
                try {
                    $thumbnailInfo = ImageProcessor::createThumbnail($filePath, $thumbnailPath, 'medium');
                    if (file_exists($thumbnailPath)) {
                        $createdFiles[] = $thumbnailPath; // Track thumbnail for rollback
                        error_log('[ImageController] Thumbnail created: ' . json_encode($thumbnailInfo));
                    }
                } catch (Exception $e) {
                    error_log('[ImageController] Thumbnail creation failed: ' . $e->getMessage());
                    // Continue without thumbnail - not critical
                }

                // Get image dimensions and file info
                $imageInfo = ImageProcessor::getImageDimensions($filePath);
                $fileSize = filesize($filePath);

                // Create image record
                $imageData = [
                    'property_id' => $propertyId,
                    'image_url' => $propertyUrlBase . '/' . $filename,
                    'image_path' => $propertyUrlBase . '/' . $filename,
                    'thumbnail_url' => file_exists($thumbnailPath) ? $propertyUrlBase . '/' . $thumbnailFilename : null,
                    'alt_text' => $altText,
                    'sort_order' => $sortOrder,
                    'is_main' => $isMain,
                    'file_size' => $fileSize,
                    'mime_type' => $imageInfo ? $imageInfo['mime_type'] : $file['type']
                ];

                $imageId = $this->imageModel->create($imageData);
                error_log('[ImageController] Image record created with ID: ' . $imageId);

                if ($imageId) {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'id' => $imageId, // Return the new image ID
                            'url' => $propertyUrlBase . '/' . $filename, // Return the correct URL
                            'thumbnail_url' => $imageData['thumbnail_url'],
                            'path' => $propertyUrlBase . '/' . $filename,
                            'property_id' => $propertyId,
                            'is_main' => $isMain,
                            'sort_order' => $sortOrder,
                            'file_size' => $fileSize,
                            'mime_type' => $imageData['mime_type']
                        ]
                    ]);
                } else {
                    // Atomic rollback: Delete all uploaded files if database insert failed
                    foreach ($createdFiles as $fileToDelete) {
                        if (file_exists($fileToDelete)) {
                            unlink($fileToDelete);
                            error_log('[ImageController] Rolled back file: ' . $fileToDelete);
                        }
                    }
                    
                    // Log structured error for debugging
                    $errorId = ErrorLogger::logValidationError(
                        'ImageController::upload - DB Insert Failed',
                        'Database insert failed for image record, files rolled back',
                        [
                            'property_id' => $propertyId,
                            'filename' => $filename,
                            'file_size' => $fileSize,
                            'rolled_back_files' => $createdFiles,
                            'image_data' => $imageData
                        ]
                    );
                    
                    error_log('[ImageController] Database insert failed, all files rolled back [' . $errorId . ']');
                    http_response_code(500);
                    echo json_encode(['success' => false, 'error' => 'Failed to save image record']);
                }
            } else {
                $lastError = error_get_last();
                error_log('[ImageController] Failed to move uploaded file');
                error_log('[ImageController] Upload error code: ' . $file['error']);
                error_log('[ImageController] Last error: ' . ($lastError['message'] ?? 'Unknown'));
                error_log('[ImageController] Temp file exists: ' . (file_exists($file['tmp_name']) ? 'YES' : 'NO'));
                error_log('[ImageController] Target directory writable: ' . (is_writable($propertyDirFS) ? 'YES' : 'NO'));
                error_log('[ImageController] Target path: ' . $filePath);
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
            }
        } catch (Throwable $e) {
            // Log structured error with full details 
            $errorId = ErrorLogger::logError(
                'ImageController::upload - Server Error',
                $e,
                [
                    'property_id' => $_POST['property_id'] ?? 'not_set',
                    'file_name' => $_FILES['image']['name'] ?? 'not_set',
                    'file_size' => $_FILES['image']['size'] ?? 0,
                    'file_error' => $_FILES['image']['error'] ?? 'unknown',
                    'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
                    'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
                ]
            );
            
            error_log('[ImageController] Upload error: ' . $e->getMessage() . ' [' . $errorId . ']');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error during upload']);
        }
        exit;
    }

    public function delete($id) {
        try {
            // Set strict JSON content type header
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            error_log('[ImageController] Delete image ID: ' . $id);

            // Step 1: Validate image ID format and existence
            if (empty($id) || !is_string($id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid image ID format']);
                exit;
            }

            // Get image info before deleting
            $image = $this->imageModel->getById($id);
            if (!$image) {
                error_log('[ImageController] Image not found: ' . $id);
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Image not found']);
                exit;
            }

            // Step 2: Validate property ownership (additional security check)
            $property = $this->propertyModel->getById($image['property_id']);
            if (!$property) {
                error_log('[ImageController] Property not found for image: ' . $image['property_id']);
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Associated property not found']);
                exit;
            }

            // Step 3: Atomic delete operation - database first, then files
            error_log('[ImageController] Starting atomic delete for image: ' . $id);
            
            // First, delete from database
            if (!$this->imageModel->delete($id)) {
                error_log('[ImageController] Database deletion failed for image: ' . $id);
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete image record']);
                exit;
            }
            
            // Database deletion successful, now delete physical files
            require_once __DIR__ . '/../utils/ImageProcessor.php';
            $deletedFiles = [];
            $failedFiles = [];
            
            // Use consistent path mapping (same as upload uses)
            $mainImagePath = $image['image_path'] ? $this->uploadsFS . str_replace($this->uploadsPublic, '', $image['image_path']) : null;
            $thumbnailPath = $image['thumbnail_url'] ? $this->uploadsFS . str_replace($this->uploadsPublic, '', $image['thumbnail_url']) : null;
            
            if ($mainImagePath && file_exists($mainImagePath)) {
                if (unlink($mainImagePath)) {
                    $deletedFiles[] = $mainImagePath;
                    error_log('[ImageController] Deleted main image file: ' . $mainImagePath);
                } else {
                    $failedFiles[] = $mainImagePath;
                    error_log('[ImageController] Failed to delete main image file: ' . $mainImagePath);
                }
            }
            
            if ($thumbnailPath && file_exists($thumbnailPath)) {
                if (unlink($thumbnailPath)) {
                    $deletedFiles[] = $thumbnailPath;
                    error_log('[ImageController] Deleted thumbnail file: ' . $thumbnailPath);
                } else {
                    $failedFiles[] = $thumbnailPath;
                    error_log('[ImageController] Failed to delete thumbnail file: ' . $thumbnailPath);
                }
            }
            
            // Log any file deletion failures but don't fail the operation
            // since database record is already deleted
            if (!empty($failedFiles)) {
                $errorId = ErrorLogger::logValidationError(
                    'ImageController::delete - File Cleanup Failed',
                    'Some files could not be deleted after database record removal',
                    [
                        'image_id' => $id,
                        'deleted_files' => $deletedFiles,
                        'failed_files' => $failedFiles,
                        'image_data' => $image
                    ]
                );
                error_log('[ImageController] File cleanup warnings logged [' . $errorId . ']');
            }
            
            error_log('[ImageController] Image deleted successfully - DB record and ' . count($deletedFiles) . ' files');
            echo json_encode([
                'success' => true,
                'message' => 'Image deleted successfully',
                'data' => [
                    'deleted_files' => count($deletedFiles),
                    'failed_files' => count($failedFiles)
                ]
            ]);
        } catch (Throwable $e) {
            // Log structured error for delete operation
            $errorId = ErrorLogger::logError(
                'ImageController::delete - Server Error',
                $e,
                [
                    'image_id' => $id ?? 'not_set',
                    'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
                    'request_method' => $_SERVER['REQUEST_METHOD'] ?? ''
                ]
            );
            
            error_log('[ImageController] Delete error: ' . $e->getMessage() . ' [' . $errorId . ']');
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error during delete']);
        }
        exit;
    }

    public function setMain() {
        try {
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            $data = json_decode(file_get_contents("php://input"), true);
            error_log('[ImageController] Set main image data: ' . print_r($data, true));

            if (!isset($data['property_id']) || !isset($data['image_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'property_id and image_id are required']);
                exit;
            }

            if ($this->imageModel->setMainImage($data['property_id'], $data['image_id'])) {
                error_log('[ImageController] Main image set successfully');
                echo json_encode([
                    'success' => true,
                    'message' => 'Main image updated successfully'
                ]);
            } else {
                error_log('[ImageController] Failed to set main image');
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update main image']);
            }
        } catch (Throwable $e) {
            error_log('[ImageController] Set main error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error during set main']);
        }
        exit;
    }

    public function setMainFromUrl($propertyId, $imageId) {
        try {
            // Set strict JSON content type header
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            
            require_once __DIR__ . '/../middleware/auth.php';
            // Skip auth for demo mode
            if (!isset($_ENV['WEBCONTAINER_ENV']) && !isset($_ENV['DEMO_MODE'])) {
                AuthMiddleware::requireAdmin();
            }

            error_log('[ImageController] Set main image from URL params - Property: ' . $propertyId . ', Image: ' . $imageId);

            // Validate parameters
            if (empty($propertyId) || empty($imageId)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Property ID and Image ID are required']);
                exit;
            }

            // Validate that the image exists and belongs to the property
            $image = $this->imageModel->getById($imageId);
            if (!$image) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Image not found']);
                exit;
            }

            if ($image['property_id'] !== $propertyId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Image does not belong to the specified property']);
                exit;
            }

            // Set the main image atomically
            if ($this->imageModel->setMainImage($propertyId, $imageId)) {
                error_log('[ImageController] Main image set successfully via URL');
                
                // Get updated property images to return
                $updatedImages = $this->imageModel->getByPropertyId($propertyId);
                
                echo json_encode([
                    'success' => true,
                    'imageId' => $imageId,
                    'is_main' => true,
                    'message' => 'Main image updated successfully',
                    'images' => $updatedImages
                ]);
            } else {
                error_log('[ImageController] Failed to set main image via URL');
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update main image']);
            }
        } catch (Throwable $e) {
            error_log('[ImageController] Set main from URL error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error during set main']);
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
            error_log('[ImageController] Update image data: ' . print_r($data, true));

            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No data provided']);
                exit;
            }

            // Get current image data
            $currentImage = $this->imageModel->getById($id);
            if (!$currentImage) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Image not found']);
                exit;
            }

            // Merge with existing data
            $updateData = array_merge($currentImage, $data);

            if ($this->imageModel->update($id, $updateData)) {
                error_log('[ImageController] Image updated successfully');
                echo json_encode([
                    'success' => true,
                    'message' => 'Image updated successfully'
                ]);
            } else {
                error_log('[ImageController] Failed to update image');
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update image']);
            }
        } catch (Throwable $e) {
            error_log('[ImageController] Update error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Server error during update']);
        }
        exit;
    }
}
?>