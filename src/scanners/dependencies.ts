import path from 'node:path';
import type { Finding } from '../types.js';
import { getAlgorithmRule } from '../rules/algorithms.js';
import { getExplanation } from '../education/explanations.js';

interface DepRule {
  name: RegExp;
  algorithms: string[];
  description: string;
}

const npmDepRules: DepRule[] = [
  { name: /^node-forge$/, algorithms: ['RSA', 'DES'], description: 'node-forge implements RSA and legacy ciphers' },
  { name: /^crypto-js$/, algorithms: ['DES', '3DES', 'MD5', 'SHA-1'], description: 'crypto-js includes legacy algorithms' },
  { name: /^jsrsasign$/, algorithms: ['RSA', 'ECDSA'], description: 'jsrsasign implements RSA and ECC signatures' },
  { name: /^elliptic$/, algorithms: ['ECDSA', 'ECDH'], description: 'elliptic implements ECC operations' },
  { name: /^tweetnacl$/, algorithms: ['Ed25519', 'X25519'], description: 'tweetnacl uses Curve25519-based crypto' },
  { name: /^secp256k1$/, algorithms: ['secp256k1'], description: 'secp256k1 implements the Bitcoin curve' },
];

const pipDepRules: DepRule[] = [
  { name: /^pycryptodome/, algorithms: ['RSA', 'DES', 'AES-128'], description: 'pycryptodome includes legacy crypto algorithms' },
  { name: /^rsa$/, algorithms: ['RSA'], description: 'rsa package implements RSA' },
  { name: /^ecdsa$/, algorithms: ['ECDSA'], description: 'ecdsa package implements ECDSA' },
  { name: /^pynacl$/, algorithms: ['Ed25519', 'X25519'], description: 'PyNaCl uses Curve25519-based crypto' },
];

const goDepRules: DepRule[] = [
  { name: /golang\.org\/x\/crypto/, algorithms: ['RSA', 'ECDSA', 'Ed25519'], description: 'x/crypto includes classical crypto implementations' },
];

function scanNpmDeps(filePath: string, content: string): Finding[] {
  try {
    const pkg = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    return matchDeps(filePath, Object.keys(allDeps), npmDepRules);
  } catch {
    return [];
  }
}

function scanPipDeps(filePath: string, content: string): Finding[] {
  const depNames = content
    .split('\n')
    .map((line) => line.split(/[=<>!~]/)[0].trim())
    .filter(Boolean);
  return matchDeps(filePath, depNames, pipDepRules);
}

function scanGoDeps(filePath: string, content: string): Finding[] {
  return matchDeps(filePath, [content], goDepRules);
}

function matchDeps(filePath: string, depNames: string[], rules: DepRule[]): Finding[] {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const matched = depNames.some((name) => rule.name.test(name));
    if (!matched) continue;

    for (const algoId of rule.algorithms) {
      const algo = getAlgorithmRule(algoId);
      if (!algo || algo.risk === 'OK') continue;

      const education = getExplanation(algoId);
      findings.push({
        file: filePath,
        line: 1,
        algorithm: algoId,
        category: algo.category,
        risk: algo.risk,
        snippet: `Dependency includes ${algoId} via ${rule.description}`,
        explanation: education.explanation,
        replacement: education.replacement,
      });
    }
  }

  return findings;
}

export function scanDependencyFile(filePath: string, content: string): Finding[] {
  const basename = path.basename(filePath);

  switch (basename) {
    case 'package.json':
      return scanNpmDeps(filePath, content);
    case 'requirements.txt':
    case 'Pipfile':
      return scanPipDeps(filePath, content);
    case 'go.mod':
    case 'go.sum':
      return scanGoDeps(filePath, content);
    default:
      return [];
  }
}
