/// <reference types="vite/client" />
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from 'sonner';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

createInertiaApp({
    title: (title) => {
        if (!title || title.trim() === '') {
            return 'Dynime AI — Enterprise Intelligence & Workspace';
        }
        if (title.includes('Dynime AI')) {
            return title;
        }
        return `${title} | Dynime AI`;
    },
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <Toaster position="top-right" richColors />
            </>
        );
    },
    progress: {
        color: '#635bff',
    },
});
