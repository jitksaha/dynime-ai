<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminAiController;

// Public & Auth Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::get('/auth/sso', [AuthController::class, 'ssoRedirect'])->name('auth.sso.redirect');
Route::get('/auth/sso/callback', [AuthController::class, 'ssoCallback'])->name('auth.sso.callback');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Authenticated Routes
Route::middleware(['auth'])->group(function () {
    // Root redirects to chat
    Route::get('/', fn() => redirect()->route('chat.index'));

    // Chat Interface & Actions
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/api/conversations', [ChatController::class, 'getConversations'])->name('chat.conversations');
    Route::post('/api/conversations', [ChatController::class, 'storeConversation'])->name('chat.conversations.store');
    Route::get('/api/conversations/{uuid}', [ChatController::class, 'showConversation'])->name('chat.conversations.show');
    Route::put('/api/conversations/{uuid}', [ChatController::class, 'updateConversation'])->name('chat.conversations.update');
    Route::delete('/api/conversations/{uuid}', [ChatController::class, 'destroyConversation'])->name('chat.conversations.destroy');
    
    Route::post('/api/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::get('/api/chat/stream', [ChatController::class, 'stream'])->name('chat.stream');
    Route::post('/api/chat/attachments', [ChatController::class, 'uploadAttachment'])->name('chat.attachments.upload');

    // Admin Panel (Protected)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminAiController::class, 'index'])->name('index');
        Route::get('/settings', [AdminAiController::class, 'settings'])->name('settings');
        Route::put('/providers/{id}', [AdminAiController::class, 'updateProvider'])->name('providers.update');
        Route::post('/providers/{id}/toggle', [AdminAiController::class, 'toggleProvider'])->name('providers.toggle');
        Route::post('/providers/{id}/test', [AdminAiController::class, 'testConnection'])->name('providers.test');
        Route::get('/logs', [AdminAiController::class, 'auditLogs'])->name('logs');
    });
});
