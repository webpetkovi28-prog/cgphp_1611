<?php
/**
 * Cache Clearing Utility for ConsultingG.com
 * Place in: /home/yogahonc/consultingg.com/backend/utils/clear-cache.php
 * 
 * Usage:
 * - Browser: https://consultingg.com/backend/utils/clear-cache.php
 * - CLI: php /home/yogahonc/consultingg.com/backend/utils/clear-cache.php
 */

// Security: Only allow from localhost or authorized IPs in production
$allowedIPs = ['127.0.0.1', '::1'];
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'CLI';

// Allow CLI execution
$isCLI = (php_sapi_name() === 'cli');

if (!$isCLI && !in_array($clientIP, $allowedIPs)) {
    // In production, you can add authentication here
    // For now, we'll allow it but log the access
    error_log('[ClearCache] Access from IP: ' . $clientIP);
}

header('Content-Type: application/json; charset=utf-8');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'operations' => [],
    'success' => true
];

// 1. Clear OPcache
if (function_exists('opcache_reset')) {
    try {
        opcache_reset();
        $results['operations']['opcache'] = 'Cleared successfully';
    } catch (Exception $e) {
        $results['operations']['opcache'] = 'Error: ' . $e->getMessage();
        $results['success'] = false;
    }
} else {
    $results['operations']['opcache'] = 'Not available';
}

// 2. Clear APCu cache (if available)
if (function_exists('apcu_clear_cache')) {
    try {
        apcu_clear_cache();
        $results['operations']['apcu'] = 'Cleared successfully';
    } catch (Exception $e) {
        $results['operations']['apcu'] = 'Error: ' . $e->getMessage();
    }
} else {
    $results['operations']['apcu'] = 'Not available';
}

// 3. Clear Realpath cache
clearstatcache(true);
$results['operations']['realpath_cache'] = 'Cleared successfully';

// 4. Touch critical files to force reload
$filesToTouch = [
    __DIR__ . '/../../backend/api/index.php',
    __DIR__ . '/../../index.html',
    __DIR__ . '/../models/Property.php',
    __DIR__ . '/ImageHelper.php'
];

$touchedFiles = [];
$touchErrors = [];

foreach ($filesToTouch as $file) {
    if (file_exists($file)) {
        if (touch($file)) {
            $touchedFiles[] = basename($file);
        } else {
            $touchErrors[] = basename($file);
        }
    }
}

$results['operations']['touch_files'] = [
    'success' => $touchedFiles,
    'errors' => $touchErrors
];

// 5. Clear session files (optional - use with caution)
$clearSessions = isset($_GET['clear_sessions']) && $_GET['clear_sessions'] === 'true';
if ($clearSessions) {
    try {
        $sessionPath = session_save_path();
        if (empty($sessionPath)) {
            $sessionPath = sys_get_temp_dir();
        }
        
        $sessionFiles = glob($sessionPath . '/sess_*');
        $deletedSessions = 0;
        
        foreach ($sessionFiles as $sessionFile) {
            if (unlink($sessionFile)) {
                $deletedSessions++;
            }
        }
        
        $results['operations']['sessions'] = "Deleted $deletedSessions session files";
    } catch (Exception $e) {
        $results['operations']['sessions'] = 'Error: ' . $e->getMessage();
    }
} else {
    $results['operations']['sessions'] = 'Skipped (add ?clear_sessions=true to clear)';
}

// 6. Get cache statistics
$results['statistics'] = [
    'opcache_enabled' => function_exists('opcache_get_status'),
    'apcu_enabled' => function_exists('apcu_cache_info'),
    'php_version' => PHP_VERSION,
    'sapi' => php_sapi_name()
];

if (function_exists('opcache_get_status')) {
    $opcacheStatus = opcache_get_status(false);
    if ($opcacheStatus) {
        $results['statistics']['opcache'] = [
            'enabled' => $opcacheStatus['opcache_enabled'] ?? false,
            'cache_full' => $opcacheStatus['cache_full'] ?? false,
            'num_cached_scripts' => $opcacheStatus['opcache_statistics']['num_cached_scripts'] ?? 0,
            'hits' => $opcacheStatus['opcache_statistics']['hits'] ?? 0,
            'misses' => $opcacheStatus['opcache_statistics']['misses'] ?? 0
        ];
    }
}

// Output results
if ($isCLI) {
    echo "Cache Clearing Results:\n";
    echo "======================\n\n";
    foreach ($results['operations'] as $operation => $status) {
        echo ucfirst($operation) . ": ";
        if (is_array($status)) {
            echo json_encode($status, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo $status . "\n";
        }
    }
    echo "\nOverall status: " . ($results['success'] ? 'SUCCESS' : 'PARTIAL SUCCESS') . "\n";
} else {
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Log the cache clear operation
error_log('[ClearCache] Cache cleared by ' . ($isCLI ? 'CLI' : $clientIP) . ' - Success: ' . ($results['success'] ? 'YES' : 'NO'));
?>