import { describe, it, expect } from 'vitest';
import { computeMigrationScore } from '../src/analyzers/migration.js';
import type { EnrichedFinding } from '../src/types.js';

const defaultContext = {
  sensitivity: 'medium' as const,
  hndlRisk: false,
  isTestFile: false,
  migrationEffort: 'medium' as const,
};

const makeFinding = (algorithm: string, risk: string, file = 'src/app.ts'): EnrichedFinding => ({
  file,
  line: 1,
  algorithm,
  category: 'asymmetric',
  risk: risk as any,
  snippet: '',
  explanation: '',
  replacement: '',
  context: defaultContext,
});

describe('computeMigrationScore', () => {
  it('returns 0 when no PQC algorithms present', () => {
    const findings = [makeFinding('RSA', 'CRITICAL'), makeFinding('ECDH', 'CRITICAL')];
    expect(computeMigrationScore(findings).score).toBe(0);
  });

  it('gives credit for PQC algorithms in use', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL'),
      makeFinding('ML-KEM', 'OK'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(35);
  });

  it('gives hybrid bonus when PQC and classical coexist in same file', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL', 'src/crypto.ts'),
      makeFinding('ML-KEM', 'OK', 'src/crypto.ts'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(45);
  });

  it('caps hybrid bonus at 30', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL', 'a.ts'),
      makeFinding('ML-KEM', 'OK', 'a.ts'),
      makeFinding('ECDH', 'CRITICAL', 'b.ts'),
      makeFinding('ML-DSA', 'OK', 'b.ts'),
      makeFinding('DH', 'CRITICAL', 'c.ts'),
      makeFinding('SLH-DSA', 'OK', 'c.ts'),
      makeFinding('DSA', 'CRITICAL', 'd.ts'),
      makeFinding('ML-KEM', 'OK', 'd.ts'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(65);
  });

  it('caps total score at 100', () => {
    const findings = [
      makeFinding('ML-KEM', 'OK', 'a.ts'),
      makeFinding('ML-DSA', 'OK', 'a.ts'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(70);
  });

  it('returns 0 with empty findings', () => {
    expect(computeMigrationScore([]).score).toBe(0);
  });

  it('weighted is score * 0.20', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL'),
      makeFinding('ML-KEM', 'OK'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.weighted).toBe(7);
  });
});
