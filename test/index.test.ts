import { describe, it, expect } from 'vitest';
import { scan, computeGrade } from '../src/index.js';

describe('computeGrade', () => {
  it('returns A for no critical or warning', () => {
    expect(computeGrade(0, 0)).toBe('A');
  });
  it('returns B for no critical, some warnings', () => {
    expect(computeGrade(0, 3)).toBe('B');
  });
  it('returns C for 1-3 critical', () => {
    expect(computeGrade(2, 0)).toBe('C');
  });
  it('returns D for 4-10 critical', () => {
    expect(computeGrade(7, 0)).toBe('D');
  });
  it('returns F for 10+ critical', () => {
    expect(computeGrade(15, 0)).toBe('F');
  });
});

describe('scan', () => {
  it('returns a valid ScanReport structure', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.path).toBe('test/fixtures/vulnerable');
    expect(report.scannedAt).toBeDefined();
    expect(report.filesScanned).toBeGreaterThan(0);
    expect(Array.isArray(report.findings)).toBe(true);
    expect(report.summary).toHaveProperty('critical');
    expect(report.summary).toHaveProperty('warning');
    expect(report.summary).toHaveProperty('info');
    expect(report.summary).toHaveProperty('ok');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade);
  });
});
