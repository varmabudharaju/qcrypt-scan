import { describe, it, expect } from 'vitest';
import { scanSourceFile } from '../src/scanners/source-code.js';

describe('source code scanner', () => {
  it('detects RSA in Python file', () => {
    const findings = scanSourceFile(
      'test/fixtures/vulnerable/crypto_usage.py',
      `from cryptography.hazmat.primitives.asymmetric import rsa\nkey = rsa.generate_private_key(public_exponent=65537, key_size=2048)`
    );
    expect(findings.some((f) => f.algorithm === 'RSA' && f.risk === 'CRITICAL')).toBe(true);
    expect(findings[0].explanation.length).toBeGreaterThan(0);
    expect(findings[0].replacement.length).toBeGreaterThan(0);
  });

  it('detects MD5 in JavaScript file', () => {
    const findings = scanSourceFile(
      'test/fixtures/vulnerable/crypto_usage.js',
      `const hash = crypto.createHash('md5');`
    );
    expect(findings.some((f) => f.algorithm === 'MD5' && f.risk === 'WARNING')).toBe(true);
  });

  it('returns empty for unsupported file types', () => {
    const findings = scanSourceFile('README.md', 'RSA key here');
    expect(findings).toEqual([]);
  });

  it('includes correct file path in findings', () => {
    const findings = scanSourceFile(
      'src/auth.py',
      `import hashlib\nh = hashlib.md5(b"data")`
    );
    expect(findings.every((f) => f.file === 'src/auth.py')).toBe(true);
  });

  it('includes correct line numbers', () => {
    const findings = scanSourceFile(
      'app.py',
      `# comment\nimport hashlib\nh = hashlib.md5(b"data")`
    );
    const md5 = findings.find((f) => f.algorithm === 'MD5');
    expect(md5).toBeDefined();
    expect(md5!.line).toBe(3);
  });
});
