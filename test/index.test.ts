import { describe, it, expect } from 'vitest';
import { scan, gradeFromScore } from '../src/index.js';

describe('gradeFromScore', () => {
  it('returns A for 90+', () => {
    expect(gradeFromScore(95)).toBe('A');
    expect(gradeFromScore(90)).toBe('A');
  });
  it('returns B for 70-89', () => {
    expect(gradeFromScore(85)).toBe('B');
    expect(gradeFromScore(70)).toBe('B');
  });
  it('returns C for 50-69', () => {
    expect(gradeFromScore(55)).toBe('C');
    expect(gradeFromScore(50)).toBe('C');
  });
  it('returns D for 30-49', () => {
    expect(gradeFromScore(40)).toBe('D');
    expect(gradeFromScore(30)).toBe('D');
  });
  it('returns F for 0-29', () => {
    expect(gradeFromScore(20)).toBe('F');
    expect(gradeFromScore(0)).toBe('F');
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

  it('includes readiness score in scan report', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.readiness).toBeDefined();
    expect(report.readiness.overall).toBeGreaterThanOrEqual(0);
    expect(report.readiness.overall).toBeLessThanOrEqual(100);
    expect(report.readiness.dimensions.vulnerability).toBeDefined();
    expect(report.readiness.dimensions.priority).toBeDefined();
    expect(report.readiness.dimensions.migration).toBeDefined();
    expect(report.readiness.dimensions.agility).toBeDefined();
  });

  it('includes enriched findings', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.enrichedFindings).toBeDefined();
    expect(report.enrichedFindings.length).toBe(report.findings.length);
    for (const ef of report.enrichedFindings) {
      expect(ef.context).toBeDefined();
      expect(ef.context.sensitivity).toBeDefined();
      expect(typeof ef.context.hndlRisk).toBe('boolean');
      expect(typeof ef.context.isTestFile).toBe('boolean');
      expect(ef.context.migrationEffort).toBeDefined();
    }
  });

  it('derives grade from readiness score', async () => {
    const report = await scan('test/fixtures/vulnerable');
    if (report.readiness.overall >= 90) expect(report.grade).toBe('A');
    else if (report.readiness.overall >= 70) expect(report.grade).toBe('B');
    else if (report.readiness.overall >= 50) expect(report.grade).toBe('C');
    else if (report.readiness.overall >= 30) expect(report.grade).toBe('D');
    else expect(report.grade).toBe('F');
  });
});
