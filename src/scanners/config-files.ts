import type { Finding } from '../types.js';
import { getExplanation } from '../education/explanations.js';

interface ConfigPattern {
  regex: RegExp;
  algorithm: string;
  risk: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'protocol' | 'symmetric' | 'asymmetric';
}

const configPatterns: ConfigPattern[] = [
  { regex: /\bTLSv1(?:\.0)?\b(?!\.)/i, algorithm: 'TLS 1.0', risk: 'CRITICAL', category: 'protocol' },
  { regex: /\bTLSv1\.1\b/i, algorithm: 'TLS 1.1', risk: 'CRITICAL', category: 'protocol' },
  { regex: /\bSSLv[23]\b/i, algorithm: 'SSLv2/v3', risk: 'CRITICAL', category: 'protocol' },
  { regex: /\bRC4\b/i, algorithm: 'RC4', risk: 'WARNING', category: 'symmetric' },
  { regex: /\bDES-CBC\b/i, algorithm: 'DES', risk: 'WARNING', category: 'symmetric' },
  { regex: /\b3DES\b|\bDES-CBC3\b|\bDES-EDE3\b/i, algorithm: '3DES', risk: 'WARNING', category: 'symmetric' },
  { regex: /\baes128\b/i, algorithm: 'AES-128', risk: 'WARNING', category: 'symmetric' },
  { regex: /\bssh-rsa\b/, algorithm: 'RSA', risk: 'CRITICAL', category: 'asymmetric' },
  { regex: /\bssh-dss\b/, algorithm: 'DSA', risk: 'CRITICAL', category: 'asymmetric' },
  { regex: /\b3des-cbc\b/, algorithm: '3DES', risk: 'WARNING', category: 'symmetric' },
];

const protocolExplanations: Record<string, { explanation: string; replacement: string }> = {
  'TLS 1.0': {
    explanation: 'TLS 1.0 is deprecated (RFC 8996). It uses cipher suites vulnerable both classically and to quantum attacks. POODLE and BEAST attacks exist.',
    replacement: 'Upgrade to TLS 1.3, which supports modern cipher suites and will be easier to extend with post-quantum key exchange.',
  },
  'TLS 1.1': {
    explanation: 'TLS 1.1 is deprecated (RFC 8996). It does not support modern AEAD ciphers and uses key exchange methods broken by quantum computers.',
    replacement: 'Upgrade to TLS 1.3.',
  },
  'SSLv2/v3': {
    explanation: 'SSL 2.0/3.0 are completely broken with multiple practical attacks (DROWN, POODLE). Quantum attacks are irrelevant — these should not be used at all.',
    replacement: 'Upgrade to TLS 1.3.',
  },
};

export function scanConfigFile(filePath: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of configPatterns) {
      if (pattern.regex.test(line)) {
        const key = `${pattern.algorithm}:${i + 1}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const protoExp = protocolExplanations[pattern.algorithm];
        const education = protoExp ?? getExplanation(pattern.algorithm);

        findings.push({
          file: filePath,
          line: i + 1,
          algorithm: pattern.algorithm,
          category: pattern.category,
          risk: pattern.risk,
          snippet: line.trim(),
          explanation: education.explanation,
          replacement: education.replacement,
        });
      }
    }
  }

  return findings;
}
