<?php
class ErrorLogger {
    private static $logFile = __DIR__ . '/../../logs/api_errors.log';
    
    public static function logError($context, $error, $data = []) {
        $timestamp = date('Y-m-d H:i:s');
        $errorId = uniqid('err_');
        
        $logEntry = [
            'timestamp' => $timestamp,
            'error_id' => $errorId,
            'context' => $context,
            'message' => $error->getMessage(),
            'file' => $error->getFile(),
            'line' => $error->getLine(),
            'trace' => $error->getTraceAsString(),
            'data' => $data
        ];
        
        // Ensure log directory exists
        $logDir = dirname(self::$logFile);
        if (!file_exists($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Write to log file
        file_put_contents(
            self::$logFile, 
            json_encode($logEntry) . "\n", 
            FILE_APPEND | LOCK_EX
        );
        
        // Also write to error_log for immediate visibility
        error_log("[{$errorId}] {$context}: " . $error->getMessage());
        
        return $errorId;
    }
    
    public static function logValidationError($context, $message, $data = []) {
        $timestamp = date('Y-m-d H:i:s');
        $errorId = uniqid('val_');
        
        $logEntry = [
            'timestamp' => $timestamp,
            'error_id' => $errorId,
            'context' => $context,
            'type' => 'validation',
            'message' => $message,
            'data' => $data
        ];
        
        // Ensure log directory exists
        $logDir = dirname(self::$logFile);
        if (!file_exists($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Write to log file
        file_put_contents(
            self::$logFile, 
            json_encode($logEntry) . "\n", 
            FILE_APPEND | LOCK_EX
        );
        
        error_log("[{$errorId}] {$context}: {$message}");
        
        return $errorId;
    }
}
?>