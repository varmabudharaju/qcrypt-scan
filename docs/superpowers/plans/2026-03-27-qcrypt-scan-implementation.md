# qcrypt-scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI + REST API tool that scans codebases for quantum-vulnerable cryptography and produces educational, actionable reports.

**Architecture:** Regex-based pattern matching across 5 languages (Python, JS/TS, Go, Rust, Java) plus certificate, config, and dependency scanning. Core orchestrator discovers files, routes to scanners, enriches findings with educational explanations, computes a grade, and outputs via terminal or JSON reporters. Fastify serves a REST API for future UI.

**Tech Stack:** TypeScript, Node.js 20+, Fastify, Vitest, chalk, glob, commander

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types.ts` | Core types: `Finding`, `ScanReport`, `RiskLevel`, `AlgorithmRule` |
| `src/rules/algorithms.ts` | Algorithm definitions with risk levels and categories |
| `src/rules/patterns.ts` | Per-language regex patterns for detecting crypto usage |
| `src/education/explanations.ts` | Educational explanations + NIST replacement recommendations |
| `src/scanners/source-code.ts` | Scan source files using regex patterns |
| `src/scanners/certificates.ts` | Parse PEM/x509 certificates for algorithm info |
| `src/scanners/config-files.ts` | Scan TLS/SSH/nginx/apache config files |
| `src/scanners/dependencies.ts` | Scan package.json, requirements.txt, go.mod for crypto deps |
| `src/index.ts` | Core orchestrator: discover files, run scanners, enrich, grade |
| `src/reporters/json.ts` | JSON reporter |
| `src/reporters/terminal.ts` | Colored terminal reporter with risk badges |
| `src/cli.ts` | CLI entry point with commander |
| `src/api/server.ts` | Fastify server with POST /api/scan and GET /api/health |
| `test/fixtures/vulnerable/crypto_usage.py` | Python fixture with RSA, ECDSA, MD5 |
| `test/fixtures/vulnerable/crypto_usage.js` | JS fixture with RSA, DES |
| `test/fixtures/vulnerable/crypto_usage.go` | Go fixture with RSA, ECDSA |
| `test/fixtures/vulnerable/crypto_usage.rs` | Rust fixture with RSA |
| `test/fixtures/vulnerable/CryptoUsage.java` | Java fixture with RSA, DES |
| `test/fixtures/vulnerable/server.crt` | Self-signed RSA cert |
| `test/fixtures/vulnerable/nginx.conf` | nginx config with TLS 1.0 |
| `test/fixtures/vulnerable/package.json` | package.json with node-forge dep |
| `test/fixtures/safe/crypto_usage.py` | Python fixture with AES-256, SHA-3 |
| `test/fixtures/safe/crypto_usage.js` | JS fixture with AES-256-GCM |
| `test/fixtures/mixed/app.py` | Mixed: RSA + AES-256 |
| `test/fixtures/mixed/utils.js` | Mixed: MD5 + SHA-256 |
| `test/fixtures/mixed/package.json` | Mixed: has both safe and unsafe deps |
| `test/e2e/scan.test.ts` | E2E: full scan pipeline against fixtures |
| `test/e2e/cli.test.ts` | E2E: CLI output format tests |
| `test/e2e/api.test.ts` | E2E: API endpoint tests |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/varma/qcrypt-scan
npm init -y
```

Then replace contents of `package.json`:

```json
{
  "name": "qcrypt-scan",
  "version": "0.1.0",
  "description": "Scan codebases for quantum-vulnerable cryptography",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "qcrypt-scan": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "serve": "tsx src/api/server.ts"
  },
  "keywords": ["quantum", "cryptography", "post-quantum", "security", "scanner"],
  "license": "MIT"
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/varma/qcrypt-scan
npm install fastify commander chalk glob
npm install -D typescript tsx vitest @types/node
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 10000,
  },
});
```

- [ ] **Step 6: Create src/types.ts with core types**

```typescript
export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';

export type AlgorithmCategory = 'asymmetric' | 'symmetric' | 'hash' | 'protocol';

export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: AlgorithmCategory;
  risk: RiskLevel;
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface ScanReport {
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface AlgorithmRule {
  id: string;
  name: string;
  risk: RiskLevel;
  category: AlgorithmCategory;
}

export interface PatternMatch {
  algorithm: string;
  line: number;
  snippet: string;
}

export interface LanguagePatterns {
  extensions: string[];
  patterns: Array<{
    algorithm: string;
    regex: RegExp;
  }>;
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/varma/qcrypt-scan
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add package.json package-lock.json tsconfig.json .gitignore vitest.config.ts src/types.ts
git commit -m "feat: scaffold project with types, tooling, and dependencies"
```

---

### Task 2: Algorithm Rules and Risk Classification

**Files:**
- Create: `src/rules/algorithms.ts`
- Create: `test/rules/algorithms.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/rules/algorithms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getAlgorithmRule, getAllRules } from '../src/rules/algorithms.js';

describe('algorithm rules', () => {
  it('classifies RSA as CRITICAL', () => {
    const rule = getAlgorithmRule('RSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
    expect(rule!.category).toBe('asymmetric');
  });

  it('classifies ECDSA as CRITICAL', () => {
    const rule = getAlgorithmRule('ECDSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });

  it('classifies ECDH as CRITICAL', () => {
    const rule = getAlgorithmRule('ECDH');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });

  it('classifies DSA as CRITICAL', () => {
    const rule = getAlgorithmRule('DSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });

  it('classifies DH as CRITICAL', () => {
    const rule = getAlgorithmRule('DH');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });

  it('classifies AES-128 as WARNING', () => {
    const rule = getAlgorithmRule('AES-128');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
    expect(rule!.category).toBe('symmetric');
  });

  it('classifies MD5 as WARNING', () => {
    const rule = getAlgorithmRule('MD5');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
    expect(rule!.category).toBe('hash');
  });

  it('classifies SHA-1 as WARNING', () => {
    const rule = getAlgorithmRule('SHA-1');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });

  it('classifies DES as WARNING', () => {
    const rule = getAlgorithmRule('DES');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });

  it('classifies 3DES as WARNING', () => {
    const rule = getAlgorithmRule('3DES');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });

  it('classifies AES-192 as INFO', () => {
    const rule = getAlgorithmRule('AES-192');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('INFO');
  });

  it('classifies AES-256 as OK', () => {
    const rule = getAlgorithmRule('AES-256');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('OK');
    expect(rule!.category).toBe('symmetric');
  });

  it('classifies ML-KEM as OK', () => {
    const rule = getAlgorithmRule('ML-KEM');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('OK');
  });

  it('returns undefined for unknown algorithms', () => {
    const rule = getAlgorithmRule('NONEXISTENT');
    expect(rule).toBeUndefined();
  });

  it('getAllRules returns all defined rules', () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/rules/algorithms.test.ts
```

Expected: FAIL — cannot find module `../src/rules/algorithms.js`.

- [ ] **Step 3: Implement algorithm rules**

Create `src/rules/algorithms.ts`:

```typescript
import type { AlgorithmRule } from '../types.js';

const rules: AlgorithmRule[] = [
  // CRITICAL — broken by Shor's algorithm
  { id: 'RSA', name: 'RSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'ECDSA', name: 'ECDSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'ECDH', name: 'ECDH', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'DSA', name: 'DSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'DH', name: 'Diffie-Hellman', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'EdDSA', name: 'EdDSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'Ed25519', name: 'Ed25519', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'X25519', name: 'X25519', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'P-256', name: 'ECC P-256', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'P-384', name: 'ECC P-384', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'secp256k1', name: 'secp256k1', risk: 'CRITICAL', category: 'asymmetric' },

  // WARNING — weakened by Grover's or already weak
  { id: 'AES-128', name: 'AES-128', risk: 'WARNING', category: 'symmetric' },
  { id: 'DES', name: 'DES', risk: 'WARNING', category: 'symmetric' },
  { id: '3DES', name: 'Triple DES', risk: 'WARNING', category: 'symmetric' },
  { id: 'RC4', name: 'RC4', risk: 'WARNING', category: 'symmetric' },
  { id: 'MD5', name: 'MD5', risk: 'WARNING', category: 'hash' },
  { id: 'SHA-1', name: 'SHA-1', risk: 'WARNING', category: 'hash' },

  // INFO — reduced security margin
  { id: 'AES-192', name: 'AES-192', risk: 'INFO', category: 'symmetric' },

  // OK — quantum resistant
  { id: 'AES-256', name: 'AES-256', risk: 'OK', category: 'symmetric' },
  { id: 'SHA-256', name: 'SHA-256', risk: 'OK', category: 'hash' },
  { id: 'SHA-384', name: 'SHA-384', risk: 'OK', category: 'hash' },
  { id: 'SHA-512', name: 'SHA-512', risk: 'OK', category: 'hash' },
  { id: 'SHA-3', name: 'SHA-3', risk: 'OK', category: 'hash' },
  { id: 'ML-KEM', name: 'ML-KEM (Kyber)', risk: 'OK', category: 'asymmetric' },
  { id: 'ML-DSA', name: 'ML-DSA (Dilithium)', risk: 'OK', category: 'asymmetric' },
  { id: 'SLH-DSA', name: 'SLH-DSA (SPHINCS+)', risk: 'OK', category: 'asymmetric' },
];

const ruleMap = new Map(rules.map((r) => [r.id, r]));

export function getAlgorithmRule(id: string): AlgorithmRule | undefined {
  return ruleMap.get(id);
}

export function getAllRules(): AlgorithmRule[] {
  return [...rules];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/rules/algorithms.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/rules/algorithms.ts test/rules/algorithms.test.ts
git commit -m "feat: add algorithm rules with risk classification"
```

---

### Task 3: Language Detection Patterns

**Files:**
- Create: `src/rules/patterns.ts`
- Create: `test/rules/patterns.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/rules/patterns.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/rules/patterns.test.ts
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement language patterns**

Create `src/rules/patterns.ts`:

```typescript
import type { LanguagePatterns, PatternMatch } from '../types.js';

const pythonPatterns: LanguagePatterns = {
  extensions: ['.py'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa\b.*(?:generate|private|public|key|sign|encrypt)/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'ECDSA', regex: /\bec\.(?:generate_private_key|SECP|ECDSA)\b/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b/i },
    { algorithm: 'DSA', regex: /\bdsa\.(?:generate_private_key|DSAPrivateKey)\b/i },
    { algorithm: 'DH', regex: /\bdh\.(?:generate_parameters|DHPrivateKey)\b/i },
    { algorithm: 'Ed25519', regex: /\bEd25519\b/ },
    { algorithm: 'AES-128', regex: /\bAES\b.*\b128\b/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*\b256\b/ },
    { algorithm: 'DES', regex: /\bDES\b(?!3)(?!ede)/i },
    { algorithm: '3DES', regex: /\b(?:3DES|DES3|DESede|TripleDES)\b/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /\bsha[-_]?1\b/i },
    { algorithm: 'SHA-256', regex: /\bsha[-_]?256\b/i },
    { algorithm: 'SHA-512', regex: /\bsha[-_]?512\b/i },
    { algorithm: 'SHA-3', regex: /\bsha3[-_]/i },
  ],
};

const jsPatterns: LanguagePatterns = {
  extensions: ['.js', '.ts', '.mjs', '.cjs'],
  patterns: [
    { algorithm: 'RSA', regex: /['"]rsa['"]/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'RSA', regex: /generateKeyPairSync\s*\(\s*['"]rsa['"]/i },
    { algorithm: 'ECDSA', regex: /['"]ec['"]/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b|createECDH/i },
    { algorithm: 'DH', regex: /\bcreateDiffieHellman\b/ },
    { algorithm: 'Ed25519', regex: /\bEd25519\b|['"]ed25519['"]/i },
    { algorithm: 'AES-128', regex: /\baes-128\b/i },
    { algorithm: 'AES-256', regex: /\baes-256\b/i },
    { algorithm: 'DES', regex: /['"]des['"]|['"]des-/i },
    { algorithm: '3DES', regex: /['"]des-ede3['"]/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /['"]sha1['"]/i },
    { algorithm: 'SHA-256', regex: /['"]sha256['"]/i },
    { algorithm: 'SHA-512', regex: /['"]sha512['"]/i },
    { algorithm: 'P-256', regex: /\bprime256v1\b|\bP-256\b|\bsecp256r1\b/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const goPatterns: LanguagePatterns = {
  extensions: ['.go'],
  patterns: [
    { algorithm: 'RSA', regex: /\bcrypto\/rsa\b|rsa\.GenerateKey|rsa\.SignPKCS|rsa\.EncryptPKCS/ },
    { algorithm: 'ECDSA', regex: /\bcrypto\/ecdsa\b|ecdsa\.GenerateKey|ecdsa\.Sign/ },
    { algorithm: 'ECDH', regex: /\bcrypto\/ecdh\b|ecdh\./ },
    { algorithm: 'DSA', regex: /\bcrypto\/dsa\b|dsa\.GenerateKey/ },
    { algorithm: 'Ed25519', regex: /\bcrypto\/ed25519\b|ed25519\.GenerateKey/ },
    { algorithm: 'DES', regex: /\bcrypto\/des\b|des\.NewCipher/ },
    { algorithm: '3DES', regex: /des\.NewTripleDESCipher/ },
    { algorithm: 'MD5', regex: /\bcrypto\/md5\b|md5\.New\b|md5\.Sum/ },
    { algorithm: 'SHA-1', regex: /\bcrypto\/sha1\b|sha1\.New\b|sha1\.Sum/ },
    { algorithm: 'SHA-256', regex: /\bcrypto\/sha256\b|sha256\.New\b|sha256\.Sum/ },
    { algorithm: 'SHA-512', regex: /\bcrypto\/sha512\b|sha512\.New\b/ },
    { algorithm: 'AES-128', regex: /\baes\.NewCipher\b.*16\b/ },
    { algorithm: 'AES-256', regex: /\baes\.NewCipher\b.*32\b/ },
    { algorithm: 'RSA', regex: /\bx509\..*RSA\b/ },
  ],
};

const rustPatterns: LanguagePatterns = {
  extensions: ['.rs'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa::?\b|RsaPrivateKey|RsaPublicKey/i },
    { algorithm: 'ECDSA', regex: /\becdsa::?\b|EcdsaKeyPair/i },
    { algorithm: 'Ed25519', regex: /\bed25519\b|Ed25519KeyPair/i },
    { algorithm: 'DES', regex: /\bdes::?\b|Des\b/ },
    { algorithm: 'MD5', regex: /\bmd5::?\b|Md5::/ },
    { algorithm: 'SHA-1', regex: /\bsha1::?\b|Sha1::/ },
    { algorithm: 'SHA-256', regex: /\bsha2?256\b|Sha256::/i },
    { algorithm: 'AES-128', regex: /\bAes128\b/ },
    { algorithm: 'AES-256', regex: /\bAes256\b/ },
    { algorithm: 'P-256', regex: /\bNIST_P256\b|SECP256R1/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const javaPatterns: LanguagePatterns = {
  extensions: ['.java', '.kt'],
  patterns: [
    { algorithm: 'RSA', regex: /getInstance\s*\(\s*"RSA/i },
    { algorithm: 'RSA', regex: /KeyPairGenerator.*"RSA"/ },
    { algorithm: 'ECDSA', regex: /getInstance\s*\(\s*"EC"|"ECDSA"/i },
    { algorithm: 'DSA', regex: /getInstance\s*\(\s*"DSA"/i },
    { algorithm: 'DH', regex: /getInstance\s*\(\s*"DH"|DiffieHellman/i },
    { algorithm: 'DES', regex: /getInstance\s*\(\s*"DES\b/i },
    { algorithm: '3DES', regex: /getInstance\s*\(\s*"DESede/i },
    { algorithm: 'AES-128', regex: /\bAES\b.*128/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*256/ },
    { algorithm: 'MD5', regex: /getInstance\s*\(\s*"MD5"/i },
    { algorithm: 'SHA-1', regex: /getInstance\s*\(\s*"SHA-?1"/i },
    { algorithm: 'SHA-256', regex: /getInstance\s*\(\s*"SHA-?256"/i },
    { algorithm: 'RC4', regex: /getInstance\s*\(\s*"RC4"|"ARCFOUR"/i },
  ],
};

const allLanguages: LanguagePatterns[] = [
  pythonPatterns,
  jsPatterns,
  goPatterns,
  rustPatterns,
  javaPatterns,
];

export function getLanguagePatterns(extension: string): LanguagePatterns | undefined {
  return allLanguages.find((lang) => lang.extensions.includes(extension));
}

export function scanContent(content: string, extension: string): PatternMatch[] {
  const lang = getLanguagePatterns(extension);
  if (!lang) return [];

  const lines = content.split('\n');
  const matches: PatternMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of lang.patterns) {
      if (pattern.regex.test(line)) {
        const key = `${pattern.algorithm}:${i + 1}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            algorithm: pattern.algorithm,
            line: i + 1,
            snippet: line.trim(),
          });
        }
      }
    }
  }

  return matches;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/rules/patterns.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/rules/patterns.ts test/rules/patterns.test.ts
git commit -m "feat: add language detection patterns for 5 languages"
```

---

### Task 4: Educational Explanations

**Files:**
- Create: `src/education/explanations.ts`
- Create: `test/education/explanations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/education/explanations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getExplanation } from '../src/education/explanations.js';

describe('educational explanations', () => {
  it('provides explanation for RSA', () => {
    const exp = getExplanation('RSA');
    expect(exp.explanation).toContain("Shor's");
    expect(exp.replacement).toContain('ML-KEM');
  });

  it('provides explanation for ECDSA', () => {
    const exp = getExplanation('ECDSA');
    expect(exp.explanation).toContain("Shor's");
    expect(exp.replacement).toContain('ML-DSA');
  });

  it('provides explanation for MD5', () => {
    const exp = getExplanation('MD5');
    expect(exp.explanation.length).toBeGreaterThan(0);
    expect(exp.replacement).toContain('SHA-3');
  });

  it('provides explanation for AES-128', () => {
    const exp = getExplanation('AES-128');
    expect(exp.explanation).toContain("Grover's");
    expect(exp.replacement).toContain('AES-256');
  });

  it('provides explanation for AES-256', () => {
    const exp = getExplanation('AES-256');
    expect(exp.explanation).toContain('quantum-resistant');
  });

  it('provides fallback for unknown algorithms', () => {
    const exp = getExplanation('UNKNOWN_ALGO');
    expect(exp.explanation.length).toBeGreaterThan(0);
    expect(exp.replacement.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/education/explanations.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement explanations**

Create `src/education/explanations.ts`:

```typescript
interface Explanation {
  explanation: string;
  replacement: string;
}

const explanations: Record<string, Explanation> = {
  RSA: {
    explanation:
      "RSA relies on the difficulty of factoring large integers. Shor's algorithm on a quantum computer can factor these in polynomial time, completely breaking RSA at any key size.",
    replacement:
      'ML-KEM (FIPS 203) for key encapsulation, ML-DSA (FIPS 204) for digital signatures. These are NIST-standardized post-quantum replacements.',
  },
  ECDSA: {
    explanation:
      "ECDSA relies on the elliptic curve discrete logarithm problem. Shor's algorithm solves this efficiently on a quantum computer, breaking all ECC-based schemes regardless of curve size.",
    replacement:
      'ML-DSA (FIPS 204) for digital signatures, or SLH-DSA (FIPS 205) for hash-based signatures with minimal security assumptions.',
  },
  ECDH: {
    explanation:
      "ECDH key exchange relies on the same elliptic curve math broken by Shor's algorithm. Any captured ECDH key exchanges could be decrypted retroactively once quantum computers exist (harvest-now, decrypt-later attack).",
    replacement:
      'ML-KEM (FIPS 203) for key encapsulation. Consider hybrid ML-KEM + X25519 during the transition period.',
  },
  DSA: {
    explanation:
      "DSA is based on the discrete logarithm problem, which Shor's algorithm solves efficiently. Already deprecated by NIST even without quantum threats.",
    replacement:
      'ML-DSA (FIPS 204) for digital signatures.',
  },
  DH: {
    explanation:
      "Diffie-Hellman key exchange relies on the discrete logarithm problem, broken by Shor's algorithm. Captured DH exchanges are vulnerable to harvest-now, decrypt-later attacks.",
    replacement:
      'ML-KEM (FIPS 203) for key encapsulation.',
  },
  EdDSA: {
    explanation:
      "EdDSA (including Ed25519) is an elliptic curve scheme broken by Shor's algorithm, despite being more modern than ECDSA.",
    replacement:
      'ML-DSA (FIPS 204) for digital signatures.',
  },
  Ed25519: {
    explanation:
      "Ed25519 uses Curve25519, an elliptic curve vulnerable to Shor's algorithm. While excellent classically, it offers zero protection against quantum attacks.",
    replacement:
      'ML-DSA (FIPS 204) for digital signatures.',
  },
  X25519: {
    explanation:
      "X25519 key exchange uses elliptic curve math broken by Shor's algorithm. Actively targeted in harvest-now, decrypt-later scenarios.",
    replacement:
      'ML-KEM (FIPS 203), or hybrid ML-KEM + X25519 during transition.',
  },
  'P-256': {
    explanation:
      "The P-256 curve (secp256r1/prime256v1) is an elliptic curve broken by Shor's algorithm.",
    replacement:
      'ML-KEM or ML-DSA depending on use case (key exchange vs signatures).',
  },
  'P-384': {
    explanation:
      "The P-384 curve is an elliptic curve broken by Shor's algorithm. Larger curves do not help against quantum attacks.",
    replacement:
      'ML-KEM or ML-DSA depending on use case.',
  },
  secp256k1: {
    explanation:
      "secp256k1 (used in Bitcoin/Ethereum) is an elliptic curve broken by Shor's algorithm. Cryptocurrency signatures are especially high-value targets.",
    replacement:
      'ML-DSA (FIPS 204) or SLH-DSA (FIPS 205) for signatures.',
  },
  'AES-128': {
    explanation:
      "Grover's algorithm halves AES-128's effective security to 64 bits, which is dangerously low. While AES itself isn't broken, 128-bit keys become insufficient.",
    replacement:
      'AES-256 provides 128 bits of post-quantum security, which is considered safe.',
  },
  'AES-192': {
    explanation:
      "Grover's algorithm reduces AES-192's effective security to 96 bits. While still usable, the reduced margin makes AES-256 preferable.",
    replacement:
      'AES-256 for full quantum resistance with comfortable security margins.',
  },
  'AES-256': {
    explanation:
      "AES-256 is quantum-resistant. Grover's algorithm reduces it to 128-bit equivalent security, which remains safe. No migration needed.",
    replacement:
      'No change needed. AES-256 is already quantum-safe.',
  },
  DES: {
    explanation:
      'DES uses 56-bit keys, already broken classically. Quantum attacks make it even worse. Should have been replaced decades ago.',
    replacement:
      'AES-256-GCM for symmetric encryption.',
  },
  '3DES': {
    explanation:
      '3DES (Triple DES) has an effective key size of 112 bits, reduced to 56 bits by Grover\'s algorithm. Also has a 64-bit block size vulnerable to Sweet32 attacks.',
    replacement:
      'AES-256-GCM for symmetric encryption.',
  },
  RC4: {
    explanation:
      'RC4 is broken classically with multiple practical attacks. Quantum attacks are irrelevant — this should not be used at all.',
    replacement:
      'AES-256-GCM or ChaCha20-Poly1305 for stream encryption.',
  },
  MD5: {
    explanation:
      'MD5 is broken classically — collisions can be generated in seconds. Quantum attacks via Grover\'s further reduce its security. Should not be used for any security purpose.',
    replacement:
      'SHA-3 or SHA-256 for hashing. For password hashing, use Argon2 or bcrypt.',
  },
  'SHA-1': {
    explanation:
      'SHA-1 is broken classically — practical collision attacks exist (SHAttered, 2017). Quantum attacks further weaken it. Deprecated by NIST.',
    replacement:
      'SHA-256 or SHA-3 for secure hashing.',
  },
  'SHA-256': {
    explanation:
      "SHA-256 is quantum-resistant. Grover's algorithm reduces it to 128-bit collision resistance, which remains safe. No migration needed.",
    replacement:
      'No change needed. SHA-256 is already quantum-safe.',
  },
  'SHA-384': {
    explanation:
      'SHA-384 is quantum-resistant with comfortable margins. No migration needed.',
    replacement:
      'No change needed.',
  },
  'SHA-512': {
    explanation:
      'SHA-512 is quantum-resistant with excellent margins. No migration needed.',
    replacement:
      'No change needed.',
  },
  'SHA-3': {
    explanation:
      'SHA-3 is quantum-resistant. Based on a completely different construction (Keccak) from SHA-2, providing algorithm diversity.',
    replacement:
      'No change needed. SHA-3 is already quantum-safe.',
  },
  'ML-KEM': {
    explanation:
      'ML-KEM (formerly Kyber) is a NIST-standardized post-quantum key encapsulation mechanism. It is quantum-resistant by design.',
    replacement:
      'No change needed. This is a post-quantum algorithm.',
  },
  'ML-DSA': {
    explanation:
      'ML-DSA (formerly Dilithium) is a NIST-standardized post-quantum digital signature scheme. It is quantum-resistant by design.',
    replacement:
      'No change needed. This is a post-quantum algorithm.',
  },
  'SLH-DSA': {
    explanation:
      'SLH-DSA (formerly SPHINCS+) is a NIST-standardized hash-based post-quantum signature scheme. It is quantum-resistant with minimal security assumptions.',
    replacement:
      'No change needed. This is a post-quantum algorithm.',
  },
};

const fallback: Explanation = {
  explanation:
    'This cryptographic algorithm may be vulnerable to quantum computing attacks. Review its quantum security properties.',
  replacement:
    'Consult NIST post-quantum cryptography standards (FIPS 203, 204, 205) for appropriate replacements.',
};

export function getExplanation(algorithm: string): Explanation {
  return explanations[algorithm] ?? fallback;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/education/explanations.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/education/explanations.ts test/education/explanations.test.ts
git commit -m "feat: add educational explanations for all algorithms"
```

---

### Task 5: Source Code Scanner

**Files:**
- Create: `src/scanners/source-code.ts`
- Create: `test/scanners/source-code.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/scanners/source-code.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/source-code.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement source code scanner**

Create `src/scanners/source-code.ts`:

```typescript
import path from 'node:path';
import type { Finding } from '../types.js';
import { scanContent } from '../rules/patterns.js';
import { getAlgorithmRule } from '../rules/algorithms.js';
import { getExplanation } from '../education/explanations.js';

export function scanSourceFile(filePath: string, content: string): Finding[] {
  const ext = path.extname(filePath);
  const matches = scanContent(content, ext);

  return matches
    .map((match) => {
      const rule = getAlgorithmRule(match.algorithm);
      if (!rule) return null;

      const education = getExplanation(match.algorithm);
      return {
        file: filePath,
        line: match.line,
        algorithm: match.algorithm,
        category: rule.category,
        risk: rule.risk,
        snippet: match.snippet,
        explanation: education.explanation,
        replacement: education.replacement,
      };
    })
    .filter((f): f is Finding => f !== null);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/source-code.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/scanners/source-code.ts test/scanners/source-code.test.ts
git commit -m "feat: add source code scanner"
```

---

### Task 6: Certificate Scanner

**Files:**
- Create: `src/scanners/certificates.ts`
- Create: `test/scanners/certificates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/scanners/certificates.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/certificates.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement certificate scanner**

Create `src/scanners/certificates.ts`:

```typescript
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
  // RSA cert detection: OID for rsaEncryption or PKCS#1 markers
  { regex: /MA0GCSqGSIb3DQEBAQUAA/, algorithm: 'RSA' },
  // EC cert detection: OID for ecPublicKey
  { regex: /MAoGCCqGSM49BAM/, algorithm: 'ECDSA' },
  // Signature algorithm markers
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/certificates.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/scanners/certificates.ts test/scanners/certificates.test.ts
git commit -m "feat: add certificate scanner for PEM/x509 files"
```

---

### Task 7: Config File Scanner

**Files:**
- Create: `src/scanners/config-files.ts`
- Create: `test/scanners/config-files.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/scanners/config-files.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/config-files.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement config file scanner**

Create `src/scanners/config-files.ts`:

```typescript
import type { Finding } from '../types.js';
import { getExplanation } from '../education/explanations.js';

interface ConfigPattern {
  regex: RegExp;
  algorithm: string;
  risk: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'protocol' | 'symmetric' | 'asymmetric';
}

const configPatterns: ConfigPattern[] = [
  // Protocol versions
  { regex: /\bTLSv1(?:\.0)?\b(?!\.)/i, algorithm: 'TLS 1.0', risk: 'CRITICAL', category: 'protocol' },
  { regex: /\bTLSv1\.1\b/i, algorithm: 'TLS 1.1', risk: 'CRITICAL', category: 'protocol' },
  { regex: /\bSSLv[23]\b/i, algorithm: 'SSLv2/v3', risk: 'CRITICAL', category: 'protocol' },
  // Weak ciphers in cipher strings
  { regex: /\bRC4\b/i, algorithm: 'RC4', risk: 'WARNING', category: 'symmetric' },
  { regex: /\bDES-CBC\b/i, algorithm: 'DES', risk: 'WARNING', category: 'symmetric' },
  { regex: /\b3DES\b|\bDES-CBC3\b|\bDES-EDE3\b/i, algorithm: '3DES', risk: 'WARNING', category: 'symmetric' },
  { regex: /\baes128\b/i, algorithm: 'AES-128', risk: 'WARNING', category: 'symmetric' },
  // SSH weak algorithms
  { regex: /\bssh-rsa\b/, algorithm: 'RSA', risk: 'CRITICAL', category: 'asymmetric' },
  { regex: /\bssh-dss\b/, algorithm: 'DSA', risk: 'CRITICAL', category: 'asymmetric' },
  { regex: /\b3des-cbc\b/, algorithm: '3DES', risk: 'WARNING', category: 'symmetric' },
];

const protocolExplanations: Record<string, { explanation: string; replacement: string }> = {
  'TLS 1.0': {
    explanation:
      'TLS 1.0 is deprecated (RFC 8996). It uses cipher suites vulnerable both classically and to quantum attacks. POODLE and BEAST attacks exist.',
    replacement: 'Upgrade to TLS 1.3, which supports modern cipher suites and will be easier to extend with post-quantum key exchange.',
  },
  'TLS 1.1': {
    explanation:
      'TLS 1.1 is deprecated (RFC 8996). It does not support modern AEAD ciphers and uses key exchange methods broken by quantum computers.',
    replacement: 'Upgrade to TLS 1.3.',
  },
  'SSLv2/v3': {
    explanation:
      'SSL 2.0/3.0 are completely broken with multiple practical attacks (DROWN, POODLE). Quantum attacks are irrelevant — these should not be used at all.',
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/config-files.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/scanners/config-files.ts test/scanners/config-files.test.ts
git commit -m "feat: add config file scanner for TLS/SSH configs"
```

---

### Task 8: Dependency Scanner

**Files:**
- Create: `src/scanners/dependencies.ts`
- Create: `test/scanners/dependencies.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/scanners/dependencies.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/dependencies.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement dependency scanner**

Create `src/scanners/dependencies.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/scanners/dependencies.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/scanners/dependencies.ts test/scanners/dependencies.test.ts
git commit -m "feat: add dependency scanner for npm, pip, go"
```

---

### Task 9: Core Orchestrator

**Files:**
- Create: `src/index.ts`
- Create: `test/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scan, computeGrade } from '../src/index.js';

describe('computeGrade', () => {
  it('returns A for no critical or warning', () => {
    expect(computeGrade(0, 0)).toBe('A');
  });

  it('returns B for no critical, some warnings', () => {
    expect(computeGrade(0, 3)).toBe('B');
  });

  it('returns C for 1-3 critical', () => {
    expect(computeGrade(2, 0)).toBe('C');
  });

  it('returns D for 4-10 critical', () => {
    expect(computeGrade(7, 0)).toBe('D');
  });

  it('returns F for 10+ critical', () => {
    expect(computeGrade(15, 0)).toBe('F');
  });
});

describe('scan', () => {
  it('returns a valid ScanReport structure', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.path).toBe('test/fixtures/vulnerable');
    expect(report.scannedAt).toBeDefined();
    expect(report.filesScanned).toBeGreaterThan(0);
    expect(Array.isArray(report.findings)).toBe(true);
    expect(report.summary).toHaveProperty('critical');
    expect(report.summary).toHaveProperty('warning');
    expect(report.summary).toHaveProperty('info');
    expect(report.summary).toHaveProperty('ok');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/index.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create test fixtures**

Create `test/fixtures/vulnerable/crypto_usage.py`:

```python
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import hashes
import hashlib

# RSA key generation - QUANTUM VULNERABLE
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# ECDSA key generation - QUANTUM VULNERABLE
ec_key = ec.generate_private_key(ec.SECP256R1())

# MD5 hashing - WEAK
digest = hashlib.md5(b"sensitive data").hexdigest()

# SHA-1 hashing - WEAK
sha1_hash = hashlib.sha1(b"data").hexdigest()
```

Create `test/fixtures/vulnerable/crypto_usage.js`:

```javascript
const crypto = require('crypto');
const forge = require('node-forge');

// RSA key generation - QUANTUM VULNERABLE
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// DES encryption - WEAK
const cipher = crypto.createCipheriv('des', key, iv);

// MD5 hashing - WEAK
const hash = crypto.createHash('md5');
```

Create `test/fixtures/vulnerable/crypto_usage.go`:

```go
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/md5"
	"fmt"
)

func main() {
	// RSA - QUANTUM VULNERABLE
	key, _ := rsa.GenerateKey(rand.Reader, 2048)

	// ECDSA - QUANTUM VULNERABLE
	ecKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

	// MD5 - WEAK
	h := md5.Sum([]byte("data"))

	fmt.Println(key, ecKey, h)
}
```

Create `test/fixtures/vulnerable/crypto_usage.rs`:

```rust
use rsa::{RsaPrivateKey, RsaPublicKey};
use rand::rngs::OsRng;

fn main() {
    // RSA - QUANTUM VULNERABLE
    let private_key = RsaPrivateKey::new(&mut OsRng, 2048).unwrap();
    let public_key = RsaPublicKey::from(&private_key);
    println!("{:?}", public_key);
}
```

Create `test/fixtures/vulnerable/CryptoUsage.java`:

```java
import java.security.KeyPairGenerator;
import java.security.KeyPair;
import javax.crypto.Cipher;

public class CryptoUsage {
    public static void main(String[] args) throws Exception {
        // RSA - QUANTUM VULNERABLE
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        // DES - WEAK
        Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
    }
}
```

Create `test/fixtures/safe/crypto_usage.py`:

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

# AES-256-GCM - QUANTUM SAFE
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

# SHA-256 - QUANTUM SAFE
digest = hashlib.sha256(b"data").hexdigest()

# SHA-3 - QUANTUM SAFE
sha3_hash = hashlib.sha3_256(b"data").hexdigest()
```

Create `test/fixtures/safe/crypto_usage.js`:

```javascript
const crypto = require('crypto');

// AES-256-GCM - QUANTUM SAFE
const key = crypto.randomBytes(32);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

// SHA-256 - QUANTUM SAFE
const hash = crypto.createHash('sha256');
```

Create `test/fixtures/mixed/app.py`:

```python
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

# RSA - QUANTUM VULNERABLE
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# AES-256 - QUANTUM SAFE
aes_key = AESGCM.generate_key(bit_length=256)

# SHA-256 - QUANTUM SAFE
h = hashlib.sha256(b"data").hexdigest()
```

Create `test/fixtures/mixed/utils.js`:

```javascript
const crypto = require('crypto');

// MD5 - WEAK
const md5 = crypto.createHash('md5');

// SHA-256 - SAFE
const sha256 = crypto.createHash('sha256');
```

Create `test/fixtures/mixed/package.json`:

```json
{
  "name": "mixed-app",
  "dependencies": {
    "express": "^4.18.0",
    "node-forge": "^1.3.0"
  }
}
```

- [ ] **Step 4: Implement core orchestrator**

Create `src/index.ts`:

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Finding, ScanReport } from './types.js';
import { scanSourceFile } from './scanners/source-code.js';
import { scanCertificateFile } from './scanners/certificates.js';
import { scanConfigFile } from './scanners/config-files.js';
import { scanDependencyFile } from './scanners/dependencies.js';
import { getLanguagePatterns } from './rules/patterns.js';

const CERT_EXTENSIONS = new Set(['.pem', '.crt', '.cer', '.key', '.pub']);
const CONFIG_BASENAMES = new Set([
  'nginx.conf', 'httpd.conf', 'apache2.conf',
  'sshd_config', 'ssh_config',
  'openssl.cnf', 'openssl.conf',
  'haproxy.cfg',
]);
const DEP_BASENAMES = new Set([
  'package.json', 'requirements.txt', 'Pipfile',
  'go.mod', 'go.sum', 'Cargo.toml',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', 'vendor', 'target']);

function discoverFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function classifyFile(filePath: string): 'source' | 'cert' | 'config' | 'dep' | 'skip' {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);

  if (DEP_BASENAMES.has(basename)) return 'dep';
  if (CONFIG_BASENAMES.has(basename)) return 'config';
  if (CERT_EXTENSIONS.has(ext)) return 'cert';
  if (getLanguagePatterns(ext)) return 'source';

  return 'skip';
}

export function computeGrade(critical: number, _warning: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (critical > 10) return 'F';
  if (critical >= 4) return 'D';
  if (critical >= 1) return 'C';
  if (_warning > 0) return 'B';
  return 'A';
}

export async function scan(targetPath: string): Promise<ScanReport> {
  const resolvedPath = path.resolve(targetPath);
  const stat = statSync(resolvedPath);

  let files: string[];
  if (stat.isDirectory()) {
    files = discoverFiles(resolvedPath);
  } else {
    files = [resolvedPath];
  }

  const allFindings: Finding[] = [];

  for (const file of files) {
    const type = classifyFile(file);
    if (type === 'skip') continue;

    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    const relativePath = path.relative(resolvedPath, file);
    let findings: Finding[];

    switch (type) {
      case 'source':
        findings = scanSourceFile(relativePath, content);
        break;
      case 'cert':
        findings = scanCertificateFile(relativePath, content);
        break;
      case 'config':
        findings = scanConfigFile(relativePath, content);
        break;
      case 'dep':
        findings = scanDependencyFile(relativePath, content);
        break;
      default:
        findings = [];
    }

    allFindings.push(...findings);
  }

  // Sort by risk: CRITICAL first, then WARNING, INFO, OK
  const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
  allFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const summary = {
    critical: allFindings.filter((f) => f.risk === 'CRITICAL').length,
    warning: allFindings.filter((f) => f.risk === 'WARNING').length,
    info: allFindings.filter((f) => f.risk === 'INFO').length,
    ok: allFindings.filter((f) => f.risk === 'OK').length,
  };

  return {
    path: targetPath,
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    findings: allFindings,
    summary,
    grade: computeGrade(summary.critical, summary.warning),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/index.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/index.ts test/index.test.ts test/fixtures/
git commit -m "feat: add core scan orchestrator with test fixtures"
```

---

### Task 10: JSON Reporter

**Files:**
- Create: `src/reporters/json.ts`
- Create: `test/reporters/json.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/reporters/json.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatJson } from '../src/reporters/json.js';
import type { ScanReport } from '../src/types.js';

describe('JSON reporter', () => {
  const report: ScanReport = {
    path: '/test/project',
    scannedAt: '2026-03-27T00:00:00.000Z',
    filesScanned: 5,
    findings: [
      {
        file: 'auth.py',
        line: 10,
        algorithm: 'RSA',
        category: 'asymmetric',
        risk: 'CRITICAL',
        snippet: 'rsa.generate_private_key(...)',
        explanation: 'RSA is broken by quantum computers.',
        replacement: 'Use ML-KEM.',
      },
    ],
    summary: { critical: 1, warning: 0, info: 0, ok: 0 },
    grade: 'C',
  };

  it('returns valid JSON string', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.path).toBe('/test/project');
    expect(parsed.grade).toBe('C');
    expect(parsed.findings).toHaveLength(1);
  });

  it('includes all report fields', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('scannedAt');
    expect(parsed).toHaveProperty('filesScanned');
    expect(parsed).toHaveProperty('summary');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/reporters/json.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement JSON reporter**

Create `src/reporters/json.ts`:

```typescript
import type { ScanReport } from '../types.js';

export function formatJson(report: ScanReport): string {
  return JSON.stringify(report, null, 2);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/reporters/json.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/reporters/json.ts test/reporters/json.test.ts
git commit -m "feat: add JSON reporter"
```

---

### Task 11: Terminal Reporter

**Files:**
- Create: `src/reporters/terminal.ts`
- Create: `test/reporters/terminal.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/reporters/terminal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/reporters/terminal.js';
import type { ScanReport } from '../src/types.js';

describe('terminal reporter', () => {
  const report: ScanReport = {
    path: '/test/project',
    scannedAt: '2026-03-27T00:00:00.000Z',
    filesScanned: 5,
    findings: [
      {
        file: 'auth.py',
        line: 10,
        algorithm: 'RSA',
        category: 'asymmetric',
        risk: 'CRITICAL',
        snippet: 'rsa.generate_private_key(...)',
        explanation: 'RSA is broken.',
        replacement: 'Use ML-KEM.',
      },
      {
        file: 'utils.py',
        line: 5,
        algorithm: 'MD5',
        category: 'hash',
        risk: 'WARNING',
        snippet: 'hashlib.md5(data)',
        explanation: 'MD5 is weak.',
        replacement: 'Use SHA-3.',
      },
    ],
    summary: { critical: 1, warning: 1, info: 0, ok: 0 },
    grade: 'C',
  };

  it('includes the grade', () => {
    const output = formatTerminal(report);
    expect(output).toContain('C');
  });

  it('includes file paths and line numbers', () => {
    const output = formatTerminal(report);
    expect(output).toContain('auth.py');
    expect(output).toContain('10');
  });

  it('includes algorithm names', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA');
    expect(output).toContain('MD5');
  });

  it('includes summary counts', () => {
    const output = formatTerminal(report);
    expect(output).toContain('1');
  });

  it('includes explanations', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA is broken');
  });

  it('includes replacements', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM');
  });

  it('handles empty findings', () => {
    const emptyReport: ScanReport = {
      ...report,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0, ok: 0 },
      grade: 'A',
    };
    const output = formatTerminal(emptyReport);
    expect(output).toContain('A');
    expect(output).toContain('quantum-safe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/reporters/terminal.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement terminal reporter**

Create `src/reporters/terminal.ts`:

```typescript
import chalk from 'chalk';
import type { ScanReport, RiskLevel } from '../types.js';

const riskColors: Record<RiskLevel, (s: string) => string> = {
  CRITICAL: chalk.red.bold,
  WARNING: chalk.yellow,
  INFO: chalk.blue,
  OK: chalk.green,
};

const gradeColors: Record<string, (s: string) => string> = {
  A: chalk.green.bold,
  B: chalk.green,
  C: chalk.yellow,
  D: chalk.red,
  F: chalk.red.bold,
};

export function formatTerminal(report: ScanReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('  qcrypt-scan  ') + chalk.dim(`Quantum Cryptography Scanner`));
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');
  lines.push(`  ${chalk.dim('Path:')}    ${report.path}`);
  lines.push(`  ${chalk.dim('Files:')}   ${report.filesScanned} scanned`);
  lines.push(`  ${chalk.dim('Grade:')}   ${(gradeColors[report.grade] ?? chalk.white)(report.grade)}`);
  lines.push('');

  // Summary
  lines.push(chalk.bold('  Summary'));
  lines.push(
    `    ${chalk.red('CRITICAL')}: ${report.summary.critical}  ` +
    `${chalk.yellow('WARNING')}: ${report.summary.warning}  ` +
    `${chalk.blue('INFO')}: ${report.summary.info}  ` +
    `${chalk.green('OK')}: ${report.summary.ok}`
  );
  lines.push('');

  if (report.findings.length === 0) {
    lines.push(chalk.green('  No quantum-vulnerable cryptography found. Your project appears quantum-safe!'));
    lines.push('');
    return lines.join('\n');
  }

  // Findings
  lines.push(chalk.bold('  Findings'));
  lines.push('');

  for (const finding of report.findings) {
    const badge = riskColors[finding.risk](`[${finding.risk}]`);
    lines.push(`  ${badge} ${chalk.bold(finding.algorithm)} in ${chalk.cyan(finding.file)}:${finding.line}`);
    lines.push(`    ${chalk.dim(finding.snippet)}`);
    lines.push(`    ${chalk.dim('Why:')} ${finding.explanation}`);
    lines.push(`    ${chalk.dim('Fix:')} ${finding.replacement}`);
    lines.push('');
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/reporters/terminal.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/reporters/terminal.ts test/reporters/terminal.test.ts
git commit -m "feat: add terminal reporter with colored output"
```

---

### Task 12: CLI

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Implement CLI**

Create `src/cli.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { createServer } from './api/server.js';

const program = new Command();

program
  .name('qcrypt-scan')
  .description('Scan codebases for quantum-vulnerable cryptography')
  .version('0.1.0');

program
  .argument('[path]', 'path to scan', '.')
  .option('--json', 'output as JSON')
  .option('--serve', 'start API server')
  .option('--port <number>', 'API server port', '3100')
  .action(async (targetPath: string, options: { json?: boolean; serve?: boolean; port?: string }) => {
    if (options.serve) {
      const port = parseInt(options.port ?? '3100', 10);
      const server = createServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`qcrypt-scan API server running on http://localhost:${port}`);
      return;
    }

    try {
      const report = await scan(targetPath);

      if (options.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatTerminal(report));
      }

      // Exit with non-zero if critical findings
      if (report.summary.critical > 0) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  });

program.parse();
```

- [ ] **Step 2: Verify CLI runs**

```bash
cd /Users/varma/qcrypt-scan
npx tsx src/cli.ts test/fixtures/vulnerable
```

Expected: colored terminal output showing RSA/ECDSA/MD5 findings.

- [ ] **Step 3: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/cli.ts
git commit -m "feat: add CLI entry point"
```

---

### Task 13: API Server

**Files:**
- Create: `src/api/server.ts`

- [ ] **Step 1: Implement Fastify API server**

Create `src/api/server.ts`:

```typescript
import Fastify from 'fastify';
import { scan } from '../index.js';

export function createServer() {
  const app = Fastify({ logger: true });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  app.post<{ Body: { path: string } }>('/api/scan', async (request, reply) => {
    const { path: targetPath } = request.body ?? {};

    if (!targetPath || typeof targetPath !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: path' });
    }

    try {
      const report = await scan(targetPath);
      return report;
    } catch (err) {
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Scan failed',
      });
    }
  });

  return app;
}
```

- [ ] **Step 2: Verify API starts**

```bash
cd /Users/varma/qcrypt-scan
timeout 3 npx tsx src/cli.ts --serve || true
```

Expected: server starts on port 3100 (times out after 3s which is fine).

- [ ] **Step 3: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add src/api/server.ts
git commit -m "feat: add Fastify API server with /api/scan and /api/health"
```

---

### Task 14: E2E Tests

**Files:**
- Create: `test/e2e/scan.test.ts`
- Create: `test/e2e/cli.test.ts`
- Create: `test/e2e/api.test.ts`

- [ ] **Step 1: Write E2E scan tests**

Create `test/e2e/scan.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scan } from '../../src/index.js';

describe('E2E: scan pipeline', () => {
  it('detects all critical findings in vulnerable fixtures', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.summary.critical).toBeGreaterThanOrEqual(3);
    expect(report.findings.some((f) => f.algorithm === 'RSA')).toBe(true);
    expect(report.findings.some((f) => f.algorithm === 'ECDSA')).toBe(true);
    expect(report.grade).not.toBe('A');
    expect(report.grade).not.toBe('B');
  });

  it('detects warning-level findings in vulnerable fixtures', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.summary.warning).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.algorithm === 'MD5' || f.algorithm === 'DES')).toBe(true);
  });

  it('reports grade A for safe fixtures', async () => {
    const report = await scan('test/fixtures/safe');
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.grade).toBe('A');
  });

  it('handles mixed fixtures correctly', async () => {
    const report = await scan('test/fixtures/mixed');
    expect(report.summary.critical).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.risk === 'CRITICAL')).toBe(true);
    // Should also find safe algorithms
    const hasRSA = report.findings.some((f) => f.algorithm === 'RSA');
    expect(hasRSA).toBe(true);
  });

  it('includes educational explanations in all findings', async () => {
    const report = await scan('test/fixtures/vulnerable');
    for (const finding of report.findings) {
      expect(finding.explanation.length).toBeGreaterThan(0);
      expect(finding.replacement.length).toBeGreaterThan(0);
    }
  });

  it('includes file paths and line numbers', async () => {
    const report = await scan('test/fixtures/vulnerable');
    for (const finding of report.findings) {
      expect(finding.file.length).toBeGreaterThan(0);
      expect(finding.line).toBeGreaterThanOrEqual(1);
    }
  });

  it('sorts findings by risk level (CRITICAL first)', async () => {
    const report = await scan('test/fixtures/vulnerable');
    const risks = report.findings.map((f) => f.risk);
    const riskOrder = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
    for (let i = 1; i < risks.length; i++) {
      expect(riskOrder[risks[i]]).toBeGreaterThanOrEqual(riskOrder[risks[i - 1]]);
    }
  });
});
```

- [ ] **Step 2: Write E2E CLI tests**

Create `test/e2e/cli.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('E2E: CLI', () => {
  const run = (args: string) => {
    try {
      return execSync(`npx tsx src/cli.ts ${args}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        timeout: 15000,
      });
    } catch (err: any) {
      // CLI exits with code 1 for critical findings, which is expected
      return err.stdout ?? '';
    }
  };

  it('outputs terminal format by default', () => {
    const output = run('test/fixtures/vulnerable');
    expect(output).toContain('qcrypt-scan');
    expect(output).toContain('RSA');
    expect(output).toContain('CRITICAL');
  });

  it('outputs JSON with --json flag', () => {
    const output = run('test/fixtures/vulnerable --json');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('grade');
    expect(parsed).toHaveProperty('findings');
    expect(parsed).toHaveProperty('summary');
  });

  it('reports grade A for safe fixtures', () => {
    const output = run('test/fixtures/safe --json');
    const parsed = JSON.parse(output);
    expect(parsed.grade).toBe('A');
    expect(parsed.summary.critical).toBe(0);
  });

  it('includes explanations in terminal output', () => {
    const output = run('test/fixtures/vulnerable');
    expect(output).toContain("Shor's");
  });
});
```

- [ ] **Step 3: Write E2E API tests**

Create `test/e2e/api.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../src/api/server.js';
import type { FastifyInstance } from 'fastify';

describe('E2E: API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('POST /api/scan returns scan report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: { path: 'test/fixtures/vulnerable' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('grade');
    expect(body).toHaveProperty('findings');
    expect(body).toHaveProperty('summary');
    expect(body.summary.critical).toBeGreaterThan(0);
  });

  it('POST /api/scan returns 400 without path', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/scan returns grade A for safe fixtures', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: { path: 'test/fixtures/safe' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.grade).toBe('A');
  });
});
```

- [ ] **Step 4: Run all E2E tests**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run test/e2e/
```

Expected: all tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/varma/qcrypt-scan
npx vitest run
```

Expected: all tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add test/e2e/
git commit -m "feat: add E2E tests for scan pipeline, CLI, and API"
```

---

### Task 15: Final Polish

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```markdown
# qcrypt-scan

Scan your codebase for quantum-vulnerable cryptography. Get a grade, understand the risks, and learn what to replace.

Part of the **qcrypt** series: `scan` → `bench` → `migrate`

## Quick Start

```bash
npx qcrypt-scan ./my-project
```

## What It Detects

| Risk | Examples | Quantum Threat |
|------|----------|----------------|
| CRITICAL | RSA, ECDSA, ECDH, DSA, DH | Broken by Shor's algorithm |
| WARNING | AES-128, DES, MD5, SHA-1 | Weakened by Grover's algorithm |
| INFO | AES-192 | Reduced security margin |
| OK | AES-256, SHA-256, ML-KEM, ML-DSA | Quantum-resistant |

## Usage

```bash
# Scan with colored terminal output
qcrypt-scan ./my-project

# JSON output (for CI/CD)
qcrypt-scan ./my-project --json

# Start API server
qcrypt-scan --serve --port 3100
```

## API

```bash
# Health check
curl http://localhost:3100/api/health

# Scan a project
curl -X POST http://localhost:3100/api/scan \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/project"}'
```

## Supported Languages

Python, JavaScript/TypeScript, Go, Rust, Java

Also scans: certificates (PEM/x509), config files (nginx, SSH, Apache), dependencies (npm, pip, go.mod)

## Grading

- **A** — No critical or warning findings
- **B** — No critical, some warnings
- **C** — 1-3 critical findings
- **D** — 4-10 critical findings
- **F** — 10+ critical findings

## License

MIT
```

- [ ] **Step 2: Verify full build and test**

```bash
cd /Users/varma/qcrypt-scan
npx tsc --noEmit && npx vitest run
```

Expected: type check passes, all tests PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/varma/qcrypt-scan
git add README.md
git commit -m "docs: add README with usage and grading docs"
```
