import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/api/server.js';
import { SAMPLE_SCAN_REPORT } from '../migrate/fixtures.js';

describe('E2E: Migrate API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/migrate with scanReport returns migration plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/migrate',
      payload: { scanReport: SAMPLE_SCAN_REPORT },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.summary.immediate).toBeGreaterThanOrEqual(0);
    expect(body.scanReport.id).toBe(SAMPLE_SCAN_REPORT.id);
  });

  it('GET /api/migrate/history returns past plans', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/migrate/history',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/migrate/:id returns a specific plan', async () => {
    // First create a plan
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/migrate',
      payload: { scanReport: SAMPLE_SCAN_REPORT },
    });
    const planId = createRes.json().id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/migrate/${planId}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(planId);
  });

  it('GET /api/migrate/:id returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/migrate/nonexistent',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('Not found');
  });
});
