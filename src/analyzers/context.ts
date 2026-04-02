import type { Finding, EnrichedFinding, FindingContext } from '../types.js';

const HIGH_SENSITIVITY_DIRS = [
  '/auth/', '/tls/', '/ssl/', '/crypto/', '/security/',
  '/keys/', '/certs/', '/secrets/', '/payment/',
];

const LOW_SENSITIVITY_DIRS = [
  '/test/', '/tests/', '/__tests__/', '/spec/',
  '/mock/', '/mocks/', '/fixture/', '/fixtures/',
  '/example/', '/examples/', '/demo/', '/benchmark/', '/e2e/',
];

const TEST_FILE_PATTERNS = [
  /\/test\//, /\/tests\//, /\/__tests__\//,
  /\/spec\//, /\/mock\//, /\/mocks\//,
  /\/fixture\//, /\/fixtures\//,
  /\.test\.\w+$/, /\.spec\.\w+$/,
  /_test\.\w+$/, /_spec\.\w+$/,
];

const HNDL_ALGORITHMS = new Set(['ECDH', 'DH', 'X25519', 'RSA']);

const LOW_EFFORT_ALGORITHMS = new Set([
  'AES-128', 'AES-192', 'DES', '3DES', 'RC4', 'MD5', 'SHA-1',
]);

const MEDIUM_EFFORT_ALGORITHMS = new Set([
  'ECDSA', 'Ed25519', 'EdDSA', 'DSA', 'P-256', 'P-384', 'secp256k1',
]);

function classifySensitivity(filePath: string): 'high' | 'medium' | 'low' {
  const normalized = '/' + filePath.replace(/\\/g, '/');
  for (const dir of HIGH_SENSITIVITY_DIRS) {
    if (normalized.includes(dir)) return 'high';
  }
  for (const dir of LOW_SENSITIVITY_DIRS) {
    if (normalized.includes(dir)) return 'low';
  }
  return 'medium';
}

function isTestFile(filePath: string): boolean {
  const normalized = '/' + filePath.replace(/\\/g, '/');
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function classifyHndlRisk(algorithm: string): boolean {
  return HNDL_ALGORITHMS.has(algorithm);
}

function classifyMigrationEffort(algorithm: string, isHndl: boolean): 'low' | 'medium' | 'high' {
  if (LOW_EFFORT_ALGORITHMS.has(algorithm)) return 'low';
  if (isHndl) return 'high';
  if (MEDIUM_EFFORT_ALGORITHMS.has(algorithm)) return 'medium';
  return 'medium';
}

export function enrichFinding(finding: Finding): EnrichedFinding {
  const hndlRisk = classifyHndlRisk(finding.algorithm);
  const context: FindingContext = {
    sensitivity: classifySensitivity(finding.file),
    hndlRisk,
    isTestFile: isTestFile(finding.file),
    migrationEffort: classifyMigrationEffort(finding.algorithm, hndlRisk),
  };
  return { ...finding, context };
}

export function enrichFindings(findings: Finding[]): EnrichedFinding[] {
  return findings.map(enrichFinding);
}
