<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Automatic cache buster for updated view templates and routes
$flag = __DIR__.'/../storage/framework/views/.favicon_cleared_v2';
if (!file_exists($flag)) {
    @array_map('unlink', glob(__DIR__.'/../storage/framework/views/*.php') ?: []);
    @array_map('unlink', glob(__DIR__.'/../bootstrap/cache/routes*.php') ?: []);
    @touch($flag);
}

if (isset($_GET['clear_cache']) && $_GET['clear_cache'] === 'dynime2026') {
    @array_map('unlink', glob(__DIR__.'/../storage/framework/views/*.php') ?: []);
    @array_map('unlink', glob(__DIR__.'/../bootstrap/cache/*.php') ?: []);
    echo 'View, route, and bootstrap caches cleared at ' . date('Y-m-d H:i:s');
    exit;
}

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
