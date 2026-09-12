<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'Dynime AI Standalone',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});
