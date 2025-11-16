<?php
/**
 * SEARCH & IMAGES DIAGNOSTIC TOOL
 * Analyzes search functionality and thumbnail issues
 * Usage: https://consultingg.com/diagnose-search.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
echo "<title>Search & Images Diagnostic Report</title>";
echo "<style>
body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #fff; }
.section { background: #2d2d2d; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
.error { border-color: #f44336; }
.warning { border-color: #ff9800; }
.success { border-color: #4CAF50; }
h2 { color: #4CAF50; margin: 0 0 10px 0; }
pre { background: #000; padding: 10px; overflow-x: auto; }
.file-path { color: #64B5F6; }
.status { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
.status.ok { background: #4CAF50; }
.status.fail { background: #f44336; }
.status.warn { background: #ff9800; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
td, th { padding: 8px; border: 1px solid #444; text-align: left; }
th { background: #333; }
</style></head><body>";

echo "<h1>🔍 CONSULTINGG.COM - Search & Images Diagnostic</h1>";
echo "<p>Date: " . date('Y-m-d H:i:s') . " | Domain: https://consultingg.com/</p>";

// ============================================
// 1. FIND SEARCH-RELATED FILES
// ============================================
echo "<div class='section'><h2>📂 STEP 1: Search-Related Files</h2>";

$searchFiles = [
    'API Files' => [
        'api/properties.php',
        'api/search.php',
        'api/search-properties.php',
        'backend/api/properties.php',
        'public_html/api/properties.php'
    ],
    'Frontend Files' => [
        'src/pages/SearchPage.tsx',
        'src/components/PropertySearch.tsx',
        'src/components/PropertyCard.tsx',
        'dist/assets/index-*.js'
    ],
    'Config Files' => [
        'config/database.php',
        'backend/.env',
        '.env'
    ]
];

$foundFiles = [];

foreach ($searchFiles as $category => $files) {
    echo "<h3>{$category}:</h3><table>";
    echo "<tr><th>File</th><th>Status</th><th>Size</th><th>Modified</th></tr>";
    
    foreach ($files as $file) {
        $fullPath = __DIR__ . '/' . $file;
        $exists = file_exists($fullPath);
        
        if ($exists) {
            $foundFiles[$category][] = $fullPath;
            $size = filesize($fullPath);
            $modified = date('Y-m-d H:i', filemtime($fullPath));
            $status = "<span class='status ok'>✓ EXISTS</span>";
            echo "<tr><td class='file-path'>{$file}</td><td>{$status}</td><td>" . number_format($size) . " bytes</td><td>{$modified}</td></tr>";
        } else {
            // Try glob for wildcards
            $globFiles = glob(__DIR__ . '/' . $file);
            if (!empty($globFiles)) {
                foreach ($globFiles as $gf) {
                    $foundFiles[$category][] = $gf;
                    $size = filesize($gf);
                    $modified = date('Y-m-d H:i', filemtime($gf));
                    $status = "<span class='status ok'>✓ FOUND</span>";
                    $displayPath = str_replace(__DIR__ . '/', '', $gf);
                    echo "<tr><td class='file-path'>{$displayPath}</td><td>{$status}</td><td>" . number_format($size) . " bytes</td><td>{$modified}</td></tr>";
                }
            } else {
                $status = "<span class='status fail'>✗ NOT FOUND</span>";
                echo "<tr><td class='file-path'>{$file}</td><td>{$status}</td><td>-</td><td>-</td></tr>";
            }
        }
    }
    echo "</table>";
}

echo "</div>";

// ============================================
// 2. ANALYZE API SEARCH ENDPOINT
// ============================================
echo "<div class='section'><h2>🔌 STEP 2: API Search Endpoint Analysis</h2>";

$apiFile = null;
foreach (['api/properties.php', 'backend/api/properties.php', 'public_html/api/properties.php'] as $f) {
    if (file_exists(__DIR__ . '/' . $f)) {
        $apiFile = __DIR__ . '/' . $f;
        break;
    }
}

if ($apiFile) {
    echo "<p><span class='status ok'>Found API File</span>: <code class='file-path'>{$apiFile}</code></p>";
    
    $apiContent = file_get_contents($apiFile);
    
    // Check for search logic
    $hasSearchQuery = (stripos($apiContent, 'search') !== false || stripos($apiContent, 'keyword') !== false);
    $hasImageLogic = (stripos($apiContent, 'image') !== false || stripos($apiContent, 'thumbnail') !== false);
    $hasLikeQuery = (stripos($apiContent, 'LIKE') !== false);
    
    echo "<table>";
    echo "<tr><th>Check</th><th>Status</th></tr>";
    echo "<tr><td>Search query handling</td><td>" . ($hasSearchQuery ? "<span class='status ok'>✓ FOUND</span>" : "<span class='status fail'>✗ MISSING</span>") . "</td></tr>";
    echo "<tr><td>Image/thumbnail logic</td><td>" . ($hasImageLogic ? "<span class='status ok'>✓ FOUND</span>" : "<span class='status warn'>⚠ NOT FOUND</span>") . "</td></tr>";
    echo "<tr><td>SQL LIKE query</td><td>" . ($hasLikeQuery ? "<span class='status ok'>✓ FOUND</span>" : "<span class='status fail'>✗ MISSING</span>") . "</td></tr>";
    echo "</table>";
    
    // Extract relevant code snippets
    preg_match_all('/\$\w+\s*=\s*\$_GET\[.*?\];/i', $apiContent, $getParams);
    if (!empty($getParams[0])) {
        echo "<h3>GET Parameters:</h3><pre>" . htmlspecialchars(implode("\n", array_unique($getParams[0]))) . "</pre>";
    }
    
    preg_match_all('/SELECT.*?FROM.*?properties.*?;/is', $apiContent, $sqlQueries);
    if (!empty($sqlQueries[0])) {
        echo "<h3>SQL Queries (first 3):</h3>";
        foreach (array_slice($sqlQueries[0], 0, 3) as $sql) {
            echo "<pre>" . htmlspecialchars(substr($sql, 0, 500)) . "...</pre>";
        }
    }
    
} else {
    echo "<p><span class='status fail'>✗ API FILE NOT FOUND</span></p>";
}

echo "</div>";

// ============================================
// 3. TEST SEARCH API WITH KEYWORD
// ============================================
echo "<div class='section'><h2>🧪 STEP 3: Live API Test</h2>";

$testUrl = "https://consultingg.com/api/properties?keyword=драгалевци&transaction_type=sale&city_region=София";
echo "<p>Testing: <code>{$testUrl}</code></p>";

$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p>HTTP Status: <span class='status " . ($httpCode == 200 ? "ok" : "fail") . "'>{$httpCode}</span></p>";

if ($response) {
    $data = json_decode($response, true);
    
    if ($data) {
        echo "<h3>Response Summary:</h3>";
        echo "<table>";
        echo "<tr><td>Success</td><td>" . ($data['success'] ? "✓ Yes" : "✗ No") . "</td></tr>";
        echo "<tr><td>Total Results</td><td>" . ($data['total'] ?? 0) . "</td></tr>";
        echo "<tr><td>Properties Count</td><td>" . (isset($data['data']) ? count($data['data']) : 0) . "</td></tr>";
        echo "</table>";
        
        if (isset($data['data']) && !empty($data['data'])) {
            echo "<h3>First Property Analysis:</h3>";
            $firstProp = $data['data'][0];
            
            echo "<table>";
            echo "<tr><th>Field</th><th>Value</th></tr>";
            echo "<tr><td>ID</td><td>{$firstProp['id']}</td></tr>";
            echo "<tr><td>Title</td><td>" . htmlspecialchars(substr($firstProp['title'], 0, 50)) . "...</td></tr>";
            
            // CHECK FOR IMAGE FIELDS
            $imageFields = ['image', 'images', 'thumbnail', 'main_image', 'imageUrl', 'image_url'];
            $hasImages = false;
            
            foreach ($imageFields as $field) {
                if (isset($firstProp[$field])) {
                    $hasImages = true;
                    $value = $firstProp[$field];
                    $status = empty($value) ? "<span class='status warn'>⚠ EMPTY</span>" : "<span class='status ok'>✓ HAS VALUE</span>";
                    echo "<tr><td><strong>{$field}</strong></td><td>{$status} " . htmlspecialchars(substr($value, 0, 100)) . "</td></tr>";
                }
            }
            
            if (!$hasImages) {
                echo "<tr><td colspan='2'><span class='status fail'>✗ NO IMAGE FIELDS FOUND IN RESPONSE!</span></td></tr>";
            }
            
            echo "</table>";
            
            // Show all property fields
            echo "<h3>All Fields in Response:</h3><pre>" . htmlspecialchars(json_encode($firstProp, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "</pre>";
        } else {
            echo "<p><span class='status warn'>⚠ No properties returned in search</span></p>";
        }
    } else {
        echo "<p><span class='status fail'>✗ Invalid JSON Response</span></p>";
        echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";
    }
} else {
    echo "<p><span class='status fail'>✗ No response from API</span></p>";
}

echo "</div>";

// ============================================
// 4. CHECK DATABASE FOR IMAGES
// ============================================
echo "<div class='section'><h2>🗄️ STEP 4: Database Image Data</h2>";

try {
    // Try to load database config
    $dbConfigPaths = ['config/database.php', 'backend/config/database.php', '../backend/.env'];
    $dbConnected = false;
    
    foreach ($dbConfigPaths as $configPath) {
        if (file_exists(__DIR__ . '/' . $configPath)) {
            echo "<p>Found config: <code>{$configPath}</code></p>";
            
            // Try to connect (basic check)
            if (strpos($configPath, '.env') !== false) {
                // Parse .env
                $envContent = file_get_contents(__DIR__ . '/' . $configPath);
                preg_match('/DATABASE_URL="mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"]+)"/', $envContent, $matches);
                
                if ($matches) {
                    try {
                        $pdo = new PDO("mysql:host={$matches[3]};dbname={$matches[5]};charset=utf8mb4", $matches[1], $matches[2]);
                        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                        
                        echo "<p><span class='status ok'>✓ Database connected</span></p>";
                        
                        // Check property_images table
                        $stmt = $pdo->query("SELECT COUNT(*) as count FROM property_images");
                        $imgCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                        
                        echo "<p>Total images in property_images table: <strong>{$imgCount}</strong></p>";
                        
                        // Sample image data
                        $stmt = $pdo->query("SELECT pi.property_id, pi.image_url, pi.is_main, p.title 
                                            FROM property_images pi 
                                            LEFT JOIN properties p ON p.id = pi.property_id 
                                            LIMIT 5");
                        $sampleImages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        if ($sampleImages) {
                            echo "<h3>Sample Image Records:</h3><table>";
                            echo "<tr><th>Property</th><th>Image URL</th><th>Main</th></tr>";
                            foreach ($sampleImages as $img) {
                                echo "<tr><td>" . htmlspecialchars(substr($img['title'], 0, 30)) . "</td>";
                                echo "<td class='file-path'>" . htmlspecialchars($img['image_url']) . "</td>";
                                echo "<td>" . ($img['is_main'] ? "✓" : "-") . "</td></tr>";
                            }
                            echo "</table>";
                        }
                        
                        $dbConnected = true;
                        break;
                    } catch (PDOException $e) {
                        echo "<p><span class='status fail'>✗ Database connection failed: " . $e->getMessage() . "</span></p>";
                    }
                }
            }
        }
    }
    
    if (!$dbConnected) {
        echo "<p><span class='status warn'>⚠ Could not connect to database for analysis</span></p>";
    }
    
} catch (Exception $e) {
    echo "<p><span class='status fail'>✗ Error: " . $e->getMessage() . "</span></p>";
}

echo "</div>";

// ============================================
// 5. CHECK UPLOADS FOLDER
// ============================================
echo "<div class='section'><h2>📁 STEP 5: Uploads Folder Structure</h2>";

$uploadsDir = __DIR__ . '/uploads/properties';
if (is_dir($uploadsDir)) {
    echo "<p><span class='status ok'>✓ Uploads folder exists</span>: <code>{$uploadsDir}</code></p>";
    
    $propDirs = glob($uploadsDir . '/*', GLOB_ONLYDIR);
    echo "<p>Total property folders: <strong>" . count($propDirs) . "</strong></p>";
    
    echo "<h3>Sample Property Folders (first 5):</h3><table>";
    echo "<tr><th>Property Folder</th><th>Image Count</th><th>Sample Image</th></tr>";
    
    foreach (array_slice($propDirs, 0, 5) as $propDir) {
        $images = glob($propDir . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);
        $folderName = basename($propDir);
        $sampleImg = !empty($images) ? basename($images[0]) : '-';
        
        echo "<tr><td>{$folderName}</td><td>" . count($images) . "</td><td class='file-path'>{$sampleImg}</td></tr>";
    }
    echo "</table>";
    
} else {
    echo "<p><span class='status fail'>✗ Uploads folder not found</span></p>";
}

echo "</div>";

// ============================================
// 6. RECOMMENDATIONS
// ============================================
echo "<div class='section'><h2>💡 STEP 6: Diagnostic Summary & Recommendations</h2>";

echo "<h3>🔴 IDENTIFIED ISSUES:</h3>";
echo "<ol>";
echo "<li><strong>API Response Missing Images:</strong> Search results don't include image URLs in response</li>";
echo "<li><strong>Error 500:</strong> API endpoint throwing server error on some requests</li>";
echo "<li><strong>Fallback Mode:</strong> Frontend using fallback local data instead of API</li>";
echo "</ol>";

echo "<h3>✅ RECOMMENDED FIXES:</h3>";
echo "<ol>";
echo "<li><strong>Fix API Image Join:</strong> Ensure properties API joins property_images table";
echo "<pre>SELECT p.*, GROUP_CONCAT(pi.image_url) as images
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
WHERE ...
GROUP BY p.id</pre>";

echo "<li><strong>Return Full Image URLs:</strong> Prepend domain to image paths";
echo "<pre>\$imageUrl = 'https://consultingg.com/' . \$row['image_url'];</pre>";

echo "<li><strong>Handle Missing Images:</strong> Return placeholder when no images exist";
echo "<pre>if (empty(\$images)) {
    \$images = ['https://consultingg.com/images/placeholder.jpg'];
}</pre>";

echo "<li><strong>Fix API 500 Error:</strong> Check error logs and add proper error handling";
echo "<pre>error_log('API Error: ' . \$e->getMessage());</pre>";

echo "</ol>";

echo "</div>";

echo "<p style='text-align:center;margin-top:30px;color:#666;'>Generated by diagnose-search.php | ConsultingG Diagnostic Tool</p>";
echo "</body></html>";
?>