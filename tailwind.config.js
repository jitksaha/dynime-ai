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
            borderRadius: {
                lg: '0.625rem',
                md: '0.5rem',
                sm: '0.375rem',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
};
