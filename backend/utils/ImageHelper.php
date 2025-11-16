<?php

class ImageHelper {
    /**
     * Generate safe filename for uploads
     */
    public static function safeFilename($originalName, $propertyId = null) {
        $pathInfo = pathinfo($originalName);
        $extension = strtolower($pathInfo['extension'] ?? 'jpg');
        $basename = $pathInfo['filename'] ?? 'image';
        
        // Convert to ASCII slug
        $slug = self::slugify($basename);
        
        // Add property ID and timestamp for uniqueness
        $timestamp = time();
        $random = substr(md5(uniqid()), 0, 6);
        
        if ($propertyId) {
            return "prop_{$propertyId}_{$slug}_{$timestamp}_{$random}.{$extension}";
        } else {
            return "{$slug}_{$timestamp}_{$random}.{$extension}";
        }
    }
    
    /**
     * Preserve original filename with minimal sanitization
     */
    public static function preserveOriginalFilename($originalName) {
        if (empty($originalName)) {
            return 'image.jpg';
        }
        
        $pathInfo = pathinfo($originalName);
        $extension = strtolower($pathInfo['extension'] ?? 'jpg');
        $basename = $pathInfo['filename'] ?? 'image';
        
        // Minimal sanitization: remove unsafe characters only
        // Remove path separators and control characters
        $safeBasename = preg_replace('/[\/\\\\:\*\?"<>\|]/', '', $basename);
        $safeBasename = preg_replace('/[\x00-\x1F\x7F]/', '', $safeBasename);
        
        // Trim whitespace and dots from ends
        $safeBasename = trim($safeBasename, ' .');
        
        // Fallback if filename becomes empty
        if (empty($safeBasename)) {
            $safeBasename = 'image';
        }
        
        return $safeBasename . '.' . $extension;
    }
    
    /**
     * Convert string to ASCII slug
     */
    private static function slugify($text) {
        // Transliterate Cyrillic to Latin
        $cyrillic = [
            'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',
            'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm',
            'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
            'ф' => 'f', 'х' => 'h', 'ц' => 'ts', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sht', 'ъ' => 'a',
            'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
            'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'G', 'Д' => 'D', 'Е' => 'E', 'Ё' => 'E',
            'Ж' => 'Zh', 'З' => 'Z', 'И' => 'I', 'Й' => 'Y', 'К' => 'K', 'Л' => 'L', 'М' => 'M',
            'Н' => 'N', 'О' => 'O', 'П' => 'P', 'Р' => 'R', 'С' => 'S', 'Т' => 'T', 'У' => 'U',
            'Ф' => 'F', 'Х' => 'H', 'Ц' => 'Ts', 'Ч' => 'Ch', 'Ш' => 'Sh', 'Щ' => 'Sht', 'Ъ' => 'A',
            'Ы' => 'Y', 'Ь' => '', 'Э' => 'E', 'Ю' => 'Yu', 'Я' => 'Ya'
        ];
        
        $text = strtr($text, $cyrillic);
        
        // Remove non-ASCII characters and convert to lowercase
        $text = preg_replace('/[^a-zA-Z0-9\-_]/', '-', $text);
        $text = preg_replace('/-+/', '-', $text);
        $text = trim($text, '-');
        $text = strtolower($text);
        
        return $text ?: 'image';
    }
    
    /**
     * Build fully qualified image URL - environment aware
     */
    public static function buildImageUrl($relativePath, $addCacheBust = true) {
        if (empty($relativePath)) {
            error_log('[ImageHelper@buildImageUrl] Warning: Empty relativePath provided');
            return null;
        }
        
        // Priority: Use PUBLIC_BASE_URL for cross-environment compatibility
        $baseUrl = $_ENV['PUBLIC_BASE_URL'] ?? null;
        
        if (!$baseUrl) {
            // Fallback 1: Use APP_URL if available
            $baseUrl = $_ENV['APP_URL'] ?? null;
            
            if (!$baseUrl) {
                // Fallback 2: Development auto-detection
                if (isset($_ENV['REPLIT_DEV_DOMAIN'])) {
                    $baseUrl = 'https://' . $_ENV['REPLIT_DEV_DOMAIN'];
                } else {
                    // Fallback 3: Production default
                    $baseUrl = 'https://consultingg.com';
                }
            }
        }
        
        $baseUrl = rtrim($baseUrl, '/');
        
        // Ensure path starts with /
        if (!str_starts_with($relativePath, '/')) {
            $relativePath = '/' . $relativePath;
        }
        
        // Encode each path segment to handle spaces and non-ASCII characters
        $pathParts = explode('/', trim($relativePath, '/'));
        $encodedParts = array_map('rawurlencode', $pathParts);
        $encodedPath = '/' . implode('/', $encodedParts);
        
        $fullUrl = $baseUrl . $encodedPath;
        
        // Add cache-busting parameter
        if ($addCacheBust) {
            $separator = strpos($fullUrl, '?') !== false ? '&' : '?';
            $fullUrl .= $separator . 'v=' . time();
        }
        
        return $fullUrl;
    }
    
    /**
     * Check if image file exists and return appropriate URL with fallback support
     */
    public static function buildImageUrlWithFallback($relativePath, $addCacheBust = true) {
        if (empty($relativePath)) {
            return null;
        }
        
        // Try primary URL first
        $primaryUrl = self::buildImageUrl($relativePath, $addCacheBust);
        
        // Check if file exists locally
        $localPath = self::getLocalImagePath($relativePath);
        if (file_exists($localPath)) {
            return $primaryUrl;
        }
        
        // If file doesn't exist locally and fallback is enabled, try SuperHosting URL
        if (isset($_ENV['ALLOW_REMOTE_UPLOADS_FALLBACK']) && $_ENV['ALLOW_REMOTE_UPLOADS_FALLBACK'] === 'true') {
            $superhostingBaseUrl = 'https://consultingg.com';
            
            // Ensure path starts with /
            if (!str_starts_with($relativePath, '/')) {
                $relativePath = '/' . $relativePath;
            }
            
            // Encode path segments
            $pathParts = explode('/', trim($relativePath, '/'));
            $encodedParts = array_map('rawurlencode', $pathParts);
            $encodedPath = '/' . implode('/', $encodedParts);
            
            return $superhostingBaseUrl . $encodedPath;
        }
        
        // Return primary URL even if file doesn't exist (will result in 404)
        return $primaryUrl;
    }
    
    /**
     * Get local filesystem path for image
     */
    private static function getLocalImagePath($relativePath) {
        $uploadsBase = $_ENV['UPLOADS_FS_BASE'] ?? realpath(__DIR__ . '/../../uploads') ?: __DIR__ . '/../../uploads';
        return rtrim($uploadsBase, '/') . '/' . ltrim($relativePath, '/');
    }
    
    /**
     * Process images array and add computed URL fields
     * NOW WITH IMPROVED ERROR HANDLING AND FALLBACK
     */
    public static function processImages($images) {
        if (!is_array($images)) {
            error_log('[ImageHelper@processImages] Warning: Input is not an array');
            return [];
        }
        
        if (empty($images)) {
            error_log('[ImageHelper@processImages] Warning: Empty images array provided');
            return [];
        }
        
        $processedImages = [];
        
        foreach ($images as $image) {
            if (!is_array($image)) {
                error_log('[ImageHelper@processImages] Warning: Skipping non-array image entry');
                continue;
            }
            
            $imageUrl = $image['image_url'] ?? '';
            
            // ✅ CRITICAL FIX: Skip images with empty image_url
            if (empty($imageUrl)) {
                error_log('[ImageHelper@processImages] Warning: Skipping image with empty URL - ID: ' . ($image['id'] ?? 'unknown'));
                continue;
            }
            
            // ✅ CRITICAL FIX: Add computed URL field with cache-busting
            try {
                $image['url'] = self::buildImageUrl($imageUrl);
                
                // ✅ CRITICAL FIX: Ensure URL is not null
                if (empty($image['url'])) {
                    error_log('[ImageHelper@processImages] Warning: Failed to build URL for: ' . $imageUrl);
                    continue; // Skip images with invalid URLs
                }
                
                // Add thumbnail_url
                $thumbnailPath = self::generateThumbnailPath($imageUrl);
                $image['thumbnail_url'] = self::buildImageUrl($thumbnailPath);
                
                // ✅ CRITICAL FIX: Ensure thumbnail_url is not null
                if (empty($image['thumbnail_url'])) {
                    error_log('[ImageHelper@processImages] Warning: Failed to build thumbnail URL for: ' . $imageUrl);
                    // Use main image as fallback
                    $image['thumbnail_url'] = $image['url'];
                }
                
                $processedImages[] = $image;
                
            } catch (Exception $e) {
                error_log('[ImageHelper@processImages] Error processing image: ' . $e->getMessage());
                continue;
            }
        }
        
        if (empty($processedImages)) {
            error_log('[ImageHelper@processImages] Warning: No valid images after processing');
            return [];
        }
        
        // Sort: main first, then by sort_order, then by id
        usort($processedImages, function($a, $b) {
            // Main image first
            $aMain = isset($a['is_main']) ? (bool)$a['is_main'] : false;
            $bMain = isset($b['is_main']) ? (bool)$b['is_main'] : false;
            
            if ($aMain && !$bMain) return -1;
            if (!$aMain && $bMain) return 1;
            
            // Then by sort_order
            $sortA = isset($a['sort_order']) ? (int)$a['sort_order'] : 0;
            $sortB = isset($b['sort_order']) ? (int)$b['sort_order'] : 0;
            
            if ($sortA !== $sortB) {
                return $sortA - $sortB;
            }
            
            // Finally by id
            $idA = $a['id'] ?? '';
            $idB = $b['id'] ?? '';
            return strcmp($idA, $idB);
        });
        
        error_log('[ImageHelper@processImages] Successfully processed ' . count($processedImages) . ' images');
        return $processedImages;
    }
    
    /**
     * Generate thumbnail path from original image path
     */
    public static function generateThumbnailPath($imagePath) {
        if (empty($imagePath)) {
            return '';
        }
        
        $pathInfo = pathinfo($imagePath);
        $directory = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];
        $extension = $pathInfo['extension'] ?? 'jpg';
        
        return $directory . '/' . $filename . '_thumb.' . $extension;
    }
}
?>