import type { Finding } from '../types.js';
import { getAlgorithmRule } from '../rules/algorithms.js';
import { getExplanation } from '../education/explanations.js';

interface CertPattern {
  regex: RegExp;
  algorithm: string;
}

const certPatterns: CertPattern[] = [
  { regex: /-----BEGIN RSA PRIVATE KEY-----/, algorithm: 'RSA' },
  { regex: /-----BEGIN RSA PUBLIC KEY-----/, algorithm: 'RSA' },
  { regex: /-----BEGIN EC PRIVATE KEY-----/, algorithm: 'ECDSA' },
  { regex: /-----BEGIN EC PUBLIC KEY-----/, algorithm: 'ECDSA' },
  { regex: /-----BEGIN DSA PRIVATE KEY-----/, algorithm: 'DSA' },
  { regex: /MA0GCSqGSIb3DQEBAQUAA/, algorithm: 'RSA' },
  { regex: /MAoGCCqGSM49BAM/, algorithm: 'ECDSA' },
  { regex: /sha1WithRSAEncryption/i, algorithm: 'RSA' },
  { regex: /sha256WithRSAEncryption/i, algorithm: 'RSA' },
  { regex: /ecdsa-with-SHA/i, algorithm: 'ECDSA' },
];

export function scanCertificateFile(filePath: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of certPatterns) {
      if (pattern.regex.test(line) && !seen.has(pattern.algorithm)) {
        seen.add(pattern.algorithm);
        const rule = getAlgorithmRule(pattern.algorithm);
        if (!rule) continue;
        const education = getExplanation(pattern.algorithm);
        findings.push({
          file: filePath,
          line: i + 1,
          algorithm: pattern.algorithm,
          category: rule.category,
          risk: rule.risk,
          snippet: line.trim(),
          explanation: education.explanation,
          replacement: education.replacement,
        });
      }
    }
  }

  return findings;
}
