import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'forum-photo-module',
      transformIndexHtml: {
        order: 'pre',
        handler(html, context) {
          if (context.path !== '/forum.html') return html;
          return html.replace('</body>', '<script type="module" src="./src/forum-photos.js"></script></body>');
        }
      }
    }
  ],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        feed: fileURLToPath(new URL('./feed.html', import.meta.url)),
        forum: fileURLToPath(new URL('./forum.html', import.meta.url)),
        profile: fileURLToPath(new URL('./profile.html', import.meta.url)),
        routes: fileURLToPath(new URL('./routes.html', import.meta.url))
      }
    }
  }
});
