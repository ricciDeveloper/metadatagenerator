import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Vite plugin to mount Express API in dev mode
function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url.startsWith('/api')) {
          const { default: app } = await import('./src/presentation/api/app.ts');
          app(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), react(), expressApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts', 'src/**/*.spec.ts'],
  },
});
