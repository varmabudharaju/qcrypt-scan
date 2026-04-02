import { describe, it, expect } from 'vitest';
import type {
  FindingContext,
  EnrichedFinding,
  DimensionScore,
  ReadinessScore,
  QcryptConfig,
} from '../src/types.js';

describe('new types', () => {
  it('EnrichedFinding extends Finding with context', () => {
    const enriched: EnrichedFinding = {
      file: 'src/auth.ts',
      line: 10,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
      context: {
        sensitivity: 'high',
        hndlRisk: false,
        isTestFile: false,
        migrationEffort: 'medium',
      },
    };
    expect(enriched.context.sensitivity).toBe('high');
    expect(enriched.risk).toBe('CRITICAL');
  });

  it('ReadinessScore has 4 dimensions', () => {
    const dim: DimensionScore = { score: 80, weighted: 32, details: 'test' };
    const readiness: ReadinessScore = {
      overall: 50,
      dimensions: {
        vulnerability: dim,
        priority: dim,
        migration: dim,
        agility: dim,
      },
    };
    expect(readiness.overall).toBe(50);
    expect(Object.keys(readiness.dimensions)).toHaveLength(4);
  });

  it('QcryptConfig has sensitivity overrides', () => {
    const config: QcryptConfig = {
      sensitivity: {
        high: ['src/payments/**'],
        low: ['src/legacy/**'],
        ignore: ['vendor/**'],
      },
    };
    expect(config.sensitivity?.high).toContain('src/payments/**');
  });
});
