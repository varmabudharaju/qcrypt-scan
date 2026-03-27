import { describe, it, expect } from 'vitest';
import { scanConfigFile } from '../src/scanners/config-files.js';

describe('config file scanner', () => {
  it('detects TLS 1.0 in nginx config', () => {
    const config = `server {\n  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;\n}`;
    const findings = scanConfigFile('nginx.conf', config);
    expect(findings.some((f) => f.algorithm === 'TLS 1.0' || f.algorithm === 'TLS 1.1')).toBe(true);
  });

  it('detects weak ciphers in config', () => {
    const config = `ssl_ciphers RC4-SHA:DES-CBC3-SHA:AES128-SHA;`;
    const findings = scanConfigFile('nginx.conf', config);
    expect(findings.some((f) => f.risk === 'WARNING' || f.risk === 'CRITICAL')).toBe(true);
  });

  it('detects weak SSH config', () => {
    const config = `Ciphers aes128-cbc,3des-cbc\nHostKeyAlgorithms ssh-rsa,ssh-dss`;
    const findings = scanConfigFile('sshd_config', config);
    expect(findings.some((f) => f.risk === 'CRITICAL' || f.risk === 'WARNING')).toBe(true);
  });

  it('returns empty for clean config', () => {
    const config = `server {\n  ssl_protocols TLSv1.3;\n  ssl_ciphers AESGCM;\n}`;
    const findings = scanConfigFile('nginx.conf', config);
    expect(findings.length).toBe(0);
  });
});
