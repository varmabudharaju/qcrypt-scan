import { performance } from 'node:perf_hooks';

export interface TimingResult {
  opsPerSecond: number;
  avgTimeMs: number;
}

const WARMUP_ITERATIONS = 10;

export function benchmark(fn: () => void, iterations: number): TimingResult {
  // Warm up — let V8 JIT compile the function
  for (let i = 0; i < WARMUP_ITERATIONS; i++) fn();

  // Timed run
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  return {
    opsPerSecond: Math.round((iterations / elapsed) * 1000),
    avgTimeMs: Number((elapsed / iterations).toFixed(4)),
  };
}
