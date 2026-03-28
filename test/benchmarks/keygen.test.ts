import { describe, it, expect } from 'vitest';
import { getKeygenBenchmarks } from '../src/benchmarks/keygen.js';
import type { BenchmarkResult } from '../src/types.js';

describe('keygen benchmarks', () => {
  it('returns results for all key generation algorithms', () => {
    const results = getKeygenBenchmarks(10);
    const algorithms = results.map((r) => r.algorithm);

    expect(algorithms).toContain('RSA-2048');
    expect(algorithms).toContain('RSA-4096');
    expect(algorithms).toContain('ECDH-P256');
    expect(algorithms).toContain('X25519');
    expect(algorithms).toContain('ECDSA-P256');
    expect(algorithms).toContain('Ed25519');
  });

  it('all results have operation keygen', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.operation).toBe('keygen');
    }
  });

  it('all results are local benchmarks, not reference', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
    }
  });

  it('all results are marked not quantum safe', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
