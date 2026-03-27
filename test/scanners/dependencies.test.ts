import { describe, it, expect } from 'vitest';
import { scanDependencyFile } from '../src/scanners/dependencies.js';

describe('dependency scanner', () => {
  it('detects node-forge in package.json', () => {
    const pkg = JSON.stringify({
      dependencies: { 'node-forge': '^1.0.0', express: '^4.0.0' },
    });
    const findings = scanDependencyFile('package.json', pkg);
    expect(findings.some((f) => f.algorithm === 'RSA')).toBe(true);
  });

  it('detects pycryptodome in requirements.txt', () => {
    const reqs = `flask==2.0.0\npycryptodome==3.15.0\nrequests==2.28.0`;
    const findings = scanDependencyFile('requirements.txt', reqs);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('detects crypto/rsa in go.mod imports', () => {
    const gomod = `module myapp\n\ngo 1.21\n\nrequire (\n\tgolang.org/x/crypto v0.14.0\n)`;
    const findings = scanDependencyFile('go.mod', gomod);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('returns empty for clean dependencies', () => {
    const pkg = JSON.stringify({
      dependencies: { express: '^4.0.0', lodash: '^4.17.0' },
    });
    const findings = scanDependencyFile('package.json', pkg);
    expect(findings.length).toBe(0);
  });
});
