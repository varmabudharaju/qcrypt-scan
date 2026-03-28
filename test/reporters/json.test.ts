import { describe, it, expect } from 'vitest';
import { formatJson } from '../src/reporters/json.js';
import type { BenchmarkReport } from '../src/types.js';

describe('JSON reporter', () => {
  const report: BenchmarkReport = {
    id: 'test-123',
    runAt: '2026-03-27T00:00:00Z',
    platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
    iterations: 1000,
    results: [
      {
        algorithm: 'RSA-2048', operation: 'keygen',
        opsPerSecond: 500, avgTimeMs: 2.0,
        iterations: 1000, isReference: false, quantumSafe: false,
      },
    ],
    profiles: [],
    comparisons: [
      {
        classical: 'RSA-2048', postQuantum: 'ML-KEM-768',
        speedup: 'fast', sizeTradeoff: 'bigger', explanation: 'test',
      },
    ],
  };

  it('returns valid JSON string', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed).toBeDefined();
  });

  it('preserves all report fields', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe('test-123');
    expect(parsed.results).toHaveLength(1);
    expect(parsed.comparisons).toHaveLength(1);
    expect(parsed.platform.os).toBe('darwin');
  });

  it('is pretty-printed with 2-space indent', () => {
    const output = formatJson(report);
    expect(output).toContain('\n');
    expect(output).toContain('  "id"');
  });
});
