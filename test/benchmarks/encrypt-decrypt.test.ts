import { describe, it, expect } from 'vitest';
import { getEncryptDecryptBenchmarks } from '../src/benchmarks/encrypt-decrypt.js';

describe('encrypt/decrypt benchmarks', () => {
  it('returns results for AES-128-GCM and AES-256-GCM', () => {
    const results = getEncryptDecryptBenchmarks(10);
    const keys = results.map((r) => `${r.algorithm}:${r.operation}`);

    expect(keys).toContain('AES-128-GCM:encrypt');
    expect(keys).toContain('AES-128-GCM:decrypt');
    expect(keys).toContain('AES-256-GCM:encrypt');
    expect(keys).toContain('AES-256-GCM:decrypt');
  });

  it('all results are local and not quantum safe', () => {
    const results = getEncryptDecryptBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getEncryptDecryptBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
