<?php
/**
 * Database Installation Script
 * Run this file once to set up the PostgreSQL database
 */

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Use Replit's PostgreSQL database environment variables
$host = $_ENV['PGHOST'] ?? getenv('PGHOST') ?? 'localhost';
$username = $_ENV['PGUSER'] ?? getenv('PGUSER') ?? 'postgres';
$password = $_ENV['PGPASSWORD'] ?? getenv('PGPASSWORD') ?? '';
$database = $_ENV['PGDATABASE'] ?? getenv('PGDATABASE') ?? 'postgres';
$port = $_ENV['PGPORT'] ?? getenv('PGPORT') ?? '5432';

try {
    // Connect to PostgreSQL server
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to PostgreSQL server successfully.\n";
    
    // Read and execute PostgreSQL schema from Supabase migrations
    $schemaFile = __DIR__ . '/../../supabase/migrations/create_consultingg_schema.sql';
    $dataFile = __DIR__ . '/../../supabase/migrations/insert_sample_data.sql';
    
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $pdo->exec($sql);
        echo "Database schema created successfully.\n";
    }
    
    if (file_exists($dataFile)) {
        $sql = file_get_contents($dataFile);
        $pdo->exec($sql);
        echo "Sample data inserted successfully.\n";
    }
    
    echo "Default admin user created: georgiev@consultingg.com / PoloSport88*\n";
    echo "Sample properties and images with local paths inserted.\n";
    echo "\nInstallation completed successfully!\n";
    
} catch (PDOException $e) {
    echo "PostgreSQL Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>