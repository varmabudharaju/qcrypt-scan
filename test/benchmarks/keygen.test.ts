import { describe, it, expect } from 'vitest';
import { getKexKeygenBenchmarks, getSigKeygenBenchmarks } from '../src/benchmarks/keygen.js';

describe('keygen benchmarks', () => {
  describe('kex keygen', () => {
    it('returns results for key exchange algorithms only', () => {
      const results = getKexKeygenBenchmarks(10);
      const algorithms = results.map((r) => r.algorithm);

      expect(algorithms).toContain('RSA-2048');
      expect(algorithms).toContain('RSA-4096');
      expect(algorithms).toContain('ECDH-P256');
      expect(algorithms).toContain('X25519');
      expect(algorithms).not.toContain('ECDSA-P256');
      expect(algorithms).not.toContain('Ed25519');
    });

    it('all results have operation keygen and are not quantum safe', () => {
      const results = getKexKeygenBenchmarks(10);
      for (const r of results) {
        expect(r.operation).toBe('keygen');
        expect(r.isReference).toBe(false);
        expect(r.quantumSafe).toBe(false);
        expect(r.opsPerSecond).toBeGreaterThan(0);
      }
    });
  });

  describe('sig keygen', () => {
    it('returns results for signature algorithms only', () => {
      const results = getSigKeygenBenchmarks(10);
      const algorithms = results.map((r) => r.algorithm);

      expect(algorithms).toContain('RSA-2048');
      expect(algorithms).toContain('ECDSA-P256');
      expect(algorithms).toContain('Ed25519');
      expect(algorithms).not.toContain('RSA-4096');
      expect(algorithms).not.toContain('ECDH-P256');
      expect(algorithms).not.toContain('X25519');
    });

    it('all results have operation keygen and are not quantum safe', () => {
      const results = getSigKeygenBenchmarks(10);
      for (const r of results) {
        expect(r.operation).toBe('keygen');
        expect(r.isReference).toBe(false);
        expect(r.quantumSafe).toBe(false);
        expect(r.opsPerSecond).toBeGreaterThan(0);
      }
    });
  });
});
