import { describe, it, expect } from 'vitest';
import {
  mapRiskToPriority,
  estimateEffort,
  generateAction,
  generateMigrationStep,
} from '../src/migrate/steps/generator.js';
import {
  CRITICAL_RSA_FINDING,
  WARNING_MD5_FINDING,
  WARNING_AES128_FINDING,
  INFO_AES192_FINDING,
  OK_AES256_FINDING,
  WARNING_TLS10_FINDING,
} from '../fixtures.js';

describe('mapRiskToPriority', () => {
  it('maps CRITICAL to immediate', () => {
    expect(mapRiskToPriority('CRITICAL')).toBe('immediate');
  });

  it('maps WARNING to short-term', () => {
    expect(mapRiskToPriority('WARNING')).toBe('short-term');
  });

  it('maps INFO to long-term', () => {
    expect(mapRiskToPriority('INFO')).toBe('long-term');
  });

  it('returns null for OK', () => {
    expect(mapRiskToPriority('OK')).toBeNull();
  });
});

describe('estimateEffort', () => {
  it('returns high for asymmetric', () => {
    expect(estimateEffort(CRITICAL_RSA_FINDING)).toBe('high');
  });

  it('returns low for hash', () => {
    expect(estimateEffort(WARNING_MD5_FINDING)).toBe('low');
  });

  it('returns low for symmetric', () => {
    expect(estimateEffort(WARNING_AES128_FINDING)).toBe('low');
  });

  it('returns medium for protocol', () => {
    expect(estimateEffort(WARNING_TLS10_FINDING)).toBe('medium');
  });
});

describe('generateAction', () => {
  it('says Replace for asymmetric algorithms', () => {
    const action = generateAction(CRITICAL_RSA_FINDING);
    expect(action).toBe('Replace RSA-2048 with ML-KEM-768');
  });

  it('says Upgrade for non-critical symmetric algorithms', () => {
    const action = generateAction(WARNING_AES128_FINDING);
    expect(action).toBe('Upgrade AES-128-GCM to AES-256-GCM');
  });
});

describe('generateMigrationStep', () => {
  it('generates a complete step for a CRITICAL finding', () => {
    const step = generateMigrationStep(CRITICAL_RSA_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('immediate');
    expect(step!.effort).toBe('high');
    expect(step!.action).toContain('RSA-2048');
    expect(step!.codeExample).toContain('// Before:');
    expect(step!.dependencies).toContain('@noble/post-quantum');
    expect(step!.notes).toContain('Key formats change');
  });

  it('generates a step for a WARNING hash finding', () => {
    const step = generateMigrationStep(WARNING_MD5_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('short-term');
    expect(step!.effort).toBe('low');
    expect(step!.codeExample).toContain('sha3_256');
  });

  it('generates a step for an INFO finding', () => {
    const step = generateMigrationStep(INFO_AES192_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('long-term');
  });

  it('returns null for OK findings', () => {
    const step = generateMigrationStep(OK_AES256_FINDING);
    expect(step).toBeNull();
  });

  it('includes finding reference in the returned step', () => {
    const step = generateMigrationStep(CRITICAL_RSA_FINDING);
    expect(step!.finding).toBe(CRITICAL_RSA_FINDING);
  });

  it('generates a step for a WARNING protocol finding with medium effort', () => {
    const step = generateMigrationStep(WARNING_TLS10_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('short-term');
    expect(step!.effort).toBe('medium');
    expect(step!.notes).toContain('Protocol change');
  });
});
