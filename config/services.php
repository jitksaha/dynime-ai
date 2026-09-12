<?php

return [
    'dynime_sso' => [
        'client_id' => env('DYNIME_SSO_CLIENT_ID', 'dynime_ai_app'),
        'client_secret' => env('DYNIME_SSO_CLIENT_SECRET', 'dynime_ai_secret_key_2026'),
        'account_url' => env('DYNIME_SSO_ACCOUNT_URL', 'https://account.dynime.com'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'https://account.dynime.com/auth/google/callback'),
        'active' => env('GOOGLE_ENABLE', true),
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URI', 'https://account.dynime.com/auth/facebook/callback'),
        'active' => env('FACEBOOK_ENABLE', true),
    ],

    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI', 'https://account.dynime.com/auth/github/callback'),
        'active' => env('GITHUB_ENABLE', true),
    ],
];
