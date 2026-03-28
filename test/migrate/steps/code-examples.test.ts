import { describe, it, expect } from 'vitest';
import {
  normalizeAlgorithm,
  getCodeExample,
  formatCodeExample,
  GENERIC_GUIDANCE,
} from '../src/migrate/steps/code-examples.js';

describe('normalizeAlgorithm', () => {
  it('normalizes RSA variants to rsa', () => {
    expect(normalizeAlgorithm('RSA-2048')).toBe('rsa');
    expect(normalizeAlgorithm('RSA-4096')).toBe('rsa');
  });

  it('normalizes ECDSA and EdDSA variants to ecdsa', () => {
    expect(normalizeAlgorithm('ECDSA-P256')).toBe('ecdsa');
    expect(normalizeAlgorithm('Ed25519')).toBe('ecdsa');
  });

  it('normalizes ECDH and X25519 to ecdh', () => {
    expect(normalizeAlgorithm('ECDH-P256')).toBe('ecdh');
    expect(normalizeAlgorithm('X25519')).toBe('ecdh');
  });

  it('normalizes hash algorithms', () => {
    expect(normalizeAlgorithm('MD5')).toBe('md5');
    expect(normalizeAlgorithm('SHA-1')).toBe('sha1');
  });

  it('normalizes bare curve names to ecdsa', () => {
    expect(normalizeAlgorithm('P-256')).toBe('ecdsa');
    expect(normalizeAlgorithm('P-384')).toBe('ecdsa');
  });

  it('normalizes symmetric algorithms', () => {
    expect(normalizeAlgorithm('AES-128-GCM')).toBe('aes128');
    expect(normalizeAlgorithm('AES-192')).toBe('aes192');
    expect(normalizeAlgorithm('DES')).toBe('des');
    expect(normalizeAlgorithm('3DES')).toBe('des');
    expect(normalizeAlgorithm('RC4')).toBe('des');
  });
});

describe('getCodeExample', () => {
  it('returns JS RSA example for .ts file with RSA-2048', () => {
    const example = getCodeExample('RSA-2048', 'src/auth.ts');
    expect(example).not.toBeNull();
    expect(example!.before).toContain('generateKeyPairSync');
    expect(example!.after).toContain('ml_kem768');
    expect(example!.package).toBe('@noble/post-quantum');
  });

  it('returns Python MD5 example for .py file with MD5', () => {
    const example = getCodeExample('MD5', 'utils/hash.py');
    expect(example).not.toBeNull();
    expect(example!.before).toContain('hashlib.md5');
    expect(example!.after).toContain('sha3_256');
  });

  it('returns Go RSA example for .go file', () => {
    const example = getCodeExample('RSA-2048', 'main.go');
    expect(example).not.toBeNull();
    expect(example!.after).toContain('circl');
  });

  it('falls back from TypeScript to JavaScript examples', () => {
    const tsExample = getCodeExample('RSA-2048', 'auth.ts');
    const jsExample = getCodeExample('RSA-2048', 'auth.js');
    expect(tsExample).not.toBeNull();
    expect(tsExample!.after).toBe(jsExample!.after);
  });

  it('falls back from Kotlin to Java examples', () => {
    const ktExample = getCodeExample('RSA-2048', 'Auth.kt');
    const javaExample = getCodeExample('RSA-2048', 'Auth.java');
    expect(ktExample).not.toBeNull();
    expect(ktExample!.after).toBe(javaExample!.after);
  });

  it('uses algorithm fallback (sha1 falls back to md5 example)', () => {
    const example = getCodeExample('SHA-1', 'auth.js');
    expect(example).not.toBeNull();
    expect(example!.after).toContain('sha3-256');
  });

  it('returns null for completely unknown combo', () => {
    const example = getCodeExample('UNKNOWN-ALGO', 'file.unknown');
    expect(example).toBeNull();
  });
});

describe('formatCodeExample', () => {
  it('formats before and after sections', () => {
    const formatted = formatCodeExample({
      before: 'old_code()',
      after: 'new_code()',
      package: 'test-pkg',
    });
    expect(formatted).toContain('// Before:');
    expect(formatted).toContain('old_code()');
    expect(formatted).toContain('// After:');
    expect(formatted).toContain('new_code()');
  });
});

describe('GENERIC_GUIDANCE', () => {
  it('mentions NIST FIPS standards', () => {
    expect(GENERIC_GUIDANCE).toContain('NIST FIPS');
  });
});
