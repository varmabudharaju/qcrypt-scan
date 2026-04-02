import { describe, it, expect } from 'vitest';
import { enrichFinding } from '../src/analyzers/context.js';
import type { Finding } from '../src/types.js';

const makeFinding = (overrides: Partial<Finding>): Finding => ({
  file: 'src/app.ts',
  line: 10,
  algorithm: 'RSA',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: 'rsa.generateKey()',
  explanation: 'Broken by Shor',
  replacement: 'ML-KEM',
  ...overrides,
});

describe('enrichFinding', () => {
  describe('sensitivity', () => {
    it('marks auth/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/auth/session.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });
    it('marks tls/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'lib/tls/handshake.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });
    it('marks crypto/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/crypto/keys.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });
    it('marks security/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/security/encrypt.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });
    it('marks payment/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/payment/checkout.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });
    it('marks test/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'test/helpers/crypto.test.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });
    it('marks __tests__/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'src/__tests__/util.test.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });
    it('marks fixture/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'test/fixtures/keys.pem' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });
    it('marks example/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'examples/demo.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });
    it('marks other paths as medium sensitivity', () => {
      const f = makeFinding({ file: 'src/utils/helper.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('medium');
    });
  });

  describe('hndlRisk', () => {
    it('flags ECDH as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'ECDH' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });
    it('flags DH as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'DH' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });
    it('flags X25519 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'X25519' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });
    it('flags RSA (asymmetric) as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'RSA', category: 'asymmetric' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });
    it('does NOT flag ECDSA as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'ECDSA' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });
    it('does NOT flag Ed25519 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'Ed25519' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });
    it('does NOT flag AES-128 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'AES-128', category: 'symmetric' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });
  });

  describe('isTestFile', () => {
    it('detects test/ directory', () => {
      const f = makeFinding({ file: 'test/crypto.test.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });
    it('detects *.test.ts filename', () => {
      const f = makeFinding({ file: 'src/auth.test.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });
    it('detects *.spec.ts filename', () => {
      const f = makeFinding({ file: 'src/auth.spec.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });
    it('detects _test.go filename', () => {
      const f = makeFinding({ file: 'pkg/crypto_test.go' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });
    it('detects mock/ directory', () => {
      const f = makeFinding({ file: 'mocks/crypto.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });
    it('does not flag regular source files', () => {
      const f = makeFinding({ file: 'src/auth/session.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(false);
    });
  });

  describe('migrationEffort', () => {
    it('AES-128 is low effort', () => {
      const f = makeFinding({ algorithm: 'AES-128', category: 'symmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });
    it('MD5 is low effort', () => {
      const f = makeFinding({ algorithm: 'MD5', category: 'hash' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });
    it('SHA-1 is low effort', () => {
      const f = makeFinding({ algorithm: 'SHA-1', category: 'hash' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });
    it('RSA signing is high effort (HNDL)', () => {
      const f = makeFinding({ algorithm: 'RSA', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });
    it('ECDSA is medium effort', () => {
      const f = makeFinding({ algorithm: 'ECDSA', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('medium');
    });
    it('ECDH is high effort', () => {
      const f = makeFinding({ algorithm: 'ECDH', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });
    it('DH is high effort', () => {
      const f = makeFinding({ algorithm: 'DH', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });
    it('X25519 is high effort', () => {
      const f = makeFinding({ algorithm: 'X25519', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });
  });
});
