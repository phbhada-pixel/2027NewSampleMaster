import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      application: 'PHC Bhada Sample Master & Laboratory Reporting System',
      organization: 'Primary Health Centre Bhada, Taluka Ausa, Dist. Latur',
      department: 'Public Health Department, Government of Maharashtra',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PHC Bhada] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[PHC Bhada] Failed to start server:', err);
  process.exit(1);
});
