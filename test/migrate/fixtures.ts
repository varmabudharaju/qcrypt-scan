import type { Finding, ScanReport } from '../src/migrate/types.js';

export const CRITICAL_RSA_FINDING: Finding = {
  file: 'src/auth.ts',
  line: 15,
  algorithm: 'RSA-2048',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: "crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })",
  explanation: "RSA-2048 is vulnerable to Shor's algorithm",
  replacement: 'ML-KEM-768',
};

export const CRITICAL_ECDSA_FINDING: Finding = {
  file: 'src/auth.ts',
  line: 42,
  algorithm: 'ECDSA-P256',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: "crypto.sign('sha256', data, ecPrivateKey)",
  explanation: "ECDSA is vulnerable to Shor's algorithm",
  replacement: 'ML-DSA-65',
};

export const WARNING_MD5_FINDING: Finding = {
  file: 'src/utils/hash.py',
  line: 8,
  algorithm: 'MD5',
  category: 'hash',
  risk: 'WARNING',
  snippet: 'hashlib.md5(data)',
  explanation: "MD5 weakened by Grover's algorithm",
  replacement: 'SHA3-256',
};

export const WARNING_AES128_FINDING: Finding = {
  file: 'src/config.ts',
  line: 23,
  algorithm: 'AES-128-GCM',
  category: 'symmetric',
  risk: 'WARNING',
  snippet: "crypto.createCipheriv('aes-128-gcm', key16, iv)",
  explanation: "AES-128 security halved by Grover's algorithm",
  replacement: 'AES-256-GCM',
};

export const INFO_AES192_FINDING: Finding = {
  file: 'src/legacy.go',
  line: 5,
  algorithm: 'AES-192',
  category: 'symmetric',
  risk: 'INFO',
  snippet: 'aes.NewCipher(key24)',
  explanation: 'AES-192 has reduced security margin',
  replacement: 'AES-256',
};

export const OK_AES256_FINDING: Finding = {
  file: 'src/modern.ts',
  line: 10,
  algorithm: 'AES-256-GCM',
  category: 'symmetric',
  risk: 'OK',
  snippet: "crypto.createCipheriv('aes-256-gcm', key32, iv)",
  explanation: 'AES-256 is quantum-resistant',
  replacement: 'No change needed',
};

export const WARNING_TLS10_FINDING: Finding = {
  file: 'src/server.ts',
  line: 30,
  algorithm: 'TLS 1.0',
  category: 'protocol',
  risk: 'WARNING',
  snippet: "tls.createServer({ minVersion: 'TLSv1' })",
  explanation: 'TLS 1.0 is deprecated and has known vulnerabilities',
  replacement: 'TLS 1.3',
};

export const SAMPLE_FINDINGS: Finding[] = [
  CRITICAL_RSA_FINDING,
  CRITICAL_ECDSA_FINDING,
  WARNING_MD5_FINDING,
  WARNING_AES128_FINDING,
  INFO_AES192_FINDING,
  OK_AES256_FINDING,
];

export const SAMPLE_SCAN_REPORT: ScanReport = {
  id: 'test-scan-001',
  path: '/tmp/test-project',
  scannedAt: '2026-03-27T12:00:00.000Z',
  filesScanned: 10,
  findings: SAMPLE_FINDINGS,
  summary: { critical: 2, warning: 2, info: 1, ok: 1 },
  grade: 'C',
};
