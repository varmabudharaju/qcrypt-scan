import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { scan } from '../index.js';
import type { ScanReport } from '../types.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const scanStore: ScanReport[] = [];

export function createServer() {
  const app = Fastify({ logger: true });

  // CORS for development
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
      reply.send();
    }
  });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  app.post<{ Body: { path: string } }>('/api/scan', async (request, reply) => {
    const { path: targetPath } = request.body ?? {};

    if (!targetPath || typeof targetPath !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: path' });
    }

    try {
      const report = await scan(targetPath);
      scanStore.unshift(report);
      return report;
    } catch (err) {
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Scan failed',
      });
    }
  });

  app.get('/api/scans', async () => {
    return scanStore;
  });

  app.get<{ Params: { id: string } }>('/api/scans/:id', async (request, reply) => {
    const { id } = request.params;
    const found = scanStore.find((s) => s.id === id);
    if (!found) {
      return reply.status(404).send({ error: 'Scan not found' });
    }
    return found;
  });

  // Serve static files from web/dist/ if it exists
  const distPath = resolve(__dirname, '../../web/dist');
  if (existsSync(distPath)) {
    app.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
      wildcard: false,
    });

    // SPA fallback: serve index.html for non-API routes
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
