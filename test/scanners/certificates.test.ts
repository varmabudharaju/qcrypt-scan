import { describe, it, expect } from 'vitest';
import { scanCertificateFile } from '../src/scanners/certificates.js';

const rsaCert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDMq2inYDfBQjANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
-----END CERTIFICATE-----`;

const ecCert = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALHLzNJKjhDsMAoGCCqGSM49BAMCMBQxEjAQBgNVBAMMCWxvY2Fs
-----END CERTIFICATE-----`;

describe('certificate scanner', () => {
  it('detects RSA in PEM certificate', () => {
    const findings = scanCertificateFile('server.crt', rsaCert);
    expect(findings.some((f) => f.algorithm === 'RSA' && f.risk === 'CRITICAL')).toBe(true);
  });

  it('detects EC in PEM certificate', () => {
    const findings = scanCertificateFile('server.crt', ecCert);
    expect(findings.some((f) => f.risk === 'CRITICAL')).toBe(true);
  });

  it('detects RSA private key headers', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\ndata\n-----END RSA PRIVATE KEY-----';
    const findings = scanCertificateFile('key.pem', pem);
    expect(findings.some((f) => f.algorithm === 'RSA')).toBe(true);
  });

  it('detects EC private key headers', () => {
    const pem = '-----BEGIN EC PRIVATE KEY-----\ndata\n-----END EC PRIVATE KEY-----';
    const findings = scanCertificateFile('key.pem', pem);
    expect(findings.some((f) => f.risk === 'CRITICAL')).toBe(true);
  });

  it('returns empty for non-certificate content', () => {
    const findings = scanCertificateFile('readme.txt', 'hello world');
    expect(findings).toEqual([]);
  });
});
