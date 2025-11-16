<?php
// backend/find-all-property-files.php
echo "<h1>Search for all Property.php files</h1>";

$basePath = dirname(__DIR__); // parent of backend/

function findFiles($dir, $filename) {
    $results = [];
    $files = @scandir($dir);
    if ($files === false) return $results;
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path) && $file !== 'vendor' && $file !== 'node_modules') {
            $results = array_merge($results, findFiles($path, $filename));
        } elseif ($file === $filename) {
            $results[] = $path;
        }
    }
    return $results;
}

$propertyFiles = findFiles($basePath, 'Property.php');

echo "<h2>Found " . count($propertyFiles) . " Property.php file(s):</h2>";
echo "<ol>";
foreach ($propertyFiles as $file) {
    echo "<li>";
    echo "<strong>" . htmlspecialchars($file) . "</strong><br>";
    echo "Size: " . filesize($file) . " bytes<br>";
    echo "Modified: " . date('Y-m-d H:i:s', filemtime($file)) . "<br>";
    
    // Check for p.location
    $content = file_get_contents($file);
    if (strpos($content, 'p.location') !== false) {
        echo "<span style='color:red; font-weight:bold;'>❌ Contains p.location</span><br>";
    } else {
        echo "<span style='color:green;'>✅ No p.location found</span><br>";
    }
    
    if (strpos($content, 'json_agg') !== false) {
        echo "<span style='color:red; font-weight:bold;'>❌ Contains PostgreSQL json_agg</span><br>";
    } else {
        echo "<span style='color:green;'>✅ No json_agg found</span><br>";
    }
    
    echo "</li><br>";
}
echo "</ol>";

// Also search for any PHP file with "p.location" in SELECT
echo "<hr><h2>Searching for any file with 'p.location' in SQL query...</h2>";

function searchInPhpFiles($dir, $searchTerm) {
    $results = [];
    $files = @scandir($dir);
    if ($files === false) return $results;
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        
        if (is_dir($path) && $file !== 'vendor' && $file !== 'node_modules') {
            $results = array_merge($results, searchInPhpFiles($path, $searchTerm));
        } elseif (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
            $content = @file_get_contents($path);
            if ($content && stripos($content, $searchTerm) !== false) {
                // Find the line number
                $lines = explode("\n", $content);
                $matchingLines = [];
                foreach ($lines as $num => $line) {
                    if (stripos($line, $searchTerm) !== false) {
                        $matchingLines[] = ($num + 1) . ": " . trim($line);
                    }
                }
                $results[] = [
                    'file' => $path,
                    'lines' => $matchingLines
                ];
            }
        }
    }
    return $results;
}

$matches = searchInPhpFiles($basePath . '/backend', 'p.location');

if (empty($matches)) {
    echo "<p style='color:green; font-size:18px;'>✅ No PHP files found with 'p.location'</p>";
} else {
    echo "<p style='color:red; font-size:18px;'>❌ Found " . count($matches) . " file(s) with 'p.location':</p>";
    echo "<ol>";
    foreach ($matches as $match) {
        echo "<li>";
        echo "<strong>" . htmlspecialchars($match['file']) . "</strong><br>";
        echo "<pre>" . htmlspecialchars(implode("\n", $match['lines'])) . "</pre>";
        echo "</li>";
    }
    echo "</ol>";
}
?>