<?php

class Database {
    private $connection;
    private static $instance = null;

    private function __construct() {
        // Determine database connection type (mysql or pgsql)
        $dbConnection = $_ENV['DB_CONNECTION'] ?? 'pgsql';
        
        if ($dbConnection === 'mysql') {
            $this->connectMySQL();
        } else {
            $this->connectPostgreSQL();
        }
    }

    private function connectMySQL() {
        // MySQL configuration for SuperHosting
        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $dbname = $_ENV['DB_DATABASE'] ?? $_ENV['DB_NAME'] ?? 'consultingg';
        $user = $_ENV['DB_USERNAME'] ?? $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASSWORD'] ?? $_ENV['DB_PASS'] ?? '';
        $charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
        $collation = $_ENV['DB_COLLATION'] ?? 'utf8mb4_unicode_ci';
        
        error_log('[DB] Using MySQL configuration');
        error_log('[DB] Host: ' . $host . ', Port: ' . $port . ', Database: ' . $dbname);
        
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
            
            $this->connection = new PDO(
                $dsn,
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE {$collation}",
                    PDO::ATTR_TIMEOUT => 15
                ]
            );
            
            // Set MySQL session variables
            $this->connection->exec("SET sql_mode='NO_AUTO_VALUE_ON_ZERO,NO_ZERO_DATE'");
            $this->connection->exec("SET time_zone='+00:00'");
            
            if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
                error_log('[DB] Connected successfully to MySQL: ' . $dbname . ' on ' . $host);
            }
        } catch (PDOException $exception) {
            error_log('[DB] MySQL connection failed: ' . $exception->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    private function connectPostgreSQL() {
        // Priority 1: For SuperHosting/Production, use discrete DB_* variables (Supabase)
        // Skip DB_HOST if it's 'localhost' since Replit doesn't have local PostgreSQL on localhost:5432
        if (isset($_ENV['DB_HOST']) && !empty($_ENV['DB_HOST']) && $_ENV['DB_HOST'] !== 'localhost') {
            $host = $_ENV['DB_HOST'];
            $dbname = $_ENV['DB_DATABASE'] ?? $_ENV['DB_NAME'] ?? 'postgres';
            $user = $_ENV['DB_USERNAME'] ?? $_ENV['DB_USER'] ?? 'postgres';
            $pass = $_ENV['DB_PASSWORD'] ?? $_ENV['DB_PASS'] ?? '';
            $port = $_ENV['DB_PORT'] ?? '5432';
            $sslmode = 'require'; // Always use SSL for Supabase
            
            error_log('[DB] Using Supabase/Production configuration from DB_* environment variables');
            error_log('[DB] DB_HOST: ' . $host . ', DB_PORT: ' . $port . ', DB_NAME: ' . $dbname);
        } else if (isset($_ENV['DATABASE_URL']) && !empty($_ENV['DATABASE_URL'])) {
            // Priority 2: Parse DATABASE_URL if available (Replit development)
            $dbUrl = parse_url($_ENV['DATABASE_URL']);
            $host = $dbUrl['host'] ?? 'localhost';
            $port = $dbUrl['port'] ?? '5432';
            $dbname = ltrim($dbUrl['path'] ?? '/postgres', '/');
            $user = $dbUrl['user'] ?? 'postgres';
            $pass = $dbUrl['pass'] ?? '';
            $sslmode = 'require';
            
            error_log('[DB] Using Replit DATABASE_URL configuration');
        } else {
            // Priority 3: Fallback to PG* environment variables
            $host = $_ENV['PGHOST'] ?? 'localhost';
            $dbname = $_ENV['PGDATABASE'] ?? 'postgres';
            $user = $_ENV['PGUSER'] ?? 'postgres';
            $pass = $_ENV['PGPASSWORD'] ?? '';
            $port = $_ENV['PGPORT'] ?? '5432';
            $sslmode = 'require';
            
            error_log('[DB] Using PG* environment variables as fallback');
        }

        try {
            // Build DSN with Neon SNI support
            $extra = $_ENV['DB_OPTIONS'] ?? '';
            $sslmode = $_ENV['DB_SSLMODE'] ?? $sslmode ?? 'require';
            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$sslmode}";
            
            // Append extra options if provided
            if (!empty($extra)) {
                $dsn .= ';' . $extra;
            }
            
            // Auto-inject Neon endpoint for .neon.tech hosts (SNI requirement)
            $isNeon = (strpos($host, '.neon.tech') !== false);
            if ($isNeon && stripos($dsn, 'options=endpoint=') === false) {
                $firstLabel = strtok($host, '.');  // e.g. ep-noisy-pine-agnly9s[-pooler]
                $endpointId = preg_replace('/-pooler$/', '', $firstLabel); // strip -pooler if present
                if (strpos($endpointId, 'ep-') === 0) {
                    $dsn .= ';options=endpoint=' . $endpointId . ';channel_binding=disable';
                    if (stripos($dsn, 'sslmode=') === false) {
                        $dsn .= ';sslmode=require';
                    }
                    error_log('[DB] Neon SNI: Auto-injected endpoint=' . $endpointId);
                }
            }
            
            $this->connection = new PDO(
                $dsn,
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 15
                ]
            );
            
            if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
                error_log('[DB] Connected successfully to PostgreSQL: ' . $dbname . ' on ' . $host);
            }
        } catch (PDOException $exception) {
            error_log('[DB] PostgreSQL connection failed: ' . $exception->getMessage());
            
            // In production, don't expose database details
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}
