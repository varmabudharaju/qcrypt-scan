import type { BenchmarkReport } from '../types.js';

export function formatJson(report: BenchmarkReport): string {
  return JSON.stringify(report, null, 2);
}
