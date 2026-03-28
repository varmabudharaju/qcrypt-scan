import { describe, it, expect } from 'vitest';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT, OK_AES256_FINDING } from './fixtures.js';
import type { ScanReport } from '../src/migrate/types.js';

describe('generateMigrationPlan', () => {
  it('generates a plan from a scan report', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.id).toBeTruthy();
    expect(plan.generatedAt).toBeTruthy();
    expect(plan.scanReport).toBe(SAMPLE_SCAN_REPORT);
  });

  it('filters out OK findings (no migration needed)', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    const algorithms = plan.steps.map((s) => s.finding.algorithm);
    expect(algorithms).not.toContain('AES-256-GCM');
  });

  it('includes steps for CRITICAL, WARNING, and INFO findings', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    // SAMPLE_SCAN_REPORT has: 2 CRITICAL, 2 WARNING, 1 INFO, 1 OK → 5 steps
    expect(plan.steps.length).toBe(5);
  });

  it('calculates summary counts correctly', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.summary.immediate).toBe(2);
    expect(plan.summary.shortTerm).toBe(2);
    expect(plan.summary.longTerm).toBe(1);
  });

  it('calculates estimated effort string', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.estimatedEffort).toContain('5 changes');
    expect(plan.estimatedEffort).toContain('files');
  });

  it('handles empty findings', () => {
    const emptyReport: ScanReport = {
      ...SAMPLE_SCAN_REPORT,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0, ok: 0 },
      grade: 'A',
    };
    const plan = generateMigrationPlan(emptyReport);
    expect(plan.steps).toEqual([]);
    expect(plan.summary).toEqual({ immediate: 0, shortTerm: 0, longTerm: 0 });
    expect(plan.estimatedEffort).toBe('0 changes across 0 files');
  });

  it('handles report with only OK findings', () => {
    const okReport: ScanReport = {
      ...SAMPLE_SCAN_REPORT,
      findings: [OK_AES256_FINDING],
      summary: { critical: 0, warning: 0, info: 0, ok: 1 },
    };
    const plan = generateMigrationPlan(okReport);
    expect(plan.steps).toEqual([]);
  });
});
