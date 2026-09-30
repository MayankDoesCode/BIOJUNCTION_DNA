import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Minimal local backend plugin for AutoDock Vina verification & execution.
 * Handles /api/v1/docking/status and /api/v1/docking/execute.
 */
function vinaBackendPlugin(): Plugin {
  return {
    name: 'vina-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];

        // 1. GET /api/docking-status or /api/v1/docking/status
        if ((pathname === '/api/docking-status' || pathname === '/api/v1/docking/status') && req.method === 'GET') {
          try {
            const { vinaBackend } = await import('./server/vinaBackend');
            const status = vinaBackend.getStatus();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(status));
            return;
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ available: false, error: err.message }));
            return;
          }
        }

        // 2. POST /api/docking, /api/v1/docking/execute, or /api/v1/docking/run
        if (
          (pathname === '/api/docking' || pathname === '/api/v1/docking/execute' || pathname === '/api/v1/docking/run') &&
          req.method === 'POST'
        ) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              const { vinaBackend } = await import('./server/vinaBackend');
              const validation = vinaBackend.validatePayload(payload);
              if (!validation.isValid || !validation.validated) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, errorCode: 'INVALID_INPUT', message: validation.error }));
                return;
              }
              const result = await vinaBackend.executeDocking(validation.validated);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = result.success ? 200 : result.errorCode === 'ENGINE_UNAVAILABLE' ? 503 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, errorCode: 'EXECUTION_FAILED', message: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env
  const env = loadEnv(mode, process.cwd(), '');
  if (env.FASTAPI_VINA_EXECUTABLE) {
    process.env.FASTAPI_VINA_EXECUTABLE = env.FASTAPI_VINA_EXECUTABLE;
  }
  if (env.VINA_EXECUTABLE) {
    process.env.VINA_EXECUTABLE = env.VINA_EXECUTABLE;
  }

  return {
    plugins: [react(), vinaBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
