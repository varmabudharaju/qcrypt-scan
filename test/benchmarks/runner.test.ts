import { describe, it, expect } from 'vitest';
import { benchmark } from '../../src/benchmarks/runner.js';

describe('benchmark runner', () => {
  it('returns opsPerSecond and avgTimeMs', () => {
    let counter = 0;
    const result = benchmark(() => { counter++; }, 100);

    expect(result).toHaveProperty('opsPerSecond');
    expect(result).toHaveProperty('avgTimeMs');
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.avgTimeMs).toBeGreaterThan(0);
  });

  it('runs the function the specified number of iterations', () => {
    let counter = 0;
    benchmark(() => { counter++; }, 50);

    // 10 warm-up + 50 timed = 60
    expect(counter).toBe(60);
  });

  it('faster function has higher opsPerSecond than slower function', () => {
    const fast = benchmark(() => { /* noop */ }, 100);

    const slow = benchmark(() => {
      // Busy work
      let sum = 0;
      for (let i = 0; i < 10000; i++) sum += i;
      return sum;
    }, 100);

    expect(fast.opsPerSecond).toBeGreaterThan(slow.opsPerSecond);
  });

  it('opsPerSecond and avgTimeMs are consistent', () => {
    const result = benchmark(() => {
      let sum = 0;
      for (let i = 0; i < 100; i++) sum += i;
    }, 200);

    // opsPerSecond ≈ 1000 / avgTimeMs (since avgTimeMs is per-op, ops/sec = 1000/avgMs)
    const expectedOps = Math.round(1000 / result.avgTimeMs);
    // Allow 10% tolerance due to rounding
    expect(Math.abs(result.opsPerSecond - expectedOps) / expectedOps).toBeLessThan(0.1);
  });
});
