import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    // Base path for GitHub Pages (relative paths)
    base: './',
    server: {
        host: true
    },
    // Ensure public directory is served at root
    publicDir: 'public',
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                game: 'game.html'
            }
        }
    }
});
