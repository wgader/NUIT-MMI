import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true
    },
    // Ensure public directory is served at root
    publicDir: 'public'
});
