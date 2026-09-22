import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';

function expressApiPlugin(): Plugin {
  return {
    name: 'phc-bhada-express-api',
    configureServer(server) {
      const app = express();
      app.use(express.json({ limit: '20mb' }));
      app.use(express.urlencoded({ extended: true, limit: '20mb' }));

      const uploadsPath = path.join(process.cwd(), 'uploads');
      app.use('/uploads', express.static(uploadsPath));

      app.get('/api/health', (_req, res) => {
        res.json({
          status: 'ok',
          organization: 'PHC Bhada (Govt. of Maharashtra)',
          timestamp: new Date().toISOString(),
        });
      });

      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
