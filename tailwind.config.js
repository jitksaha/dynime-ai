/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#635bff',
                    50: '#eef1ff',
                    100: '#e2fdff',
                    200: '#bfd7ff',
                    300: '#9bb1ff',
                    400: '#788bff',
                    500: '#635bff',
                    600: '#5465ff',
                    700: '#434ee0',
                    800: '#343da8',
                    900: '#262c75',
                },
                'electric-sapphire': '#5465ff',
                'cornflower-blue': '#788bff',
                'baby-blue-ice': '#9bb1ff',
                periwinkle: '#bfd7ff',
                'light-cyan': '#e2fdff',
                'bright-snow': '#f8f9fa',
                platinum: '#e9ecef',
                'alabaster-grey': '#dee2e6',
                'pale-slate': '#ced4da',
                'pale-slate-2': '#adb5bd',
                'slate-grey': '#6c757d',
                'iron-grey': '#495057',
                gunmetal: '#343a40',
                'carbon-black': '#212529',
            },
            borderRadius: {
                lg: '0.625rem',
                md: '0.5rem',
                sm: '0.375rem',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
