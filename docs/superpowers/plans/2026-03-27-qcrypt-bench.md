# qcrypt-bench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive CLI + web tool that benchmarks classical crypto locally and compares results side-by-side with NIST PQC reference data, with educational context.

**Architecture:** TypeScript backend with Node `crypto` for classical benchmarks, hardcoded NIST reference data for PQC, Fastify API server, React+Vite+Tailwind web UI. Follows the same patterns established by the sibling project `qcrypt-scan`.

**Tech Stack:** TypeScript, Node.js 20+, Node `crypto`, Fastify 5, commander, chalk, Vitest, React 19, Vite 5, Tailwind 3, react-router-dom 7

---

## File Structure

```
qcrypt-bench/
├── src/
│   ├── types.ts                 # Core type definitions (BenchmarkResult, AlgorithmProfile, etc.)
│   ├── benchmarks/
│   │   ├── runner.ts            # Generic benchmark runner (warm-up + timed iterations)
│   │   ├── keygen.ts            # Key generation benchmarks (RSA, ECDH, X25519)
│   │   ├── sign-verify.ts       # Signing and verification benchmarks
│   │   ├── encrypt-decrypt.ts   # AES-GCM encryption/decryption benchmarks
│   │   └── hash.ts              # Hashing benchmarks (MD5, SHA-256, SHA-512, SHA3-256)
│   ├── reference/
│   │   └── pqc-data.ts          # NIST PQC reference data (hardcoded)
│   ├── education/
│   │   └── comparisons.ts       # Educational comparison text for classical → PQC pairs
│   ├── reporters/
│   │   ├── terminal.ts          # CLI table output with chalk
│   │   └── json.ts              # JSON output formatter
│   ├── api/
│   │   └── server.ts            # Fastify API server with in-memory history
│   ├── cli.ts                   # CLI entry point (commander)
│   └── index.ts                 # Core orchestrator — runs benchmarks, assembles report
├── web/
│   ├── src/
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Router setup
│   │   ├── api.ts               # API client
│   │   ├── theme.tsx            # Dark/light theme context
│   │   ├── index.css            # Tailwind directives
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar + content layout
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── ThemeToggle.tsx  # Dark/light toggle button
│   │   │   ├── ResultsTable.tsx # Benchmark results table
│   │   │   ├── SpeedBar.tsx     # Horizontal bar for speed comparison
│   │   │   └── SizeBadge.tsx    # Key/signature size display
│   │   └── pages/
│   │       ├── Dashboard.tsx    # Run benchmarks, show results table
│   │       ├── Comparison.tsx   # Side-by-side classical vs PQC
│   │       └── Education.tsx    # Algorithm explanations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
├── test/
│   ├── benchmarks/
│   │   ├── runner.test.ts
│   │   ├── keygen.test.ts
│   │   ├── sign-verify.test.ts
│   │   ├── encrypt-decrypt.test.ts
│   │   └── hash.test.ts
│   ├── reference/
│   │   └── pqc-data.test.ts
│   ├── education/
│   │   └── comparisons.test.ts
│   ├── reporters/
│   │   ├── terminal.test.ts
│   │   └── json.test.ts
│   ├── index.test.ts
│   └── e2e/
│       ├── api.test.ts
│       └── cli.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "qcrypt-bench",
  "version": "0.1.0",
  "description": "Benchmark classical crypto and compare with post-quantum alternatives",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "qcrypt-bench": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest --config vitest.config.ts",
    "serve": "tsx src/api/server.ts"
  },
  "dependencies": {
    "@fastify/static": "^9.0.0",
    "chalk": "^5.6.2",
    "commander": "^14.0.3",
    "fastify": "^5.8.4"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

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

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^\.\.\/src\//,
        replacement: path.resolve(__dirname, 'src') + '/',
      },
    ],
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['web/**'],
    testTimeout: 30000,
  },
});
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
web/dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

- [ ] **Step 6: Verify TypeScript compiles (empty project)**

Create a placeholder `src/types.ts` with just a comment:

```typescript
// Core types for qcrypt-bench
export {};
```

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore src/types.ts
git commit -m "chore: scaffold project with TypeScript, Vitest, Fastify"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/types.ts`
- Create: `test/types-check.test.ts`

- [ ] **Step 1: Write type validation test**

Create `test/types-check.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  BenchmarkResult,
  AlgorithmProfile,
  BenchmarkReport,
  Comparison,
  BenchmarkCategory,
} from '../src/types.js';

describe('Core types', () => {
  it('BenchmarkResult accepts valid data', () => {
    const result: BenchmarkResult = {
      algorithm: 'RSA-2048',
      operation: 'keygen',
      opsPerSecond: 500,
      avgTimeMs: 2.0,
      iterations: 1000,
      isReference: false,
      quantumSafe: false,
    };
    expect(result.algorithm).toBe('RSA-2048');
    expect(result.isReference).toBe(false);
  });

  it('AlgorithmProfile accepts valid data', () => {
    const profile: AlgorithmProfile = {
      algorithm: 'ML-KEM-768',
      category: 'asymmetric',
      quantumSafe: true,
      publicKeySize: 1184,
      privateKeySize: 2400,
      ciphertextSize: 1088,
      securityLevel: '128-bit classical, 128-bit quantum',
    };
    expect(profile.quantumSafe).toBe(true);
    expect(profile.signatureSize).toBeUndefined();
  });

  it('BenchmarkReport has all required fields', () => {
    const report: BenchmarkReport = {
      id: 'test-id',
      runAt: '2026-03-27T00:00:00Z',
      platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
      iterations: 1000,
      results: [],
      profiles: [],
      comparisons: [],
    };
    expect(report.id).toBe('test-id');
    expect(report.results).toEqual([]);
  });

  it('Comparison has all required fields', () => {
    const comparison: Comparison = {
      classical: 'RSA-2048',
      postQuantum: 'ML-KEM-768',
      speedup: 'ML-KEM is 1125x faster at key generation',
      sizeTradeoff: 'but public keys are 4x larger (1184B vs 294B)',
      explanation: 'RSA relies on factoring large primes...',
    };
    expect(comparison.classical).toBe('RSA-2048');
  });

  it('BenchmarkCategory covers all categories', () => {
    const categories: BenchmarkCategory[] = ['all', 'kex', 'sigs', 'sym', 'hash'];
    expect(categories).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/types-check.test.ts`
Expected: FAIL — imports not found

- [ ] **Step 3: Implement types**

Replace `src/types.ts` with:

```typescript
export type Operation = 'keygen' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'hash' | 'encaps' | 'decaps';

export type BenchmarkCategory = 'all' | 'kex' | 'sigs' | 'sym' | 'hash';

export interface BenchmarkResult {
  algorithm: string;
  operation: Operation;
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;
  quantumSafe: boolean;
}

export interface AlgorithmProfile {
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash';
  quantumSafe: boolean;
  publicKeySize: number;
  privateKeySize: number;
  signatureSize?: number;
  ciphertextSize?: number;
  securityLevel: string;
}

export interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: {
    os: string;
    arch: string;
    node: string;
    cpuModel: string;
  };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

export interface Comparison {
  classical: string;
  postQuantum: string;
  speedup: string;
  sizeTradeoff: string;
  explanation: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/types-check.test.ts`
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/types.ts test/types-check.test.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: Benchmark Runner

**Files:**
- Create: `src/benchmarks/runner.ts`
- Create: `test/benchmarks/runner.test.ts`

- [ ] **Step 1: Write failing tests for the runner**

Create `test/benchmarks/runner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { benchmark } from '../src/benchmarks/runner.js';

describe('benchmark runner', () => {
  it('returns opsPerSecond and avgTimeMs', () => {
    let counter = 0;
    const result = benchmark(() => { counter++; }, 100);

    expect(result).toHaveProperty('opsPerSecond');
    expect(result).toHaveProperty('avgTimeMs');
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.avgTimeMs).toBeGreaterThan(0);
  });

  it('runs the function the specified number of iterations', () => {
    let counter = 0;
    benchmark(() => { counter++; }, 50);

    // 10 warm-up + 50 timed = 60
    expect(counter).toBe(60);
  });

  it('faster function has higher opsPerSecond than slower function', () => {
    const fast = benchmark(() => { /* noop */ }, 100);

    const slow = benchmark(() => {
      // Busy work
      let sum = 0;
      for (let i = 0; i < 10000; i++) sum += i;
      return sum;
    }, 100);

    expect(fast.opsPerSecond).toBeGreaterThan(slow.opsPerSecond);
  });

  it('opsPerSecond and avgTimeMs are consistent', () => {
    const result = benchmark(() => {
      let sum = 0;
      for (let i = 0; i < 100; i++) sum += i;
    }, 200);

    // opsPerSecond ≈ 1000 / avgTimeMs (since avgTimeMs is per-op, ops/sec = 1000/avgMs)
    const expectedOps = Math.round(1000 / result.avgTimeMs);
    // Allow 10% tolerance due to rounding
    expect(Math.abs(result.opsPerSecond - expectedOps) / expectedOps).toBeLessThan(0.1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/benchmarks/runner.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the runner**

Create `src/benchmarks/runner.ts`:

```typescript
import { performance } from 'node:perf_hooks';

export interface TimingResult {
  opsPerSecond: number;
  avgTimeMs: number;
}

const WARMUP_ITERATIONS = 10;

export function benchmark(fn: () => void, iterations: number): TimingResult {
  // Warm up — let V8 JIT compile the function
  for (let i = 0; i < WARMUP_ITERATIONS; i++) fn();

  // Timed run
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  return {
    opsPerSecond: Math.round((iterations / elapsed) * 1000),
    avgTimeMs: Number((elapsed / iterations).toFixed(4)),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/benchmarks/runner.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/benchmarks/runner.ts test/benchmarks/runner.test.ts
git commit -m "feat: add benchmark runner with warm-up and timing"
```

---

## Task 4: Key Generation Benchmarks

**Files:**
- Create: `src/benchmarks/keygen.ts`
- Create: `test/benchmarks/keygen.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/benchmarks/keygen.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getKeygenBenchmarks } from '../src/benchmarks/keygen.js';
import type { BenchmarkResult } from '../src/types.js';

describe('keygen benchmarks', () => {
  it('returns results for all key generation algorithms', () => {
    const results = getKeygenBenchmarks(10);
    const algorithms = results.map((r) => r.algorithm);

    expect(algorithms).toContain('RSA-2048');
    expect(algorithms).toContain('RSA-4096');
    expect(algorithms).toContain('ECDH-P256');
    expect(algorithms).toContain('X25519');
    expect(algorithms).toContain('ECDSA-P256');
    expect(algorithms).toContain('Ed25519');
  });

  it('all results have operation keygen', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.operation).toBe('keygen');
    }
  });

  it('all results are local benchmarks, not reference', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
    }
  });

  it('all results are marked not quantum safe', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getKeygenBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/benchmarks/keygen.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement keygen benchmarks**

Create `src/benchmarks/keygen.ts`:

```typescript
import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

export function getKeygenBenchmarks(iterations: number): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // RSA-2048
  const rsa2048 = benchmark(() => {
    crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  }, iterations);
  results.push({
    algorithm: 'RSA-2048',
    operation: 'keygen',
    ...rsa2048,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // RSA-4096
  const rsa4096 = benchmark(() => {
    crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
  }, iterations);
  results.push({
    algorithm: 'RSA-4096',
    operation: 'keygen',
    ...rsa4096,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // ECDH-P256
  const ecdhP256 = benchmark(() => {
    crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  }, iterations);
  results.push({
    algorithm: 'ECDH-P256',
    operation: 'keygen',
    ...ecdhP256,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // X25519
  const x25519 = benchmark(() => {
    crypto.generateKeyPairSync('x25519');
  }, iterations);
  results.push({
    algorithm: 'X25519',
    operation: 'keygen',
    ...x25519,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // ECDSA-P256 (keygen only — sign/verify in sign-verify.ts)
  const ecdsaP256 = benchmark(() => {
    crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  }, iterations);
  results.push({
    algorithm: 'ECDSA-P256',
    operation: 'keygen',
    ...ecdsaP256,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // Ed25519 (keygen only — sign/verify in sign-verify.ts)
  const ed25519 = benchmark(() => {
    crypto.generateKeyPairSync('ed25519');
  }, iterations);
  results.push({
    algorithm: 'Ed25519',
    operation: 'keygen',
    ...ed25519,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/benchmarks/keygen.test.ts`
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/benchmarks/keygen.ts test/benchmarks/keygen.test.ts
git commit -m "feat: add key generation benchmarks (RSA, ECDH, X25519)"
```

---

## Task 5: Sign/Verify Benchmarks

**Files:**
- Create: `src/benchmarks/sign-verify.ts`
- Create: `test/benchmarks/sign-verify.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/benchmarks/sign-verify.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getSignVerifyBenchmarks } from '../src/benchmarks/sign-verify.js';

describe('sign/verify benchmarks', () => {
  it('returns results for all signature algorithms and operations', () => {
    const results = getSignVerifyBenchmarks(10);
    const keys = results.map((r) => `${r.algorithm}:${r.operation}`);

    expect(keys).toContain('RSA-2048:sign');
    expect(keys).toContain('RSA-2048:verify');
    expect(keys).toContain('ECDSA-P256:sign');
    expect(keys).toContain('ECDSA-P256:verify');
    expect(keys).toContain('Ed25519:sign');
    expect(keys).toContain('Ed25519:verify');
    // keygen is NOT included here — it's benchmarked in keygen.ts to avoid duplication
  });

  it('all results are local and not quantum safe', () => {
    const results = getSignVerifyBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getSignVerifyBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/benchmarks/sign-verify.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement sign/verify benchmarks**

Create `src/benchmarks/sign-verify.ts`:

```typescript
import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.from('The quick brown fox jumps over the lazy dog');

function signVerifySuite(
  algorithm: string,
  keygenFn: () => { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject },
  signFn: (privateKey: crypto.KeyObject) => Buffer,
  verifyFn: (publicKey: crypto.KeyObject, signature: Buffer) => boolean,
  iterations: number,
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // Generate a key pair for sign/verify (keygen benchmarked separately in keygen.ts)
  const { publicKey, privateKey } = keygenFn();

  const signTiming = benchmark(() => { signFn(privateKey); }, iterations);
  results.push({
    algorithm, operation: 'sign', ...signTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  const signature = signFn(privateKey);

  const verifyTiming = benchmark(() => { verifyFn(publicKey, signature); }, iterations);
  results.push({
    algorithm, operation: 'verify', ...verifyTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  return results;
}

export function getSignVerifyBenchmarks(iterations: number): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // RSA-2048
  results.push(...signVerifySuite(
    'RSA-2048',
    () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }),
    (privateKey) => crypto.sign('sha256', TEST_DATA, privateKey),
    (publicKey, sig) => crypto.verify('sha256', TEST_DATA, publicKey, sig),
    iterations,
  ));

  // ECDSA-P256
  results.push(...signVerifySuite(
    'ECDSA-P256',
    () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }),
    (privateKey) => crypto.sign('sha256', TEST_DATA, { key: privateKey, dsaEncoding: 'ieee-p1363' }),
    (publicKey, sig) => crypto.verify('sha256', TEST_DATA, { key: publicKey, dsaEncoding: 'ieee-p1363' }, sig),
    iterations,
  ));

  // Ed25519
  results.push(...signVerifySuite(
    'Ed25519',
    () => crypto.generateKeyPairSync('ed25519'),
    (privateKey) => crypto.sign(null, TEST_DATA, privateKey),
    (publicKey, sig) => crypto.verify(null, TEST_DATA, publicKey, sig),
    iterations,
  ));

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/benchmarks/sign-verify.test.ts`
Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
git add src/benchmarks/sign-verify.ts test/benchmarks/sign-verify.test.ts
git commit -m "feat: add sign/verify benchmarks (RSA, ECDSA, Ed25519)"
```

---

## Task 6: Encrypt/Decrypt Benchmarks

**Files:**
- Create: `src/benchmarks/encrypt-decrypt.ts`
- Create: `test/benchmarks/encrypt-decrypt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/benchmarks/encrypt-decrypt.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getEncryptDecryptBenchmarks } from '../src/benchmarks/encrypt-decrypt.js';

describe('encrypt/decrypt benchmarks', () => {
  it('returns results for AES-128-GCM and AES-256-GCM', () => {
    const results = getEncryptDecryptBenchmarks(10);
    const keys = results.map((r) => `${r.algorithm}:${r.operation}`);

    expect(keys).toContain('AES-128-GCM:encrypt');
    expect(keys).toContain('AES-128-GCM:decrypt');
    expect(keys).toContain('AES-256-GCM:encrypt');
    expect(keys).toContain('AES-256-GCM:decrypt');
  });

  it('all results are local and not quantum safe', () => {
    const results = getEncryptDecryptBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      // AES symmetric ciphers are not quantum safe at these key sizes per spec categorization
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getEncryptDecryptBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/benchmarks/encrypt-decrypt.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement encrypt/decrypt benchmarks**

Create `src/benchmarks/encrypt-decrypt.ts`:

```typescript
import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.alloc(1024, 'a');

function aesSuite(
  algorithm: string,
  cipherName: string,
  keyLength: number,
  iterations: number,
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const key = crypto.randomBytes(keyLength);

  const encryptTiming = benchmark(() => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(cipherName, key, iv, { authTagLength: 16 });
    cipher.update(TEST_DATA);
    cipher.final();
    cipher.getAuthTag();
  }, iterations);
  results.push({
    algorithm, operation: 'encrypt', ...encryptTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  // Prepare a ciphertext for decryption benchmarking
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(cipherName, key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(TEST_DATA), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const decryptTiming = benchmark(() => {
    const decipher = crypto.createDecipheriv(cipherName, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    decipher.update(encrypted);
    decipher.final();
  }, iterations);
  results.push({
    algorithm, operation: 'decrypt', ...decryptTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  return results;
}

export function getEncryptDecryptBenchmarks(iterations: number): BenchmarkResult[] {
  return [
    ...aesSuite('AES-128-GCM', 'aes-128-gcm', 16, iterations),
    ...aesSuite('AES-256-GCM', 'aes-256-gcm', 32, iterations),
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/benchmarks/encrypt-decrypt.test.ts`
Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
git add src/benchmarks/encrypt-decrypt.ts test/benchmarks/encrypt-decrypt.test.ts
git commit -m "feat: add AES-GCM encrypt/decrypt benchmarks"
```

---

## Task 7: Hash Benchmarks

**Files:**
- Create: `src/benchmarks/hash.ts`
- Create: `test/benchmarks/hash.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/benchmarks/hash.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getHashBenchmarks } from '../src/benchmarks/hash.js';

describe('hash benchmarks', () => {
  it('returns results for all hash algorithms', () => {
    const results = getHashBenchmarks(10);
    const algorithms = results.map((r) => r.algorithm);

    expect(algorithms).toContain('MD5');
    expect(algorithms).toContain('SHA-256');
    expect(algorithms).toContain('SHA-512');
    expect(algorithms).toContain('SHA3-256');
  });

  it('all results have operation hash', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.operation).toBe('hash');
    }
  });

  it('all results are local and not quantum safe', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/benchmarks/hash.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement hash benchmarks**

Create `src/benchmarks/hash.ts`:

```typescript
import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.alloc(1024, 'a');

export function getHashBenchmarks(iterations: number): BenchmarkResult[] {
  const hashes: Array<{ algorithm: string; nodeName: string }> = [
    { algorithm: 'MD5', nodeName: 'md5' },
    { algorithm: 'SHA-256', nodeName: 'sha256' },
    { algorithm: 'SHA-512', nodeName: 'sha512' },
    { algorithm: 'SHA3-256', nodeName: 'sha3-256' },
  ];

  return hashes.map(({ algorithm, nodeName }) => {
    const timing = benchmark(() => {
      crypto.createHash(nodeName).update(TEST_DATA).digest();
    }, iterations);

    return {
      algorithm,
      operation: 'hash' as const,
      ...timing,
      iterations,
      isReference: false,
      quantumSafe: false,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/benchmarks/hash.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/benchmarks/hash.ts test/benchmarks/hash.test.ts
git commit -m "feat: add hash benchmarks (MD5, SHA-256, SHA-512, SHA3-256)"
```

---

## Task 8: PQC Reference Data

**Files:**
- Create: `src/reference/pqc-data.ts`
- Create: `test/reference/pqc-data.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/reference/pqc-data.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getPqcReferenceResults, getPqcProfiles } from '../src/reference/pqc-data.js';
import type { BenchmarkResult, AlgorithmProfile } from '../src/types.js';

describe('PQC reference data', () => {
  describe('getPqcReferenceResults', () => {
    it('returns results for ML-KEM variants', () => {
      const results = getPqcReferenceResults();
      const mlKem = results.filter((r) => r.algorithm.startsWith('ML-KEM'));
      expect(mlKem.length).toBeGreaterThanOrEqual(5);
    });

    it('returns results for ML-DSA variants', () => {
      const results = getPqcReferenceResults();
      const mlDsa = results.filter((r) => r.algorithm.startsWith('ML-DSA'));
      expect(mlDsa.length).toBeGreaterThanOrEqual(5);
    });

    it('returns results for SLH-DSA', () => {
      const results = getPqcReferenceResults();
      const slhDsa = results.filter((r) => r.algorithm.startsWith('SLH-DSA'));
      expect(slhDsa.length).toBeGreaterThanOrEqual(3);
    });

    it('all results are reference and quantum safe', () => {
      const results = getPqcReferenceResults();
      for (const r of results) {
        expect(r.isReference).toBe(true);
        expect(r.quantumSafe).toBe(true);
      }
    });

    it('all results have positive timing values', () => {
      const results = getPqcReferenceResults();
      for (const r of results) {
        expect(r.opsPerSecond).toBeGreaterThan(0);
        expect(r.avgTimeMs).toBeGreaterThan(0);
      }
    });
  });

  describe('getPqcProfiles', () => {
    it('returns profiles for all PQC algorithms', () => {
      const profiles = getPqcProfiles();
      const algorithms = profiles.map((p) => p.algorithm);

      expect(algorithms).toContain('ML-KEM-512');
      expect(algorithms).toContain('ML-KEM-768');
      expect(algorithms).toContain('ML-KEM-1024');
      expect(algorithms).toContain('ML-DSA-44');
      expect(algorithms).toContain('ML-DSA-65');
      expect(algorithms).toContain('ML-DSA-87');
      expect(algorithms).toContain('SLH-DSA-128s');
    });

    it('all profiles are quantum safe', () => {
      const profiles = getPqcProfiles();
      for (const p of profiles) {
        expect(p.quantumSafe).toBe(true);
      }
    });

    it('KEM profiles have ciphertextSize', () => {
      const profiles = getPqcProfiles();
      const kems = profiles.filter((p) => p.algorithm.startsWith('ML-KEM'));
      for (const p of kems) {
        expect(p.ciphertextSize).toBeGreaterThan(0);
      }
    });

    it('DSA profiles have signatureSize', () => {
      const profiles = getPqcProfiles();
      const dsas = profiles.filter((p) =>
        p.algorithm.startsWith('ML-DSA') || p.algorithm.startsWith('SLH-DSA')
      );
      for (const p of dsas) {
        expect(p.signatureSize).toBeGreaterThan(0);
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/reference/pqc-data.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PQC reference data**

Create `src/reference/pqc-data.ts`:

```typescript
import type { BenchmarkResult, AlgorithmProfile } from '../types.js';

interface ReferenceEntry {
  algorithm: string;
  operation: BenchmarkResult['operation'];
  avgTimeMs: number;
}

// NIST PQC standardization, Round 3 reference implementations (Skylake)
const REFERENCE_ENTRIES: ReferenceEntry[] = [
  // ML-KEM (FIPS 203) — Lattice-based Key Encapsulation
  { algorithm: 'ML-KEM-512', operation: 'keygen', avgTimeMs: 0.03 },
  { algorithm: 'ML-KEM-768', operation: 'keygen', avgTimeMs: 0.05 },
  { algorithm: 'ML-KEM-1024', operation: 'keygen', avgTimeMs: 0.07 },
  { algorithm: 'ML-KEM-768', operation: 'encaps', avgTimeMs: 0.06 },
  { algorithm: 'ML-KEM-768', operation: 'decaps', avgTimeMs: 0.07 },

  // ML-DSA (FIPS 204) — Lattice-based Digital Signatures
  { algorithm: 'ML-DSA-44', operation: 'keygen', avgTimeMs: 0.08 },
  { algorithm: 'ML-DSA-65', operation: 'keygen', avgTimeMs: 0.13 },
  { algorithm: 'ML-DSA-87', operation: 'keygen', avgTimeMs: 0.18 },
  { algorithm: 'ML-DSA-65', operation: 'sign', avgTimeMs: 0.30 },
  { algorithm: 'ML-DSA-65', operation: 'verify', avgTimeMs: 0.14 },

  // SLH-DSA (FIPS 205) — Hash-based Digital Signatures
  { algorithm: 'SLH-DSA-128s', operation: 'keygen', avgTimeMs: 2.5 },
  { algorithm: 'SLH-DSA-128s', operation: 'sign', avgTimeMs: 45 },
  { algorithm: 'SLH-DSA-128s', operation: 'verify', avgTimeMs: 2.8 },
];

export function getPqcReferenceResults(): BenchmarkResult[] {
  return REFERENCE_ENTRIES.map((entry) => ({
    algorithm: entry.algorithm,
    operation: entry.operation,
    avgTimeMs: entry.avgTimeMs,
    opsPerSecond: Math.round(1000 / entry.avgTimeMs),
    iterations: 0,
    isReference: true,
    quantumSafe: true,
  }));
}

const PQC_PROFILES: AlgorithmProfile[] = [
  // ML-KEM variants
  {
    algorithm: 'ML-KEM-512',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 800,
    privateKeySize: 1632,
    ciphertextSize: 768,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 1)',
  },
  {
    algorithm: 'ML-KEM-768',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1184,
    privateKeySize: 2400,
    ciphertextSize: 1088,
    securityLevel: '192-bit classical, 192-bit quantum (NIST Level 3)',
  },
  {
    algorithm: 'ML-KEM-1024',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1568,
    privateKeySize: 3168,
    ciphertextSize: 1568,
    securityLevel: '256-bit classical, 256-bit quantum (NIST Level 5)',
  },

  // ML-DSA variants
  {
    algorithm: 'ML-DSA-44',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1312,
    privateKeySize: 2528,
    signatureSize: 2420,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 2)',
  },
  {
    algorithm: 'ML-DSA-65',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1952,
    privateKeySize: 4000,
    signatureSize: 3293,
    securityLevel: '192-bit classical, 192-bit quantum (NIST Level 3)',
  },
  {
    algorithm: 'ML-DSA-87',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 2592,
    privateKeySize: 4864,
    signatureSize: 4595,
    securityLevel: '256-bit classical, 256-bit quantum (NIST Level 5)',
  },

  // SLH-DSA
  {
    algorithm: 'SLH-DSA-128s',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 32,
    privateKeySize: 64,
    signatureSize: 7856,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 1)',
  },
];

export function getPqcProfiles(): AlgorithmProfile[] {
  return PQC_PROFILES;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/reference/pqc-data.test.ts`
Expected: PASS — all 9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/reference/pqc-data.ts test/reference/pqc-data.test.ts
git commit -m "feat: add NIST PQC reference data (ML-KEM, ML-DSA, SLH-DSA)"
```

---

## Task 9: Educational Comparisons

**Files:**
- Create: `src/education/comparisons.ts`
- Create: `test/education/comparisons.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/education/comparisons.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getComparisons } from '../src/education/comparisons.js';
import type { Comparison } from '../src/types.js';

describe('educational comparisons', () => {
  it('returns all 5 comparison pairs', () => {
    const comparisons = getComparisons();
    expect(comparisons).toHaveLength(5);
  });

  it('includes RSA-2048 → ML-KEM-768', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'RSA-2048' && c.postQuantum === 'ML-KEM-768'
    );
    expect(match).toBeDefined();
    expect(match!.speedup).toBeTruthy();
    expect(match!.sizeTradeoff).toBeTruthy();
    expect(match!.explanation).toBeTruthy();
  });

  it('includes ECDSA-P256 → ML-DSA-65', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'ECDSA-P256' && c.postQuantum === 'ML-DSA-65'
    );
    expect(match).toBeDefined();
  });

  it('includes ECDH-P256 → ML-KEM-768', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'ECDH-P256' && c.postQuantum === 'ML-KEM-768'
    );
    expect(match).toBeDefined();
  });

  it('includes Ed25519 → ML-DSA-44', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'Ed25519' && c.postQuantum === 'ML-DSA-44'
    );
    expect(match).toBeDefined();
  });

  it('includes RSA-2048 → SLH-DSA-128s', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'RSA-2048' && c.postQuantum === 'SLH-DSA-128s'
    );
    expect(match).toBeDefined();
  });

  it('all comparisons have non-empty explanations', () => {
    const comparisons = getComparisons();
    for (const c of comparisons) {
      expect(c.explanation.length).toBeGreaterThan(50);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/education/comparisons.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement educational comparisons**

Create `src/education/comparisons.ts`:

```typescript
import type { Comparison } from '../types.js';

const COMPARISONS: Comparison[] = [
  {
    classical: 'RSA-2048',
    postQuantum: 'ML-KEM-768',
    speedup: 'ML-KEM-768 is ~1000x faster at key generation than RSA-2048',
    sizeTradeoff: 'Public keys are 4x larger (1184B vs 294B), but ciphertext is smaller (1088B vs 256B)',
    explanation:
      'RSA key generation requires finding two large primes and is computationally expensive. ' +
      'ML-KEM (formerly Kyber) uses structured lattice problems — key generation is just matrix arithmetic, ' +
      'making it dramatically faster. The tradeoff is larger keys, but the speed difference is so vast that ' +
      'ML-KEM is practical even with the size increase. RSA is broken by Shor\'s algorithm on a quantum computer; ' +
      'ML-KEM is believed resistant to both classical and quantum attacks.',
  },
  {
    classical: 'ECDSA-P256',
    postQuantum: 'ML-DSA-65',
    speedup: 'ML-DSA-65 signs ~2x slower but verifies ~2x faster than ECDSA-P256',
    sizeTradeoff: 'Signatures are ~50x larger (3293B vs 64B) and public keys are ~30x larger (1952B vs 65B)',
    explanation:
      'ECDSA relies on the elliptic curve discrete logarithm problem, which Shor\'s algorithm breaks efficiently. ' +
      'ML-DSA (formerly Dilithium) uses lattice-based math for signatures. Signing is slightly slower because of ' +
      'rejection sampling (the algorithm may retry internally), but verification is faster — a useful property since ' +
      'signatures are verified far more often than they are created. The big tradeoff is size: ML-DSA signatures ' +
      'and keys are much larger, which matters for bandwidth-constrained protocols like TLS.',
  },
  {
    classical: 'ECDH-P256',
    postQuantum: 'ML-KEM-768',
    speedup: 'ML-KEM-768 encapsulation is comparable in speed to ECDH key agreement',
    sizeTradeoff: 'Public keys are ~18x larger (1184B vs 65B), ciphertext is 1088B vs ~65B for ECDH shared point',
    explanation:
      'ECDH derives a shared secret from two parties\' public keys using elliptic curve math. ' +
      'ML-KEM replaces this with a Key Encapsulation Mechanism: one party generates a shared secret and ' +
      '"encapsulates" it using the other\'s public key. The operational speed is similar, but the protocol ' +
      'flow changes from interactive key agreement to encapsulate/decapsulate. Keys and ciphertexts are larger, ' +
      'which adds bandwidth cost in TLS handshakes.',
  },
  {
    classical: 'Ed25519',
    postQuantum: 'ML-DSA-44',
    speedup: 'ML-DSA-44 is ~3-5x slower to sign and ~2x slower to verify than Ed25519',
    sizeTradeoff: 'Signatures are ~38x larger (2420B vs 64B) and public keys are ~41x larger (1312B vs 32B)',
    explanation:
      'Ed25519 is one of the fastest classical signature schemes, using the Edwards curve over a prime field. ' +
      'ML-DSA-44 is the smallest/fastest ML-DSA variant, targeting NIST Level 2 security. ' +
      'The speed gap is noticeable — Ed25519 is highly optimized for speed and compactness. The size difference ' +
      'is dramatic and matters most for applications that embed signatures in small payloads (JWTs, blockchain transactions). ' +
      'However, Ed25519 is completely broken by quantum computers, while ML-DSA-44 is not.',
  },
  {
    classical: 'RSA-2048',
    postQuantum: 'SLH-DSA-128s',
    speedup: 'SLH-DSA-128s is ~10x slower to sign than RSA-2048, but keygen is comparable',
    sizeTradeoff: 'Signatures are enormous (7856B vs 256B) but keys are tiny (32B pk vs 294B)',
    explanation:
      'SLH-DSA (formerly SPHINCS+) is the conservative choice — it relies only on hash function security, ' +
      'making it the simplest assumption in post-quantum crypto. Unlike lattice-based schemes, there is no ' +
      'concern about future lattice-breaking advances. The cost is speed: signing is slow because it builds ' +
      'a hash tree for each signature. Verification is moderate. The unique advantage is tiny keys (just hash seeds) ' +
      'but the signatures themselves are very large. Best suited for applications where signing is infrequent ' +
      'but long-term security assurance is critical (firmware updates, code signing, certificates).',
  },
];

export function getComparisons(): Comparison[] {
  return COMPARISONS;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/education/comparisons.test.ts`
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/education/comparisons.ts test/education/comparisons.test.ts
git commit -m "feat: add educational comparisons for classical → PQC pairs"
```

---

## Task 10: JSON Reporter

**Files:**
- Create: `src/reporters/json.ts`
- Create: `test/reporters/json.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/reporters/json.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatJson } from '../src/reporters/json.js';
import type { BenchmarkReport } from '../src/types.js';

describe('JSON reporter', () => {
  const report: BenchmarkReport = {
    id: 'test-123',
    runAt: '2026-03-27T00:00:00Z',
    platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
    iterations: 1000,
    results: [
      {
        algorithm: 'RSA-2048', operation: 'keygen',
        opsPerSecond: 500, avgTimeMs: 2.0,
        iterations: 1000, isReference: false, quantumSafe: false,
      },
    ],
    profiles: [],
    comparisons: [
      {
        classical: 'RSA-2048', postQuantum: 'ML-KEM-768',
        speedup: 'fast', sizeTradeoff: 'bigger', explanation: 'test',
      },
    ],
  };

  it('returns valid JSON string', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed).toBeDefined();
  });

  it('preserves all report fields', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe('test-123');
    expect(parsed.results).toHaveLength(1);
    expect(parsed.comparisons).toHaveLength(1);
    expect(parsed.platform.os).toBe('darwin');
  });

  it('is pretty-printed with 2-space indent', () => {
    const output = formatJson(report);
    expect(output).toContain('\n');
    expect(output).toContain('  "id"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/reporters/json.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement JSON reporter**

Create `src/reporters/json.ts`:

```typescript
import type { BenchmarkReport } from '../types.js';

export function formatJson(report: BenchmarkReport): string {
  return JSON.stringify(report, null, 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/reporters/json.test.ts`
Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
git add src/reporters/json.ts test/reporters/json.test.ts
git commit -m "feat: add JSON reporter"
```

---

## Task 11: Terminal Reporter

**Files:**
- Create: `src/reporters/terminal.ts`
- Create: `test/reporters/terminal.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/reporters/terminal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/reporters/terminal.js';
import type { BenchmarkReport } from '../src/types.js';

describe('terminal reporter', () => {
  const report: BenchmarkReport = {
    id: 'test-123',
    runAt: '2026-03-27T00:00:00Z',
    platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
    iterations: 1000,
    results: [
      {
        algorithm: 'RSA-2048', operation: 'keygen',
        opsPerSecond: 500, avgTimeMs: 2.0,
        iterations: 1000, isReference: false, quantumSafe: false,
      },
      {
        algorithm: 'ML-KEM-768', operation: 'keygen',
        opsPerSecond: 20000, avgTimeMs: 0.05,
        iterations: 0, isReference: true, quantumSafe: true,
      },
    ],
    profiles: [],
    comparisons: [
      {
        classical: 'RSA-2048', postQuantum: 'ML-KEM-768',
        speedup: 'ML-KEM is 40x faster', sizeTradeoff: 'keys 4x larger',
        explanation: 'RSA relies on factoring...',
      },
    ],
  };

  it('includes header', () => {
    const output = formatTerminal(report);
    expect(output).toContain('qcrypt-bench');
  });

  it('includes platform info', () => {
    const output = formatTerminal(report);
    expect(output).toContain('darwin');
    expect(output).toContain('arm64');
  });

  it('includes benchmark results', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA-2048');
    expect(output).toContain('keygen');
    expect(output).toContain('500');
  });

  it('marks reference data', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM-768');
    // Reference data should be distinguished somehow
    expect(output).toMatch(/ref|reference|NIST/i);
  });

  it('includes comparisons section', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM is 40x faster');
    expect(output).toContain('RSA relies on factoring');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/reporters/terminal.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement terminal reporter**

Create `src/reporters/terminal.ts`:

```typescript
import chalk from 'chalk';
import type { BenchmarkReport, BenchmarkResult } from '../types.js';

function header(): string {
  return [
    '',
    chalk.bold.green('  qcrypt-bench') + '  Post-Quantum Cryptography Benchmark',
    chalk.dim('  ─'.repeat(28)),
    '',
  ].join('\n');
}

function platformSection(platform: BenchmarkReport['platform']): string {
  return [
    chalk.bold('  Platform'),
    `    OS:    ${platform.os} ${platform.arch}`,
    `    Node:  ${platform.node}`,
    `    CPU:   ${platform.cpuModel}`,
    '',
  ].join('\n');
}

function resultRow(r: BenchmarkResult): string {
  const source = r.isReference ? chalk.dim(' (NIST ref)') : '';
  const qsafe = r.quantumSafe ? chalk.green(' ✓') : chalk.red(' ✗');
  const algo = r.algorithm.padEnd(16);
  const op = r.operation.padEnd(10);
  const ops = String(r.opsPerSecond).padStart(12);
  const avg = r.avgTimeMs.toFixed(4).padStart(12);

  return `    ${algo} ${op} ${ops} ops/s  ${avg} ms${qsafe}${source}`;
}

function resultsSection(results: BenchmarkResult[], iterations: number): string {
  const lines = [
    chalk.bold('  Benchmark Results') + chalk.dim(` (${iterations} iterations)`),
    '',
    chalk.dim('    Algorithm        Operation     ops/sec       avg ms  QS'),
    chalk.dim('    ' + '─'.repeat(68)),
  ];

  // Group by category
  const local = results.filter((r) => !r.isReference);
  const reference = results.filter((r) => r.isReference);

  if (local.length > 0) {
    lines.push(chalk.bold.dim('    ── Classical (local) ──'));
    for (const r of local) lines.push(resultRow(r));
  }

  if (reference.length > 0) {
    lines.push('');
    lines.push(chalk.bold.dim('    ── Post-Quantum (NIST reference) ──'));
    for (const r of reference) lines.push(resultRow(r));
  }

  lines.push('');
  return lines.join('\n');
}

function comparisonsSection(comparisons: BenchmarkReport['comparisons']): string {
  if (comparisons.length === 0) return '';

  const lines = [
    chalk.bold('  Comparisons'),
    '',
  ];

  for (const c of comparisons) {
    lines.push(chalk.bold(`    ${c.classical} → ${c.postQuantum}`));
    lines.push(chalk.green(`      Speed:  ${c.speedup}`));
    lines.push(chalk.yellow(`      Size:   ${c.sizeTradeoff}`));
    lines.push(chalk.dim(`      ${c.explanation}`));
    lines.push('');
  }

  return lines.join('\n');
}

export function formatTerminal(report: BenchmarkReport): string {
  return [
    header(),
    platformSection(report.platform),
    resultsSection(report.results, report.iterations),
    comparisonsSection(report.comparisons),
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/reporters/terminal.test.ts`
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add src/reporters/terminal.ts test/reporters/terminal.test.ts
git commit -m "feat: add terminal reporter with chalk formatting"
```

---

## Task 12: Core Orchestrator

**Files:**
- Create: `src/index.ts`
- Create: `test/index.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { runBenchmarks } from '../src/index.js';
import type { BenchmarkReport, BenchmarkCategory } from '../src/types.js';

describe('runBenchmarks', () => {
  it('returns a complete BenchmarkReport with all fields', () => {
    const report = runBenchmarks({ iterations: 5, category: 'all' });

    expect(report.id).toBeTruthy();
    expect(report.runAt).toBeTruthy();
    expect(report.platform.os).toBeTruthy();
    expect(report.platform.arch).toBeTruthy();
    expect(report.platform.node).toBeTruthy();
    expect(report.platform.cpuModel).toBeTruthy();
    expect(report.iterations).toBe(5);
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.profiles.length).toBeGreaterThan(0);
    expect(report.comparisons.length).toBeGreaterThan(0);
  });

  it('includes both local and reference results when category is all', () => {
    const report = runBenchmarks({ iterations: 5, category: 'all' });

    const local = report.results.filter((r) => !r.isReference);
    const reference = report.results.filter((r) => r.isReference);

    expect(local.length).toBeGreaterThan(0);
    expect(reference.length).toBeGreaterThan(0);
  });

  it('filters to kex category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'kex' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('keygen');
    // Should not have hash or encrypt operations from other categories
    expect(operations).not.toContain('hash');
  });

  it('filters to sigs category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'sigs' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('sign');
    expect(operations).toContain('verify');
  });

  it('filters to sym category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'sym' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('encrypt');
    expect(operations).toContain('decrypt');
  });

  it('filters to hash category', () => {
    const report = runBenchmarks({ iterations: 5, category: 'hash' });

    const operations = new Set(report.results.map((r) => r.operation));
    expect(operations).toContain('hash');
    expect(operations).not.toContain('keygen');
  });

  it('generates unique IDs for each run', () => {
    const report1 = runBenchmarks({ iterations: 5, category: 'hash' });
    const report2 = runBenchmarks({ iterations: 5, category: 'hash' });
    expect(report1.id).not.toBe(report2.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/index.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the orchestrator**

Create `src/index.ts`:

```typescript
import crypto from 'node:crypto';
import os from 'node:os';
import { getKeygenBenchmarks } from './benchmarks/keygen.js';
import { getSignVerifyBenchmarks } from './benchmarks/sign-verify.js';
import { getEncryptDecryptBenchmarks } from './benchmarks/encrypt-decrypt.js';
import { getHashBenchmarks } from './benchmarks/hash.js';
import { getPqcReferenceResults, getPqcProfiles } from './reference/pqc-data.js';
import { getComparisons } from './education/comparisons.js';
import type { BenchmarkCategory, BenchmarkReport, BenchmarkResult } from './types.js';

export interface RunOptions {
  iterations: number;
  category: BenchmarkCategory;
}

// Which PQC reference results to include for each category
const PQC_CATEGORY_PREFIXES: Record<BenchmarkCategory, string[]> = {
  all: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
  kex: ['ML-KEM'],
  sigs: ['ML-DSA', 'SLH-DSA'],
  sym: [],
  hash: [],
};

function filterPqcResults(
  allPqc: BenchmarkResult[],
  category: BenchmarkCategory,
): BenchmarkResult[] {
  const prefixes = PQC_CATEGORY_PREFIXES[category];
  if (prefixes.length === 0) return [];
  return allPqc.filter((r) => prefixes.some((p) => r.algorithm.startsWith(p)));
}

export function runBenchmarks(options: RunOptions): BenchmarkReport {
  const { iterations, category } = options;
  const localResults: BenchmarkResult[] = [];

  if (category === 'all' || category === 'kex') {
    localResults.push(...getKeygenBenchmarks(iterations));
  }

  if (category === 'all' || category === 'sigs') {
    localResults.push(...getSignVerifyBenchmarks(iterations));
  }

  if (category === 'all' || category === 'sym') {
    localResults.push(...getEncryptDecryptBenchmarks(iterations));
  }

  if (category === 'all' || category === 'hash') {
    localResults.push(...getHashBenchmarks(iterations));
  }

  const pqcResults = filterPqcResults(getPqcReferenceResults(), category);
  const profiles = getPqcProfiles();
  const comparisons = getComparisons();

  const cpus = os.cpus();

  return {
    id: crypto.randomUUID(),
    runAt: new Date().toISOString(),
    platform: {
      os: process.platform,
      arch: process.arch,
      node: process.version,
      cpuModel: cpus.length > 0 ? cpus[0].model : 'unknown',
    },
    iterations,
    results: [...localResults, ...pqcResults],
    profiles,
    comparisons,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/index.test.ts`
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/index.ts test/index.test.ts
git commit -m "feat: add core orchestrator with category filtering"
```

---

## Task 13: CLI Entry Point

**Files:**
- Create: `src/cli.ts`
- Create: `test/e2e/cli.test.ts`

- [ ] **Step 1: Write failing E2E test**

Create `test/e2e/cli.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const CLI = 'npx tsx src/cli.ts';

describe('E2E: CLI', () => {
  it('runs with default options and produces terminal output', () => {
    const output = execSync(`${CLI} --iterations 5`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    expect(output).toContain('qcrypt-bench');
    expect(output).toContain('RSA-2048');
  });

  it('runs with --json flag and produces valid JSON', () => {
    const output = execSync(`${CLI} --iterations 5 --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.id).toBeTruthy();
    expect(parsed.results.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const output = execSync(`${CLI} --iterations 5 --category hash --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    const operations = parsed.results.map((r: { operation: string }) => r.operation);
    expect(operations).toContain('hash');
    expect(operations).not.toContain('keygen');
  });

  it('respects --iterations flag', () => {
    const output = execSync(`${CLI} --iterations 3 --category hash --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.iterations).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/e2e/cli.test.ts`
Expected: FAIL — CLI file not found

- [ ] **Step 3: Implement CLI**

Create `src/cli.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { runBenchmarks } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { createServer } from './api/server.js';
import type { BenchmarkCategory } from './types.js';

const VALID_CATEGORIES: BenchmarkCategory[] = ['all', 'kex', 'sigs', 'sym', 'hash'];

const program = new Command()
  .name('qcrypt-bench')
  .description('Benchmark classical crypto and compare with post-quantum alternatives')
  .option('--iterations <n>', 'number of benchmark iterations', '1000')
  .option('--category <cat>', 'benchmark category: all, kex, sigs, sym, hash', 'all')
  .option('--json', 'output as JSON')
  .option('--serve', 'start web UI server')
  .option('--port <n>', 'server port', '3200');

program.parse();

const opts = program.opts();

async function main() {
  if (opts.serve) {
    const port = parseInt(opts.port, 10);
    const app = createServer();
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`qcrypt-bench server running on http://localhost:${port}`);
    return;
  }

  const iterations = parseInt(opts.iterations, 10);
  const category = opts.category as BenchmarkCategory;

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`Invalid category: ${category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    process.exit(2);
  }

  const report = runBenchmarks({ iterations, category });

  if (opts.json) {
    console.log(formatJson(report));
  } else {
    console.log(formatTerminal(report));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
```

Note: This references `createServer` from `src/api/server.ts` which doesn't exist yet. Create a stub so the CLI module loads without error:

Create `src/api/server.ts` (stub):

```typescript
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/e2e/cli.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts src/api/server.ts test/e2e/cli.test.ts
git commit -m "feat: add CLI entry point with category and format flags"
```

---

## Task 14: API Server

**Files:**
- Modify: `src/api/server.ts`
- Create: `test/e2e/api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/e2e/api.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/api/server.js';

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

  it('POST /api/bench runs benchmarks and returns report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.iterations).toBe(5);
  });

  it('POST /api/bench defaults to 1000 iterations when not specified', async () => {
    // Use hash category to keep this fast — we just need to verify the default
    const res = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { category: 'hash' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.iterations).toBe(1000);
  });

  it('GET /api/bench/history returns list of past runs', async () => {
    // Run a bench first to populate history
    await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/bench/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/bench/:id returns specific run', async () => {
    const benchRes = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });
    const { id } = benchRes.json();

    const res = await app.inject({ method: 'GET', url: `/api/bench/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('GET /api/bench/:id returns 404 for unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/bench/nonexistent' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/reference returns PQC reference data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/reference' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.profiles.length).toBeGreaterThan(0);
    for (const r of body.results) {
      expect(r.isReference).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/e2e/api.test.ts`
Expected: FAIL — `POST /api/bench` returns 404

- [ ] **Step 3: Implement full API server**

Replace `src/api/server.ts` with:

```typescript
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { runBenchmarks } from '../index.js';
import { getPqcReferenceResults, getPqcProfiles } from '../reference/pqc-data.js';
import type { BenchmarkCategory, BenchmarkReport } from '../types.js';

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const history: BenchmarkReport[] = [];

  // CORS for development
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.post<{ Body: { iterations?: number; category?: string } }>(
    '/api/bench',
    async (request) => {
      const iterations = request.body?.iterations ?? 1000;
      const category = (request.body?.category ?? 'all') as BenchmarkCategory;

      const report = runBenchmarks({ iterations, category });
      history.unshift(report);
      return report;
    },
  );

  app.get('/api/bench/history', async () => history);

  app.get<{ Params: { id: string } }>('/api/bench/:id', async (request, reply) => {
    const report = history.find((r) => r.id === request.params.id);
    if (!report) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return report;
  });

  app.get('/api/reference', async () => ({
    results: getPqcReferenceResults(),
    profiles: getPqcProfiles(),
  }));

  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/e2e/api.test.ts`
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/api/server.ts test/e2e/api.test.ts
git commit -m "feat: add Fastify API server with bench, history, and reference endpoints"
```

---

## Task 15: Run Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass — runner, keygen, sign-verify, encrypt-decrypt, hash, pqc-data, comparisons, json reporter, terminal reporter, index, CLI e2e, API e2e

- [ ] **Step 2: Verify CLI works end-to-end**

Run: `npx tsx src/cli.ts --iterations 10`
Expected: Formatted terminal output showing benchmarks and comparisons

Run: `npx tsx src/cli.ts --iterations 10 --json | head -20`
Expected: Pretty-printed JSON with id, platform, results

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found in full test run"
```

---

## Task 16: Web UI — Project Setup

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tailwind.config.js`
- Create: `web/postcss.config.js`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.app.json`
- Create: `web/tsconfig.node.json`
- Create: `web/index.html`
- Create: `web/src/index.css`
- Create: `web/src/main.tsx`

- [ ] **Step 1: Create web/package.json**

```json
{
  "name": "qcrypt-bench-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 2: Create web/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3200',
    },
  },
});
```

- [ ] **Step 3: Create web/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#00FF41',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create web/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create web/tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 6: Create web/tsconfig.app.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create web/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 8: Create web/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>qcrypt-bench</title>
  </head>
  <body class="bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-[#e0e0e0]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create web/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create web/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme.tsx';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 11: Install web dependencies**

Run: `cd web && npm install`
Expected: `node_modules/` created in web/

- [ ] **Step 12: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.ts web/tailwind.config.js web/postcss.config.js web/tsconfig.json web/tsconfig.app.json web/tsconfig.node.json web/index.html web/src/index.css web/src/main.tsx
git commit -m "chore: scaffold web UI with React, Vite, Tailwind"
```

---

## Task 17: Web UI — Theme, API Client, Layout

**Files:**
- Create: `web/src/theme.tsx`
- Create: `web/src/api.ts`
- Create: `web/src/components/Layout.tsx`
- Create: `web/src/components/Sidebar.tsx`
- Create: `web/src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create web/src/theme.tsx**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'dark' | 'light';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('qcrypt-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('qcrypt-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Create web/src/api.ts**

```typescript
interface BenchmarkResult {
  algorithm: string;
  operation: string;
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;
  quantumSafe: boolean;
}

interface AlgorithmProfile {
  algorithm: string;
  category: string;
  quantumSafe: boolean;
  publicKeySize: number;
  privateKeySize: number;
  signatureSize?: number;
  ciphertextSize?: number;
  securityLevel: string;
}

interface Comparison {
  classical: string;
  postQuantum: string;
  speedup: string;
  sizeTradeoff: string;
  explanation: string;
}

export interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: { os: string; arch: string; node: string; cpuModel: string };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

export async function runBench(iterations: number, category: string): Promise<BenchmarkReport> {
  const res = await fetch('/api/bench', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iterations, category }),
  });
  return res.json();
}

export async function getBenchHistory(): Promise<BenchmarkReport[]> {
  const res = await fetch('/api/bench/history');
  return res.json();
}

export async function getBench(id: string): Promise<BenchmarkReport> {
  const res = await fetch(`/api/bench/${id}`);
  return res.json();
}

export async function getReference(): Promise<{ results: BenchmarkResult[]; profiles: AlgorithmProfile[] }> {
  const res = await fetch('/api/reference');
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('/api/health');
  return res.json();
}
```

- [ ] **Step 3: Create web/src/components/ThemeToggle.tsx**

```tsx
import { useTheme } from '../theme.tsx';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
```

- [ ] **Step 4: Create web/src/components/Sidebar.tsx**

```tsx
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/comparison', label: 'Comparison' },
  { to: '/education', label: 'Education' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-slate-200 dark:border-[#1a1a1a] p-4 flex flex-col gap-1">
      <div className="text-lg font-bold text-accent mb-4">qcrypt-bench</div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `block px-3 py-2 rounded text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}
```

- [ ] **Step 5: Create web/src/components/Layout.tsx**

```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import ThemeToggle from './ThemeToggle.tsx';

export default function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-[#1a1a1a]">
          <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Post-Quantum Cryptography Benchmark
          </h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add web/src/theme.tsx web/src/api.ts web/src/components/Layout.tsx web/src/components/Sidebar.tsx web/src/components/ThemeToggle.tsx
git commit -m "feat: add theme system, API client, and layout components"
```

---

## Task 18: Web UI — Dashboard Page

**Files:**
- Create: `web/src/components/ResultsTable.tsx`
- Create: `web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create web/src/components/ResultsTable.tsx**

```tsx
import type { BenchmarkReport } from '../api.ts';

interface Props {
  results: BenchmarkReport['results'];
}

export default function ResultsTable({ results }: Props) {
  const local = results.filter((r) => !r.isReference);
  const reference = results.filter((r) => r.isReference);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#333] text-left text-slate-500 dark:text-slate-400">
            <th className="pb-2 pr-4">Algorithm</th>
            <th className="pb-2 pr-4">Operation</th>
            <th className="pb-2 pr-4 text-right">ops/sec</th>
            <th className="pb-2 pr-4 text-right">avg ms</th>
            <th className="pb-2 pr-4 text-center">Quantum Safe</th>
            <th className="pb-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {local.length > 0 && (
            <tr>
              <td colSpan={6} className="pt-4 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Classical (local benchmark)
              </td>
            </tr>
          )}
          {local.map((r, i) => (
            <ResultRow key={`local-${i}`} result={r} />
          ))}
          {reference.length > 0 && (
            <tr>
              <td colSpan={6} className="pt-6 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Post-Quantum (NIST reference)
              </td>
            </tr>
          )}
          {reference.map((r, i) => (
            <ResultRow key={`ref-${i}`} result={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultRow({ result: r }: { result: BenchmarkReport['results'][number] }) {
  return (
    <tr className="border-b border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#111]">
      <td className="py-2 pr-4 font-mono">{r.algorithm}</td>
      <td className="py-2 pr-4">{r.operation}</td>
      <td className="py-2 pr-4 text-right font-mono">{r.opsPerSecond.toLocaleString()}</td>
      <td className="py-2 pr-4 text-right font-mono">{r.avgTimeMs.toFixed(4)}</td>
      <td className="py-2 pr-4 text-center">
        {r.quantumSafe ? (
          <span className="text-green-500">Yes</span>
        ) : (
          <span className="text-red-400">No</span>
        )}
      </td>
      <td className="py-2">
        {r.isReference ? (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            NIST ref
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            Local
          </span>
        )}
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Create web/src/pages/Dashboard.tsx**

```tsx
import { useState } from 'react';
import { runBench, type BenchmarkReport } from '../api.ts';
import ResultsTable from '../components/ResultsTable.tsx';

const CATEGORIES = ['all', 'kex', 'sigs', 'sym', 'hash'] as const;

export default function Dashboard() {
  const [iterations, setIterations] = useState(1000);
  const [category, setCategory] = useState<string>('all');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await runBench(iterations, category);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Benchmark failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Benchmark Dashboard</h2>

      <div className="flex items-end gap-4 mb-8">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Iterations</label>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-48"
          />
          <span className="ml-2 text-sm font-mono">{iterations}</span>
        </div>

        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] bg-white dark:bg-[#111] text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-1.5 rounded bg-accent text-black font-medium text-sm hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {running ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Platform: {report.platform.os} {report.platform.arch}</span>
            <span>CPU: {report.platform.cpuModel}</span>
            <span>Node: {report.platform.node}</span>
          </div>
          <ResultsTable results={report.results} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ResultsTable.tsx web/src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page with benchmark runner and results table"
```

---

## Task 19: Web UI — Comparison Page

**Files:**
- Create: `web/src/components/SpeedBar.tsx`
- Create: `web/src/components/SizeBadge.tsx`
- Create: `web/src/pages/Comparison.tsx`

- [ ] **Step 1: Create web/src/components/SpeedBar.tsx**

```tsx
interface Props {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export default function SpeedBar({ label, value, maxValue, color }: Props) {
  const width = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toLocaleString()} ops/s</span>
      </div>
      <div className="h-4 bg-slate-100 dark:bg-[#1a1a1a] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create web/src/components/SizeBadge.tsx**

```tsx
interface Props {
  label: string;
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export default function SizeBadge({ label, bytes }: Props) {
  return (
    <div className="inline-flex flex-col items-center px-3 py-2 rounded border border-slate-200 dark:border-[#333]">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-mono font-bold">{formatBytes(bytes)}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create web/src/pages/Comparison.tsx**

```tsx
import { useEffect, useState } from 'react';
import { runBench, getReference, type BenchmarkReport } from '../api.ts';
import SpeedBar from '../components/SpeedBar.tsx';
import SizeBadge from '../components/SizeBadge.tsx';

interface ReferenceData {
  results: BenchmarkReport['results'];
  profiles: BenchmarkReport['profiles'];
}

export default function Comparison() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      runBench(100, 'all'),
      getReference(),
    ]).then(([benchReport, reference]) => {
      setReport(benchReport);
      setRefData(reference);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-slate-500">Running benchmarks for comparison...</div>;
  }

  if (!report || !refData) {
    return <div className="text-red-500">Failed to load data</div>;
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Classical vs Post-Quantum</h2>

      <div className="space-y-8">
        {report.comparisons.map((comp) => {
          const classicalResult = report.results.find(
            (r) => r.algorithm === comp.classical && r.operation === 'keygen'
          );
          const pqcResult = refData.results.find(
            (r) => r.algorithm === comp.postQuantum && r.operation === 'keygen'
          );
          const pqcProfile = refData.profiles.find(
            (p) => p.algorithm === comp.postQuantum
          );

          const maxOps = Math.max(
            classicalResult?.opsPerSecond ?? 0,
            pqcResult?.opsPerSecond ?? 0,
          );

          return (
            <div
              key={`${comp.classical}-${comp.postQuantum}`}
              className="p-6 rounded-lg border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111]"
            >
              <h3 className="text-lg font-bold mb-4">
                <span className="text-red-400">{comp.classical}</span>
                {' → '}
                <span className="text-green-400">{comp.postQuantum}</span>
              </h3>

              {classicalResult && pqcResult && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Key Generation Speed</h4>
                  <SpeedBar label={comp.classical} value={classicalResult.opsPerSecond} maxValue={maxOps} color="#f87171" />
                  <SpeedBar label={comp.postQuantum} value={pqcResult.opsPerSecond} maxValue={maxOps} color="#4ade80" />
                </div>
              )}

              {pqcProfile && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Key & Artifact Sizes</h4>
                  <div className="flex gap-2 flex-wrap">
                    <SizeBadge label="Public Key" bytes={pqcProfile.publicKeySize} />
                    <SizeBadge label="Private Key" bytes={pqcProfile.privateKeySize} />
                    {pqcProfile.signatureSize && <SizeBadge label="Signature" bytes={pqcProfile.signatureSize} />}
                    {pqcProfile.ciphertextSize && <SizeBadge label="Ciphertext" bytes={pqcProfile.ciphertextSize} />}
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <p className="text-green-500">{comp.speedup}</p>
                <p className="text-yellow-500">{comp.sizeTradeoff}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{comp.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/SpeedBar.tsx web/src/components/SizeBadge.tsx web/src/pages/Comparison.tsx
git commit -m "feat: add Comparison page with speed bars and size badges"
```

---

## Task 20: Web UI — Education Page

**Files:**
- Create: `web/src/pages/Education.tsx`

- [ ] **Step 1: Create web/src/pages/Education.tsx**

```tsx
import { useEffect, useState } from 'react';
import { getReference, type BenchmarkReport } from '../api.ts';

interface AlgorithmInfo {
  name: string;
  type: string;
  description: string;
  standard: string;
}

const ALGORITHMS: AlgorithmInfo[] = [
  {
    name: 'ML-KEM (FIPS 203)',
    type: 'Key Encapsulation Mechanism',
    description:
      'Lattice-based key encapsulation, formerly known as CRYSTALS-Kyber. Replaces RSA and ECDH for key exchange. ' +
      'Based on the Module Learning With Errors (MLWE) problem. Extremely fast key generation and encapsulation.',
    standard: 'FIPS 203',
  },
  {
    name: 'ML-DSA (FIPS 204)',
    type: 'Digital Signature',
    description:
      'Lattice-based digital signature scheme, formerly known as CRYSTALS-Dilithium. Replaces RSA, ECDSA, and Ed25519 signatures. ' +
      'Based on the Module Learning With Errors (MLWE) problem. Uses rejection sampling during signing.',
    standard: 'FIPS 204',
  },
  {
    name: 'SLH-DSA (FIPS 205)',
    type: 'Digital Signature (Hash-based)',
    description:
      'Hash-based digital signature scheme, formerly known as SPHINCS+. The most conservative PQC signature scheme — ' +
      'relies only on the security of hash functions, with no algebraic structure that might be attacked. ' +
      'Slow signing, but tiny keys and minimal security assumptions.',
    standard: 'FIPS 205',
  },
];

export default function Education() {
  const [profiles, setProfiles] = useState<BenchmarkReport['profiles']>([]);

  useEffect(() => {
    getReference().then((data) => setProfiles(data.profiles));
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Post-Quantum Cryptography</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        NIST finalized three post-quantum cryptography standards in 2024. Here is what they are and why they matter.
      </p>

      <div className="space-y-8">
        {ALGORITHMS.map((algo) => {
          const relatedProfiles = profiles.filter((p) =>
            p.algorithm.startsWith(algo.name.split(' ')[0])
          );

          return (
            <div
              key={algo.name}
              className="p-6 rounded-lg border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111]"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">{algo.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                  {algo.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{algo.description}</p>

              {relatedProfiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Parameter Sets</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#333] text-left text-slate-400">
                          <th className="pb-1 pr-4">Variant</th>
                          <th className="pb-1 pr-4 text-right">Public Key</th>
                          <th className="pb-1 pr-4 text-right">Private Key</th>
                          <th className="pb-1 pr-4 text-right">{algo.type.includes('Signature') ? 'Signature' : 'Ciphertext'}</th>
                          <th className="pb-1">Security Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedProfiles.map((p) => (
                          <tr key={p.algorithm} className="border-b border-slate-100 dark:border-[#1a1a1a]">
                            <td className="py-1.5 pr-4 font-mono">{p.algorithm}</td>
                            <td className="py-1.5 pr-4 text-right font-mono">{p.publicKeySize}B</td>
                            <td className="py-1.5 pr-4 text-right font-mono">{p.privateKeySize}B</td>
                            <td className="py-1.5 pr-4 text-right font-mono">
                              {p.signatureSize ? `${p.signatureSize}B` : p.ciphertextSize ? `${p.ciphertextSize}B` : '—'}
                            </td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">{p.securityLevel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Standard: {algo.standard} —{' '}
                <a href={`https://csrc.nist.gov/pubs/fips/${algo.standard.replace('FIPS ', '')}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{algo.standard}</a>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded border border-slate-200 dark:border-[#1a1a1a] text-sm text-slate-500 dark:text-slate-400">
        <h3 className="font-bold mb-2">Why does this matter?</h3>
        <p>
          Quantum computers capable of breaking RSA, ECDSA, and ECDH may arrive within the next decade.
          The threat is not just future — adversaries can record encrypted traffic today and decrypt it
          later ("harvest now, decrypt later"). Migrating to post-quantum cryptography protects against
          both current and future threats.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/Education.tsx
git commit -m "feat: add Education page with PQC algorithm explanations"
```

---

## Task 21: Web UI — App Router and Static Serving

**Files:**
- Create: `web/src/App.tsx`
- Modify: `src/api/server.ts` (add static file serving)

- [ ] **Step 1: Create web/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Comparison from './pages/Comparison.tsx';
import Education from './pages/Education.tsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/education" element={<Education />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 2: Add static file serving to API server**

Replace `src/api/server.ts` with:

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { runBenchmarks } from '../index.js';
import { getPqcReferenceResults, getPqcProfiles } from '../reference/pqc-data.js';
import type { BenchmarkCategory, BenchmarkReport } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const history: BenchmarkReport[] = [];

  // CORS for development
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.post<{ Body: { iterations?: number; category?: string } }>(
    '/api/bench',
    async (request) => {
      const iterations = request.body?.iterations ?? 1000;
      const category = (request.body?.category ?? 'all') as BenchmarkCategory;

      const report = runBenchmarks({ iterations, category });
      history.unshift(report);
      return report;
    },
  );

  app.get('/api/bench/history', async () => history);

  app.get<{ Params: { id: string } }>('/api/bench/:id', async (request, reply) => {
    const report = history.find((r) => r.id === request.params.id);
    if (!report) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return report;
  });

  app.get('/api/reference', async () => ({
    results: getPqcReferenceResults(),
    profiles: getPqcProfiles(),
  }));

  // Serve web UI static files if built
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
    });

    // SPA fallback — serve index.html for non-API routes
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.code(404);
        return { error: 'Not found' };
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
```

- [ ] **Step 3: Verify web UI builds**

Run: `cd web && npm run build`
Expected: `web/dist/` created with index.html and assets

- [ ] **Step 4: Commit**

```bash
git add web/src/App.tsx src/api/server.ts
git commit -m "feat: add App router and static file serving for web UI"
```

---

## Task 22: Add build:web Script and Final Integration

**Files:**
- Modify: `package.json` (add build:web script)

- [ ] **Step 1: Add build:web script to root package.json**

Add to the `scripts` section of root `package.json`:

```json
"build:web": "cd web && npm run build"
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Test the full CLI + web workflow**

Run: `npx tsx src/cli.ts --iterations 20 --category sigs`
Expected: Terminal output showing signature benchmarks

Run: `cd web && npm run build && cd .. && npx tsx src/cli.ts --serve --port 3200`
Then visit `http://localhost:3200` and verify the web UI loads.
Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add build:web script, verify full integration"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|----------------|
| 1 | Project scaffolding | 7 |
| 2 | Core types | 5 |
| 3 | Benchmark runner | 5 |
| 4 | Key generation benchmarks | 5 |
| 5 | Sign/verify benchmarks | 5 |
| 6 | Encrypt/decrypt benchmarks | 5 |
| 7 | Hash benchmarks | 5 |
| 8 | PQC reference data | 5 |
| 9 | Educational comparisons | 5 |
| 10 | JSON reporter | 5 |
| 11 | Terminal reporter | 5 |
| 12 | Core orchestrator | 5 |
| 13 | CLI entry point | 5 |
| 14 | API server | 5 |
| 15 | Full test suite verification | 3 |
| 16 | Web UI project setup | 12 |
| 17 | Theme, API client, layout | 6 |
| 18 | Dashboard page | 3 |
| 19 | Comparison page | 4 |
| 20 | Education page | 2 |
| 21 | App router + static serving | 4 |
| 22 | Final integration | 4 |
| **Total** | | **113 steps** |
