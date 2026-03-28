import { describe, it, expect } from 'vitest';
import type {
  Finding,
  ScanReport,
  MigrationStep,
  MigrationPlan,
  Priority,
  Effort,
} from '../src/migrate/types.js';

describe('migrate types', () => {
  it('Finding accepts valid data', () => {
    const finding: Finding = {
      file: 'src/auth.ts',
      line: 15,
      algorithm: 'RSA-2048',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: "generateKeyPairSync('rsa')",
      explanation: 'Vulnerable to quantum attack',
      replacement: 'ML-KEM-768',
    };
    expect(finding.algorithm).toBe('RSA-2048');
    expect(finding.risk).toBe('CRITICAL');
  });

  it('MigrationStep accepts valid data', () => {
    const step: MigrationStep = {
      finding: {
        file: 'src/auth.ts', line: 15, algorithm: 'RSA-2048', category: 'asymmetric',
        risk: 'CRITICAL', snippet: '', explanation: '', replacement: 'ML-KEM-768',
      },
      priority: 'immediate',
      action: 'Replace RSA-2048 with ML-KEM-768',
      codeExample: '// Before:\ncrypto.generateKeyPair("rsa")\n\n// After:\nml_kem768.keygen()',
      dependencies: ['@noble/post-quantum'],
      effort: 'high',
      notes: 'Key formats change.',
    };
    expect(step.priority).toBe('immediate');
    expect(step.effort).toBe('high');
  });

  it('MigrationPlan accepts valid data', () => {
    const plan: MigrationPlan = {
      id: 'test-plan-001',
      generatedAt: '2026-03-27T12:00:00Z',
      scanReport: {
        id: 'test-scan', path: '.', scannedAt: '', filesScanned: 1,
        findings: [], summary: { critical: 0, warning: 0, info: 0, ok: 0 }, grade: 'A',
      },
      steps: [],
      summary: { immediate: 0, shortTerm: 0, longTerm: 0 },
      estimatedEffort: '0 changes across 0 files',
    };
    expect(plan.steps).toEqual([]);
    expect(plan.summary.immediate).toBe(0);
  });

  it('Priority and Effort cover all values', () => {
    const priorities: Priority[] = ['immediate', 'short-term', 'long-term'];
    const efforts: Effort[] = ['low', 'medium', 'high'];
    expect(priorities).toHaveLength(3);
    expect(efforts).toHaveLength(3);
  });
});
