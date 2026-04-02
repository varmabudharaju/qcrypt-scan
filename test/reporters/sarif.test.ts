import { describe, it, expect } from 'vitest';
import { formatSarif } from '../src/reporters/sarif.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (): ScanReport => ({
  id: 'test-id',
  path: './test-project',
  scannedAt: '2026-04-02T00:00:00.000Z',
  filesScanned: 100,
  findings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
    },
    {
      file: 'src/hash.ts',
      line: 10,
      algorithm: 'MD5',
      category: 'hash',
      risk: 'WARNING',
      snippet: 'md5(data)',
      explanation: 'Broken classically',
      replacement: 'SHA-256',
    },
  ],
  enrichedFindings: [],
  summary: { critical: 1, warning: 1, info: 0, ok: 0 },
  grade: 'C',
  readiness: {
    overall: 50,
    dimensions: {
      vulnerability: { score: 60, weighted: 24, details: '' },
      priority: { score: 70, weighted: 17.5, details: '' },
      migration: { score: 0, weighted: 0, details: '' },
      agility: { score: 75, weighted: 11.25, details: '' },
    },
  },
});

describe('formatSarif', () => {
  it('produces valid SARIF 2.1.0 structure', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    expect(sarif.$schema).toContain('sarif');
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
  });

  it('includes tool metadata', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const tool = sarif.runs[0].tool.driver;
    expect(tool.name).toBe('qcrypt-scan');
    expect(tool.rules).toHaveLength(2);
  });

  it('maps findings to results with correct levels', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const results = sarif.runs[0].results;
    expect(results).toHaveLength(2);
    expect(results[0].level).toBe('error');
    expect(results[1].level).toBe('warning');
  });

  it('includes file locations with line numbers', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const loc = sarif.runs[0].results[0].locations[0].physicalLocation;
    expect(loc.artifactLocation.uri).toBe('src/auth.ts');
    expect(loc.region.startLine).toBe(42);
  });

  it('includes readiness score in properties', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const props = sarif.runs[0].properties;
    expect(props.readinessScore).toBe(50);
    expect(props.grade).toBe('C');
  });
});
