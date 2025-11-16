<?php

class ImageProcessor {
    private static $allowedTypes = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/webp' => ['webp']
    ];

    private static $thumbnailSizes = [
        'small' => ['width' => 150, 'height' => 150],
        'medium' => ['width' => 300, 'height' => 300],
        'large' => ['width' => 600, 'height' => 600]
    ];

    /**
     * Validate uploaded image file
     */
    public static function validateImage($file, $maxSize = 10485760) {
        $errors = [];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File too large (exceeds upload_max_filesize)',
                UPLOAD_ERR_FORM_SIZE => 'File too large (exceeds MAX_FILE_SIZE)',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            $errors[] = $errorMessages[$file['error']] ?? 'Unknown upload error';
            return $errors;
        }

        // Validate file type
        if (!array_key_exists($file['type'], self::$allowedTypes)) {
            $errors[] = 'Invalid file type. Only JPEG, PNG and WebP are allowed';
        }

        // Validate file size
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size too large. Maximum ' . round($maxSize / 1024 / 1024) . 'MB allowed';
        }

        // Validate actual image content (security check)
        $imageInfo = @getimagesize($file['tmp_name']);
        if (!$imageInfo) {
            $errors[] = 'Invalid image file';
        }

        return $errors;
    }

    /**
     * Generate safe filename
     */
    public static function generateFilename($originalName, $propertyId) {
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $timestamp = time();
        $random = substr(md5(uniqid()), 0, 8);
        
        return "prop_{$propertyId}_{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Create thumbnail from image
     */
    public static function createThumbnail($sourcePath, $thumbnailPath, $size = 'medium') {
        if (!file_exists($sourcePath)) {
            throw new Exception('Source image not found');
        }

        $sizeConfig = self::$thumbnailSizes[$size] ?? self::$thumbnailSizes['medium'];
        $maxWidth = $sizeConfig['width'];
        $maxHeight = $sizeConfig['height'];

        // Get image info
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            throw new Exception('Invalid image file');
        }

        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];

        // Calculate new dimensions maintaining aspect ratio
        $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
        $newWidth = round($originalWidth * $ratio);
        $newHeight = round($originalHeight * $ratio);

        // Create source image resource
        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case 'image/webp':
                if (!function_exists('imagecreatefromwebp')) {
                    throw new Exception('WebP not supported by GD extension');
                }
                $sourceImage = imagecreatefromwebp($sourcePath);
                break;
            default:
                throw new Exception('Unsupported image type');
        }

        if (!$sourceImage) {
            throw new Exception('Failed to create image resource');
        }

        // Create thumbnail image
        $thumbnailImage = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG and WebP
        if ($mimeType === 'image/png' || $mimeType === 'image/webp') {
            imagealphablending($thumbnailImage, false);
            imagesavealpha($thumbnailImage, true);
            $transparent = imagecolorallocatealpha($thumbnailImage, 255, 255, 255, 127);
            imagefill($thumbnailImage, 0, 0, $transparent);
        }

        // Resize image
        imagecopyresampled(
            $thumbnailImage, $sourceImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );

        // Create thumbnail directory if it doesn't exist
        $thumbnailDir = dirname($thumbnailPath);
        if (!is_dir($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }

        // Save thumbnail
        $success = false;
        switch ($mimeType) {
            case 'image/jpeg':
                $success = imagejpeg($thumbnailImage, $thumbnailPath, 85);
                break;
            case 'image/png':
                $success = imagepng($thumbnailImage, $thumbnailPath, 8);
                break;
            case 'image/webp':
                if (!function_exists('imagewebp')) {
                    throw new Exception('WebP output not supported by GD extension');
                }
                $success = imagewebp($thumbnailImage, $thumbnailPath, 85);
                break;
        }

        // Clean up memory
        imagedestroy($sourceImage);
        imagedestroy($thumbnailImage);

        if (!$success) {
            throw new Exception('Failed to save thumbnail');
        }

        return [
            'width' => $newWidth,
            'height' => $newHeight,
            'size' => filesize($thumbnailPath)
        ];
    }

    /**
     * Delete image and its thumbnail
     */
    public static function deleteImageFiles($imagePath, $thumbnailPath = null) {
        $deleted = [];
        $errors = [];

        // Delete main image
        if ($imagePath && file_exists($imagePath)) {
            if (unlink($imagePath)) {
                $deleted[] = $imagePath;
            } else {
                $errors[] = "Failed to delete main image: {$imagePath}";
            }
        }

        // Delete thumbnail
        if ($thumbnailPath && file_exists($thumbnailPath)) {
            if (unlink($thumbnailPath)) {
                $deleted[] = $thumbnailPath;
            } else {
                $errors[] = "Failed to delete thumbnail: {$thumbnailPath}";
            }
        }

        return [
            'deleted' => $deleted,
            'errors' => $errors
        ];
    }

    /**
     * Get image dimensions
     */
    public static function getImageDimensions($imagePath) {
        if (!file_exists($imagePath)) {
            return null;
        }

        $imageInfo = getimagesize($imagePath);
        if (!$imageInfo) {
            return null;
        }

        return [
            'width' => $imageInfo[0],
            'height' => $imageInfo[1],
            'mime_type' => $imageInfo['mime']
        ];
    }

    /**
     * Optimize image quality and size
     */
    public static function optimizeImage($sourcePath, $outputPath, $quality = 85) {
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            return false;
        }

        $mimeType = $imageInfo['mime'];

        // Create source image
        switch ($mimeType) {
            case 'image/jpeg':
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case 'image/webp':
                $sourceImage = imagecreatefromwebp($sourcePath);
                break;
            default:
                return false;
        }

        if (!$sourceImage) {
            return false;
        }

        // Save optimized image
        $success = false;
        switch ($mimeType) {
            case 'image/jpeg':
                $success = imagejpeg($sourceImage, $outputPath, $quality);
                break;
            case 'image/png':
                // PNG compression level (0-9, where 9 is maximum compression)
                $pngQuality = round((100 - $quality) / 10);
                $success = imagepng($sourceImage, $outputPath, $pngQuality);
                break;
            case 'image/webp':
                $success = imagewebp($sourceImage, $outputPath, $quality);
                break;
        }

        imagedestroy($sourceImage);
        return $success;
    }
}
?>