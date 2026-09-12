<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- Primary Meta Tags -->
        <title inertia>{{ config('app.name', 'Dynime AI') }} — Enterprise Intelligence & AI Workspace</title>
        <meta name="title" content="Dynime AI — Enterprise Intelligence & Workspace">
        <meta name="description" content="Dynime AI is an enterprise-grade AI workspace featuring multi-model orchestration (DComposer, Claude 3.7 Sonnet, DeepSeek R1, GPT-4o, Gemini 3.6 Flash), deep document analysis, dynamic project collaboration, and high-speed execution.">
        <meta name="keywords" content="Dynime AI, Enterprise AI, AI Workspace, DComposer, Multi-Model AI, Claude 3.7 Sonnet, DeepSeek R1, GPT-4o, Gemini Flash, AI Chat, Document Analysis, AI Projects">
        <meta name="author" content="Dynime Inc.">
        <meta name="robots" content="index, follow">
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

        <!-- Canonical URL -->
        <link rel="canonical" href="{{ url()->current() }}">

        <!-- Open Graph / Facebook / LinkedIn -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:site_name" content="Dynime AI">
        <meta property="og:title" content="Dynime AI — Enterprise Intelligence & Workspace">
        <meta property="og:description" content="Next-generation enterprise AI workspace with multi-model orchestration, deep document intelligence, and real-time project collaboration.">
        <meta property="og:image" content="{{ asset('images/dynime-ai-logo.png') }}">
        <meta property="og:image:alt" content="Dynime AI Enterprise Platform">

        <!-- Twitter Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:site" content="@DynimeAI">
        <meta name="twitter:creator" content="@DynimeAI">
        <meta name="twitter:title" content="Dynime AI — Enterprise Intelligence & Workspace">
        <meta name="twitter:description" content="Next-generation enterprise AI workspace with multi-model orchestration, deep document intelligence, and real-time project collaboration.">
        <meta name="twitter:image" content="{{ asset('images/dynime-ai-logo.png') }}">

        <!-- Theme Color & Mobile Web Experience -->
        <meta name="theme-color" content="#635bff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0c0c0f" media="(prefers-color-scheme: dark)">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Dynime AI">

        <!-- Official Dynime Favicons -->
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

        <!-- Theme Initialization: Default Light Mode -->
        <script>
            (function() {
                try {
                    const saved = localStorage.getItem('dynime_theme');
                    if (saved === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                } catch (e) {
                    document.documentElement.classList.remove('dark');
                }
            })();
        </script>

        <!-- Typography: Inter & Outfit -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        <!-- Scripts & Styles -->
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased h-full bg-white dark:bg-[#0c0c0f] text-neutral-900 dark:text-neutral-100 selection:bg-[#635bff] selection:text-white">
        @inertia
    </body>
</html>
