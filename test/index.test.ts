import { describe, it, expect } from 'vitest';
import { runBenchmarks } from '../src/index.js';
import type { BenchmarkReport, BenchmarkCategory } from '../src/types.js';

describe('runBenchmarks', () => {
  it('returns a complete BenchmarkReport with all fields', () => {
    const report = runBenchmarks({ iterations: 5, category: 'all' });

    expect(report.id).toBeTruthy();
    expect(report.runAt).toBeTruthy();
    expect(report.platform.os).toBeTruthy();
    expect(report.platform.arch).toBeTruthy();
    expect(report.platform.node).toBeTruthy();
    expect(report.platform.cpuModel).toBeTruthy();
    expect(report.iterations).toBe(5);
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.profiles.length).toBeGreaterThan(0);
    expect(report.comparisons.length).toBeGreaterThan(0);
  });

  it('includes both local and reference results when category is all', () => {
    const report = runBenchmarks({ iterations: 5, category: 'all' });

    const local = report.results.filter((r) => !r.isReference);
    const reference = report.results.filter((r) => r.isReference);

    expect(local.length).toBeGreaterThan(0);
    expect(reference.length).toBeGreaterThan(0);
  });

  it('filters to kex category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'kex' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('keygen');
    // Should not have hash or encrypt operations from other categories
    expect(operations).not.toContain('hash');
  });

  it('filters to sigs category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'sigs' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('sign');
    expect(operations).toContain('verify');
  });

  it('filters to sym category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'sym' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('encrypt');
    expect(operations).toContain('decrypt');
  });

  it('filters to hash category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'hash' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('hash');
    expect(operations).not.toContain('keygen');
  });

  it('generates unique IDs for each run', () => {
    const report1 = runBenchmarks({ iterations: 5, category: 'hash' });
    const report2 = runBenchmarks({ iterations: 5, category: 'hash' });
    expect(report1.id).not.toBe(report2.id);
  });
});
