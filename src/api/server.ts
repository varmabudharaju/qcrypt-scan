import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { runBenchmarks } from '../index.js';
import { getPqcReferenceResults, getPqcProfiles } from '../reference/pqc-data.js';
import type { BenchmarkCategory, BenchmarkReport } from '../types.js';
import { generateMigrationPlan } from '../migrate/index.js';
import type { MigrationPlan, ScanReport } from '../migrate/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const history: BenchmarkReport[] = [];

  // CORS for development
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.post<{ Body: { iterations?: number; category?: string } }>(
    '/api/bench',
    async (request) => {
      const iterations = request.body?.iterations ?? 1000;
      const category = (request.body?.category ?? 'all') as BenchmarkCategory;

      const report = runBenchmarks({ iterations, category });
      history.unshift(report);
      return report;
    },
  );

  app.get('/api/bench/history', async () => history);

  app.get<{ Params: { id: string } }>('/api/bench/:id', async (request, reply) => {
    const report = history.find((r) => r.id === request.params.id);
    if (!report) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return report;
  });

  app.get('/api/reference', async () => ({
    results: getPqcReferenceResults(),
    profiles: getPqcProfiles(),
  }));

  // ── Migrate routes ──

  const migrateHistory: MigrationPlan[] = [];

  app.post<{ Body: { path?: string; scanReport?: ScanReport } }>(
    '/api/migrate',
    async (request) => {
      let scanReport = request.body?.scanReport;

      if (!scanReport && request.body?.path) {
        const { runScan } = await import('../migrate/scan-runner.js');
        scanReport = await runScan(request.body.path);
      }

      if (!scanReport) {
        const { runScan } = await import('../migrate/scan-runner.js');
        scanReport = await runScan('.');
      }

      const plan = generateMigrationPlan(scanReport);
      migrateHistory.unshift(plan);
      return plan;
    },
  );

  app.get('/api/migrate/history', async () => migrateHistory);

  app.get<{ Params: { id: string } }>('/api/migrate/:id', async (request, reply) => {
    const plan = migrateHistory.find((p) => p.id === request.params.id);
    if (!plan) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return plan;
  });

  // ── Browse routes ──

  app.get<{ Querystring: { path?: string } }>('/api/browse', async (request, reply) => {
    const targetPath = path.resolve(request.query.path || '.');
    try {
      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        reply.code(400);
        return { error: 'Not a directory' };
      }
      const entries = fs.readdirSync(targetPath, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
        .map((e) => e.name)
        .sort();
      return {
        path: targetPath,
        parent: path.dirname(targetPath),
        entries,
      };
    } catch {
      reply.code(400);
      return { error: `Cannot read directory: ${targetPath}` };
    }
  });

  // Serve web UI static files if built
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
    });

    // SPA fallback — serve index.html for non-API routes
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.code(404);
        return { error: 'Not found' };
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
