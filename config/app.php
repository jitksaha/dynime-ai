<?php

return [
    'name' => env('APP_NAME', 'Dynime Account'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'https://account.dynime.com'),
    'timezone' => env('APP_TIMEZONE', 'Asia/Kolkata'),
    'locale' => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),
    'cipher' => 'AES-256-CBC',
    'key' => env('APP_KEY'),

    'account_domain' => env('ACCOUNT_DOMAIN', 'account.dynime.com'),
    'app_domain' => env('ERP_DOMAIN', 'app.dynime.com'),
    'chat_domain' => env('CHAT_DOMAIN', 'chat.dynime.com'),
    'ai_domain' => env('AI_DOMAIN', 'ai.dynime.com'),
    'main_domain' => env('MAIN_DOMAIN', 'dynime.com'),
];
