import { describe, it, expect } from 'vitest';
import { getLanguagePatterns, scanContent } from '../src/rules/patterns.js';

describe('language patterns', () => {
  describe('getLanguagePatterns', () => {
    it('returns patterns for .py files', () => {
      const patterns = getLanguagePatterns('.py');
      expect(patterns).toBeDefined();
      expect(patterns!.patterns.length).toBeGreaterThan(0);
    });
    it('returns patterns for .js files', () => {
      const patterns = getLanguagePatterns('.js');
      expect(patterns).toBeDefined();
    });
    it('returns patterns for .ts files', () => {
      const patterns = getLanguagePatterns('.ts');
      expect(patterns).toBeDefined();
    });
    it('returns patterns for .go files', () => {
      const patterns = getLanguagePatterns('.go');
      expect(patterns).toBeDefined();
    });
    it('returns patterns for .rs files', () => {
      const patterns = getLanguagePatterns('.rs');
      expect(patterns).toBeDefined();
    });
    it('returns patterns for .java files', () => {
      const patterns = getLanguagePatterns('.java');
      expect(patterns).toBeDefined();
    });
    it('returns undefined for unsupported extensions', () => {
      const patterns = getLanguagePatterns('.txt');
      expect(patterns).toBeUndefined();
    });
  });

  describe('scanContent', () => {
    it('detects RSA in Python code', () => {
      const code = `from cryptography.hazmat.primitives.asymmetric import rsa\nkey = rsa.generate_private_key(public_exponent=65537, key_size=2048)`;
      const matches = scanContent(code, '.py');
      expect(matches.some((m) => m.algorithm === 'RSA')).toBe(true);
    });
    it('detects ECDSA in Python code', () => {
      const code = `from cryptography.hazmat.primitives.asymmetric import ec\nkey = ec.generate_private_key(ec.SECP256R1())`;
      const matches = scanContent(code, '.py');
      expect(matches.some((m) => m.algorithm === 'ECDSA')).toBe(true);
    });
    it('detects MD5 in Python code', () => {
      const code = `import hashlib\nh = hashlib.md5(b"data")`;
      const matches = scanContent(code, '.py');
      expect(matches.some((m) => m.algorithm === 'MD5')).toBe(true);
    });
    it('detects RSA in JavaScript code', () => {
      const code = `const { generateKeyPairSync } = require('crypto');\nconst { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });`;
      const matches = scanContent(code, '.js');
      expect(matches.some((m) => m.algorithm === 'RSA')).toBe(true);
    });
    it('detects RSA in Go code', () => {
      const code = `import "crypto/rsa"\nkey, err := rsa.GenerateKey(rand.Reader, 2048)`;
      const matches = scanContent(code, '.go');
      expect(matches.some((m) => m.algorithm === 'RSA')).toBe(true);
    });
    it('detects RSA in Rust code', () => {
      const code = `use rsa::{RsaPrivateKey, RsaPublicKey};\nlet private_key = RsaPrivateKey::new(&mut rng, 2048)?;`;
      const matches = scanContent(code, '.rs');
      expect(matches.some((m) => m.algorithm === 'RSA')).toBe(true);
    });
    it('detects RSA in Java code', () => {
      const code = `KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");\nkpg.initialize(2048);`;
      const matches = scanContent(code, '.java');
      expect(matches.some((m) => m.algorithm === 'RSA')).toBe(true);
    });
    it('detects DES in Java code', () => {
      const code = `Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");`;
      const matches = scanContent(code, '.java');
      expect(matches.some((m) => m.algorithm === 'DES')).toBe(true);
    });
    it('returns correct line numbers', () => {
      const code = `line one\nline two\nimport hashlib\nh = hashlib.md5(b"data")`;
      const matches = scanContent(code, '.py');
      const md5 = matches.find((m) => m.algorithm === 'MD5');
      expect(md5).toBeDefined();
      expect(md5!.line).toBe(4);
    });
    it('returns empty for unsupported extensions', () => {
      const matches = scanContent('RSA key here', '.txt');
      expect(matches).toEqual([]);
    });
  });
});
