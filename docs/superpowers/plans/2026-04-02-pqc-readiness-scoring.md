# PQC Readiness Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve qcrypt-scan from a vulnerability counter into a 4-dimension PQC Readiness Platform with composite 0-100 scoring, context-aware analysis, HNDL risk tagging, and SARIF/CBOM output formats.

**Architecture:** New `src/analyzers/` layer enriches existing scan findings with context (path sensitivity, HNDL risk, test file detection, migration effort) and computes a composite readiness score. New `src/reporters/` for SARIF and CBOM output. Optional `.qcrypt.yml` config for user overrides. Existing scanners are untouched.

**Tech Stack:** TypeScript, Vitest (TDD), chalk (terminal), Fastify (API), yaml + minimatch (new deps for config)

---

### Task 1: Install New Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install yaml and minimatch**

```bash
npm install yaml minimatch
npm install --save-dev @types/minimatch
```

- [ ] **Step 2: Verify installation**

```bash
node -e "import('yaml').then(() => console.log('yaml OK'))"
node -e "import('minimatch').then(() => console.log('minimatch OK'))"
```

Expected: Both print OK.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add yaml and minimatch dependencies"
```

---

### Task 2: Extend Types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Write the failing test**

Create `test/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  FindingContext,
  EnrichedFinding,
  DimensionScore,
  ReadinessScore,
  QcryptConfig,
} from '../src/types.js';

describe('new types', () => {
  it('EnrichedFinding extends Finding with context', () => {
    const enriched: EnrichedFinding = {
      file: 'src/auth.ts',
      line: 10,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
      context: {
        sensitivity: 'high',
        hndlRisk: false,
        isTestFile: false,
        migrationEffort: 'medium',
      },
    };
    expect(enriched.context.sensitivity).toBe('high');
    expect(enriched.risk).toBe('CRITICAL');
  });

  it('ReadinessScore has 4 dimensions', () => {
    const dim: DimensionScore = { score: 80, weighted: 32, details: 'test' };
    const readiness: ReadinessScore = {
      overall: 50,
      dimensions: {
        vulnerability: dim,
        priority: dim,
        migration: dim,
        agility: dim,
      },
    };
    expect(readiness.overall).toBe(50);
    expect(Object.keys(readiness.dimensions)).toHaveLength(4);
  });

  it('QcryptConfig has sensitivity overrides', () => {
    const config: QcryptConfig = {
      sensitivity: {
        high: ['src/payments/**'],
        low: ['src/legacy/**'],
        ignore: ['vendor/**'],
      },
    };
    expect(config.sensitivity?.high).toContain('src/payments/**');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/types.test.ts
```

Expected: FAIL — types not exported yet.

- [ ] **Step 3: Add new types to src/types.ts**

Add the following after the existing `LanguagePatterns` interface:

```typescript
export interface FindingContext {
  sensitivity: 'high' | 'medium' | 'low';
  hndlRisk: boolean;
  isTestFile: boolean;
  migrationEffort: 'low' | 'medium' | 'high';
}

export interface EnrichedFinding extends Finding {
  context: FindingContext;
}

export interface DimensionScore {
  score: number;
  weighted: number;
  details: string;
}

export interface ReadinessScore {
  overall: number;
  dimensions: {
    vulnerability: DimensionScore;
    priority: DimensionScore;
    migration: DimensionScore;
    agility: DimensionScore;
  };
}

export interface QcryptConfig {
  sensitivity?: {
    high?: string[];
    low?: string[];
    ignore?: string[];
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts test/types.test.ts
git commit -m "feat: add EnrichedFinding, ReadinessScore, and QcryptConfig types"
```

---

### Task 3: Context Analyzer

**Files:**
- Create: `src/analyzers/context.ts`
- Test: `test/analyzers/context.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/analyzers/context.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { enrichFinding } from '../src/analyzers/context.js';
import type { Finding } from '../src/types.js';

const makeFinding = (overrides: Partial<Finding>): Finding => ({
  file: 'src/app.ts',
  line: 10,
  algorithm: 'RSA',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: 'rsa.generateKey()',
  explanation: 'Broken by Shor',
  replacement: 'ML-KEM',
  ...overrides,
});

describe('enrichFinding', () => {
  describe('sensitivity', () => {
    it('marks auth/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/auth/session.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });

    it('marks tls/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'lib/tls/handshake.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });

    it('marks crypto/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/crypto/keys.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });

    it('marks security/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/security/encrypt.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });

    it('marks payment/ paths as high sensitivity', () => {
      const f = makeFinding({ file: 'src/payment/checkout.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('high');
    });

    it('marks test/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'test/helpers/crypto.test.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });

    it('marks __tests__/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'src/__tests__/util.test.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });

    it('marks fixture/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'test/fixtures/keys.pem' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });

    it('marks example/ paths as low sensitivity', () => {
      const f = makeFinding({ file: 'examples/demo.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('low');
    });

    it('marks other paths as medium sensitivity', () => {
      const f = makeFinding({ file: 'src/utils/helper.ts' });
      expect(enrichFinding(f).context.sensitivity).toBe('medium');
    });
  });

  describe('hndlRisk', () => {
    it('flags ECDH as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'ECDH' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });

    it('flags DH as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'DH' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });

    it('flags X25519 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'X25519' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });

    it('flags RSA (asymmetric) as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'RSA', category: 'asymmetric' });
      expect(enrichFinding(f).context.hndlRisk).toBe(true);
    });

    it('does NOT flag ECDSA as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'ECDSA' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });

    it('does NOT flag Ed25519 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'Ed25519' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });

    it('does NOT flag AES-128 as HNDL risk', () => {
      const f = makeFinding({ algorithm: 'AES-128', category: 'symmetric' });
      expect(enrichFinding(f).context.hndlRisk).toBe(false);
    });
  });

  describe('isTestFile', () => {
    it('detects test/ directory', () => {
      const f = makeFinding({ file: 'test/crypto.test.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });

    it('detects *.test.ts filename', () => {
      const f = makeFinding({ file: 'src/auth.test.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });

    it('detects *.spec.ts filename', () => {
      const f = makeFinding({ file: 'src/auth.spec.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });

    it('detects _test.go filename', () => {
      const f = makeFinding({ file: 'pkg/crypto_test.go' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });

    it('detects mock/ directory', () => {
      const f = makeFinding({ file: 'mocks/crypto.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(true);
    });

    it('does not flag regular source files', () => {
      const f = makeFinding({ file: 'src/auth/session.ts' });
      expect(enrichFinding(f).context.isTestFile).toBe(false);
    });
  });

  describe('migrationEffort', () => {
    it('AES-128 is low effort', () => {
      const f = makeFinding({ algorithm: 'AES-128', category: 'symmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });

    it('MD5 is low effort', () => {
      const f = makeFinding({ algorithm: 'MD5', category: 'hash' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });

    it('SHA-1 is low effort', () => {
      const f = makeFinding({ algorithm: 'SHA-1', category: 'hash' });
      expect(enrichFinding(f).context.migrationEffort).toBe('low');
    });

    it('RSA signing is medium effort', () => {
      const f = makeFinding({ algorithm: 'RSA', category: 'asymmetric' });
      // RSA is HNDL so treated as high
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });

    it('ECDSA is medium effort', () => {
      const f = makeFinding({ algorithm: 'ECDSA', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('medium');
    });

    it('ECDH is high effort', () => {
      const f = makeFinding({ algorithm: 'ECDH', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });

    it('DH is high effort', () => {
      const f = makeFinding({ algorithm: 'DH', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });

    it('X25519 is high effort', () => {
      const f = makeFinding({ algorithm: 'X25519', category: 'asymmetric' });
      expect(enrichFinding(f).context.migrationEffort).toBe('high');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/analyzers/context.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement context analyzer**

Create `src/analyzers/context.ts`:

```typescript
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

function classifyMigrationEffort(
  algorithm: string,
  isHndl: boolean,
): 'low' | 'medium' | 'high' {
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/analyzers/context.test.ts
```

Expected: PASS — all 23 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analyzers/context.ts test/analyzers/context.test.ts
git commit -m "feat: add context analyzer with sensitivity, HNDL, test detection, effort"
```

---

### Task 4: Agility Analyzer

**Files:**
- Create: `src/analyzers/agility.ts`
- Test: `test/analyzers/agility.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/analyzers/agility.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeAgilityScore } from '../src/analyzers/agility.js';
import type { EnrichedFinding } from '../src/types.js';

const makeFinding = (file: string): EnrichedFinding => ({
  file,
  line: 1,
  algorithm: 'RSA',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: '',
  explanation: '',
  replacement: '',
  context: {
    sensitivity: 'medium',
    hndlRisk: false,
    isTestFile: false,
    migrationEffort: 'medium',
  },
});

describe('computeAgilityScore', () => {
  it('returns 100 when crypto is in 1-2 files', () => {
    const findings = [makeFinding('src/crypto.ts'), makeFinding('src/crypto.ts')];
    expect(computeAgilityScore(findings).score).toBe(100);
  });

  it('returns 75 when crypto is in 3-5 files', () => {
    const findings = [
      makeFinding('a.ts'), makeFinding('b.ts'), makeFinding('c.ts'),
    ];
    expect(computeAgilityScore(findings).score).toBe(75);
  });

  it('returns 50 when crypto is in 6-10 files', () => {
    const findings = Array.from({ length: 7 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(50);
  });

  it('returns 25 when crypto is in 11-20 files', () => {
    const findings = Array.from({ length: 15 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(25);
  });

  it('returns 10 when crypto is in 21+ files', () => {
    const findings = Array.from({ length: 25 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(10);
  });

  it('returns 100 when no findings', () => {
    expect(computeAgilityScore([]).score).toBe(100);
  });

  it('weighted is score * 0.15', () => {
    const findings = [makeFinding('a.ts')];
    const result = computeAgilityScore(findings);
    expect(result.weighted).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/analyzers/agility.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement agility analyzer**

Create `src/analyzers/agility.ts`:

```typescript
import type { EnrichedFinding, DimensionScore } from '../types.js';

const WEIGHT = 0.15;

export function computeAgilityScore(findings: EnrichedFinding[]): DimensionScore {
  const uniqueFiles = new Set(findings.map((f) => f.file));
  const count = uniqueFiles.size;

  let score: number;
  let details: string;

  if (count <= 2) {
    score = 100;
    details = `Crypto centralized in ${count} file(s) — excellent agility`;
  } else if (count <= 5) {
    score = 75;
    details = `Crypto in ${count} files — good centralization`;
  } else if (count <= 10) {
    score = 50;
    details = `Crypto in ${count} files — moderate spread`;
  } else if (count <= 20) {
    score = 25;
    details = `Crypto in ${count} files — scattered, migration will be harder`;
  } else {
    score = 10;
    details = `Crypto in ${count} files — highly scattered, consider centralizing`;
  }

  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/analyzers/agility.test.ts
```

Expected: PASS — all 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analyzers/agility.ts test/analyzers/agility.test.ts
git commit -m "feat: add agility analyzer with file concentration scoring"
```

---

### Task 5: Migration Analyzer

**Files:**
- Create: `src/analyzers/migration.ts`
- Test: `test/analyzers/migration.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/analyzers/migration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeMigrationScore } from '../src/analyzers/migration.js';
import type { EnrichedFinding } from '../src/types.js';

const defaultContext = {
  sensitivity: 'medium' as const,
  hndlRisk: false,
  isTestFile: false,
  migrationEffort: 'medium' as const,
};

const makeFinding = (algorithm: string, risk: string, file = 'src/app.ts'): EnrichedFinding => ({
  file,
  line: 1,
  algorithm,
  category: 'asymmetric',
  risk: risk as any,
  snippet: '',
  explanation: '',
  replacement: '',
  context: defaultContext,
});

describe('computeMigrationScore', () => {
  it('returns 0 when no PQC algorithms present', () => {
    const findings = [makeFinding('RSA', 'CRITICAL'), makeFinding('ECDH', 'CRITICAL')];
    expect(computeMigrationScore(findings).score).toBe(0);
  });

  it('gives credit for PQC algorithms in use', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL'),
      makeFinding('ML-KEM', 'OK'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(35); // 1/2 * 70 = 35
  });

  it('gives hybrid bonus when PQC and classical coexist in same file', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL', 'src/crypto.ts'),
      makeFinding('ML-KEM', 'OK', 'src/crypto.ts'),
    ];
    const result = computeMigrationScore(findings);
    // ratio: 1/2 * 70 = 35, hybrid: 1 * 10 = 10 => 45
    expect(result.score).toBe(45);
  });

  it('caps hybrid bonus at 30', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL', 'a.ts'),
      makeFinding('ML-KEM', 'OK', 'a.ts'),
      makeFinding('ECDH', 'CRITICAL', 'b.ts'),
      makeFinding('ML-DSA', 'OK', 'b.ts'),
      makeFinding('DH', 'CRITICAL', 'c.ts'),
      makeFinding('SLH-DSA', 'OK', 'c.ts'),
      makeFinding('DSA', 'CRITICAL', 'd.ts'),
      makeFinding('ML-KEM', 'OK', 'd.ts'),
    ];
    const result = computeMigrationScore(findings);
    // ratio: 4/8 * 70 = 35, hybrid: min(4*10, 30) = 30 => 65
    expect(result.score).toBe(65);
  });

  it('caps total score at 100', () => {
    const findings = [
      makeFinding('ML-KEM', 'OK', 'a.ts'),
      makeFinding('ML-DSA', 'OK', 'a.ts'),
    ];
    // ratio: 2/2 * 70 = 70, hybrid: 0 (no classical in those files) => 70
    const result = computeMigrationScore(findings);
    expect(result.score).toBe(70);
  });

  it('returns 0 with empty findings', () => {
    expect(computeMigrationScore([]).score).toBe(0);
  });

  it('weighted is score * 0.20', () => {
    const findings = [
      makeFinding('RSA', 'CRITICAL'),
      makeFinding('ML-KEM', 'OK'),
    ];
    const result = computeMigrationScore(findings);
    expect(result.weighted).toBe(7); // 35 * 0.20 = 7
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/analyzers/migration.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement migration analyzer**

Create `src/analyzers/migration.ts`:

```typescript
import type { EnrichedFinding, DimensionScore } from '../types.js';

const WEIGHT = 0.20;
const PQC_ALGORITHMS = new Set(['ML-KEM', 'ML-DSA', 'SLH-DSA']);

export function computeMigrationScore(findings: EnrichedFinding[]): DimensionScore {
  if (findings.length === 0) {
    return { score: 0, weighted: 0, details: 'No crypto findings to assess migration' };
  }

  const pqcCount = findings.filter((f) => PQC_ALGORITHMS.has(f.algorithm)).length;
  const totalCrypto = findings.length;

  // Up to 70 points for PQC adoption ratio
  const ratioScore = (pqcCount / totalCrypto) * 70;

  // Hybrid bonus: files containing both PQC and classical algorithms
  const fileAlgorithms = new Map<string, { hasPqc: boolean; hasClassical: boolean }>();
  for (const f of findings) {
    const entry = fileAlgorithms.get(f.file) ?? { hasPqc: false, hasClassical: false };
    if (PQC_ALGORITHMS.has(f.algorithm)) {
      entry.hasPqc = true;
    } else if (f.risk === 'CRITICAL' || f.risk === 'WARNING') {
      entry.hasClassical = true;
    }
    fileAlgorithms.set(f.file, entry);
  }

  let hybridFiles = 0;
  for (const entry of fileAlgorithms.values()) {
    if (entry.hasPqc && entry.hasClassical) hybridFiles++;
  }
  const hybridBonus = Math.min(hybridFiles * 10, 30);

  const score = Math.min(Math.round(ratioScore + hybridBonus), 100);
  const weighted = Math.round(score * WEIGHT * 100) / 100;

  const parts: string[] = [];
  if (pqcCount > 0) parts.push(`${pqcCount} PQC algorithm(s) detected`);
  if (hybridFiles > 0) parts.push(`${hybridFiles} file(s) with hybrid crypto`);
  if (parts.length === 0) parts.push('No PQC adoption detected');

  return { score, weighted, details: parts.join(', ') };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/analyzers/migration.test.ts
```

Expected: PASS — all 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analyzers/migration.ts test/analyzers/migration.test.ts
git commit -m "feat: add migration analyzer with PQC adoption and hybrid detection"
```

---

### Task 6: Readiness Score Engine

**Files:**
- Create: `src/analyzers/readiness.ts`
- Test: `test/analyzers/readiness.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/analyzers/readiness.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeReadinessScore } from '../src/analyzers/readiness.js';
import type { EnrichedFinding } from '../src/types.js';

const makeFinding = (
  overrides: Partial<EnrichedFinding> & { file?: string; algorithm?: string; risk?: any },
): EnrichedFinding => ({
  file: 'src/app.ts',
  line: 1,
  algorithm: 'RSA',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: '',
  explanation: '',
  replacement: '',
  context: {
    sensitivity: 'medium',
    hndlRisk: false,
    isTestFile: false,
    migrationEffort: 'medium',
  },
  ...overrides,
});

describe('computeReadinessScore', () => {
  it('returns perfect score for no findings', () => {
    const result = computeReadinessScore([], 100);
    expect(result.overall).toBe(100);
    expect(result.dimensions.vulnerability.score).toBe(100);
  });

  it('returns low score for many critical findings', () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      makeFinding({ file: `f${i}.ts` }),
    );
    const result = computeReadinessScore(findings, 100);
    expect(result.overall).toBeLessThan(50);
  });

  it('test file findings do not affect vulnerability score', () => {
    const prodFinding = makeFinding({});
    const testFinding = makeFinding({
      file: 'test/crypto.test.ts',
      context: {
        sensitivity: 'low',
        hndlRisk: false,
        isTestFile: true,
        migrationEffort: 'medium',
      },
    });

    const prodOnly = computeReadinessScore([prodFinding], 100);
    const withTest = computeReadinessScore([prodFinding, testFinding], 100);

    expect(prodOnly.dimensions.vulnerability.score)
      .toBe(withTest.dimensions.vulnerability.score);
  });

  it('HNDL findings reduce priority score more', () => {
    const noHndl = makeFinding({
      algorithm: 'ECDSA',
      context: {
        sensitivity: 'medium',
        hndlRisk: false,
        isTestFile: false,
        migrationEffort: 'medium',
      },
    });
    const hndl = makeFinding({
      algorithm: 'ECDH',
      context: {
        sensitivity: 'medium',
        hndlRisk: true,
        isTestFile: false,
        migrationEffort: 'high',
      },
    });

    const noHndlResult = computeReadinessScore([noHndl], 100);
    const hndlResult = computeReadinessScore([hndl], 100);

    expect(hndlResult.dimensions.priority.score)
      .toBeLessThan(noHndlResult.dimensions.priority.score);
  });

  it('overall is sum of all weighted dimensions', () => {
    const result = computeReadinessScore([], 100);
    const sum =
      result.dimensions.vulnerability.weighted +
      result.dimensions.priority.weighted +
      result.dimensions.migration.weighted +
      result.dimensions.agility.weighted;
    expect(result.overall).toBe(Math.round(sum));
  });

  it('normalizes vulnerability by filesScanned', () => {
    const findings = [makeFinding({})];
    const small = computeReadinessScore(findings, 10);
    const large = computeReadinessScore(findings, 10000);

    // Same finding in large codebase has less impact
    expect(large.dimensions.vulnerability.score)
      .toBeGreaterThan(small.dimensions.vulnerability.score);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/analyzers/readiness.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement readiness score engine**

Create `src/analyzers/readiness.ts`:

```typescript
import type { EnrichedFinding, ReadinessScore } from '../types.js';
import { computeAgilityScore } from './agility.js';
import { computeMigrationScore } from './migration.js';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeVulnerabilityScore(
  findings: EnrichedFinding[],
  filesScanned: number,
) {
  const WEIGHT = 0.40;
  let raw = 100;

  for (const f of findings) {
    if (f.context.isTestFile) continue;

    if (f.risk === 'CRITICAL') {
      const deduction = clamp(400 / Math.max(filesScanned, 1), 3, 8);
      raw -= deduction;
    } else if (f.risk === 'WARNING') {
      const deduction = clamp(100 / Math.max(filesScanned, 1), 1, 3);
      raw -= deduction;
    }
  }

  raw = clamp(raw, 0, 100);
  const score = Math.round(raw);
  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details: `${findings.filter((f) => !f.context.isTestFile && f.risk === 'CRITICAL').length} critical, ${findings.filter((f) => !f.context.isTestFile && f.risk === 'WARNING').length} warning (normalized over ${filesScanned} files)`,
  };
}

function computePriorityScore(findings: EnrichedFinding[]) {
  const WEIGHT = 0.25;
  let raw = 100;

  for (const f of findings) {
    if (f.risk !== 'CRITICAL') continue;

    if (f.context.hndlRisk) raw -= 12;
    if (f.context.sensitivity === 'high') raw -= 8;
    else if (f.context.sensitivity === 'medium') raw -= 5;
    else raw -= 2;
  }

  raw = clamp(raw, 0, 100);
  const score = Math.round(raw);
  const hndlCount = findings.filter((f) => f.context.hndlRisk && f.risk === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.context.sensitivity === 'high' && f.risk === 'CRITICAL').length;

  const parts: string[] = [];
  if (hndlCount > 0) parts.push(`${hndlCount} HNDL-risk finding(s)`);
  if (highCount > 0) parts.push(`${highCount} in high-sensitivity paths`);
  if (parts.length === 0) parts.push('No high-priority exposures');

  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details: parts.join(', '),
  };
}

export function computeReadinessScore(
  findings: EnrichedFinding[],
  filesScanned: number,
): ReadinessScore {
  const vulnerability = computeVulnerabilityScore(findings, filesScanned);
  const priority = computePriorityScore(findings);
  const migration = computeMigrationScore(findings);
  const agility = computeAgilityScore(findings);

  const overall = Math.round(
    vulnerability.weighted + priority.weighted + migration.weighted + agility.weighted,
  );

  return {
    overall: clamp(overall, 0, 100),
    dimensions: { vulnerability, priority, migration, agility },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/analyzers/readiness.test.ts
```

Expected: PASS — all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/analyzers/readiness.ts test/analyzers/readiness.test.ts
git commit -m "feat: add readiness score engine with 4-dimension composite scoring"
```

---

### Task 7: Config Loader

**Files:**
- Create: `src/config/qcrypt-config.ts`
- Test: `test/config/qcrypt-config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/config/qcrypt-config.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseQcryptConfig, applyConfigOverrides } from '../src/config/qcrypt-config.js';
import type { EnrichedFinding } from '../src/types.js';

describe('parseQcryptConfig', () => {
  it('parses valid YAML config', () => {
    const yaml = `
sensitivity:
  high:
    - "src/payments/**"
  low:
    - "src/legacy/**"
  ignore:
    - "vendor/**"
`;
    const config = parseQcryptConfig(yaml);
    expect(config.sensitivity?.high).toEqual(['src/payments/**']);
    expect(config.sensitivity?.low).toEqual(['src/legacy/**']);
    expect(config.sensitivity?.ignore).toEqual(['vendor/**']);
  });

  it('returns empty config for empty input', () => {
    const config = parseQcryptConfig('');
    expect(config).toEqual({});
  });

  it('returns empty config for invalid YAML', () => {
    const config = parseQcryptConfig(':::invalid');
    expect(config).toEqual({});
  });
});

describe('applyConfigOverrides', () => {
  const makeFinding = (file: string, sensitivity: 'high' | 'medium' | 'low'): EnrichedFinding => ({
    file,
    line: 1,
    algorithm: 'RSA',
    category: 'asymmetric',
    risk: 'CRITICAL',
    snippet: '',
    explanation: '',
    replacement: '',
    context: {
      sensitivity,
      hndlRisk: false,
      isTestFile: false,
      migrationEffort: 'medium',
    },
  });

  it('overrides sensitivity to high for matching paths', () => {
    const findings = [makeFinding('src/payments/charge.ts', 'medium')];
    const config = { sensitivity: { high: ['src/payments/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result[0].context.sensitivity).toBe('high');
  });

  it('overrides sensitivity to low for matching paths', () => {
    const findings = [makeFinding('src/legacy/old.ts', 'medium')];
    const config = { sensitivity: { low: ['src/legacy/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result[0].context.sensitivity).toBe('low');
  });

  it('filters out ignored paths', () => {
    const findings = [
      makeFinding('src/app.ts', 'medium'),
      makeFinding('vendor/lib.ts', 'medium'),
    ];
    const config = { sensitivity: { ignore: ['vendor/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('src/app.ts');
  });

  it('returns findings unchanged with empty config', () => {
    const findings = [makeFinding('src/app.ts', 'medium')];
    const result = applyConfigOverrides(findings, {});
    expect(result).toEqual(findings);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/config/qcrypt-config.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement config loader**

Create `src/config/qcrypt-config.ts`:

```typescript
import { parse } from 'yaml';
import { minimatch } from 'minimatch';
import type { QcryptConfig, EnrichedFinding } from '../types.js';

export function parseQcryptConfig(content: string): QcryptConfig {
  if (!content.trim()) return {};
  try {
    const parsed = parse(content);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as QcryptConfig;
  } catch {
    return {};
  }
}

export function applyConfigOverrides(
  findings: EnrichedFinding[],
  config: QcryptConfig,
): EnrichedFinding[] {
  if (!config.sensitivity) return findings;

  const { high = [], low = [], ignore = [] } = config.sensitivity;

  // Filter out ignored paths
  let result = findings.filter(
    (f) => !ignore.some((pattern) => minimatch(f.file, pattern)),
  );

  // Apply sensitivity overrides
  result = result.map((f) => {
    if (high.some((pattern) => minimatch(f.file, pattern))) {
      return { ...f, context: { ...f.context, sensitivity: 'high' as const } };
    }
    if (low.some((pattern) => minimatch(f.file, pattern))) {
      return { ...f, context: { ...f.context, sensitivity: 'low' as const } };
    }
    return f;
  });

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/config/qcrypt-config.test.ts
```

Expected: PASS — all 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/qcrypt-config.ts test/config/qcrypt-config.test.ts
git commit -m "feat: add .qcrypt.yml config loader with sensitivity overrides"
```

---

### Task 8: Integrate Analyzers into Scan Pipeline

**Files:**
- Modify: `src/index.ts`
- Modify: `src/types.ts` (update ScanReport)
- Modify: `test/index.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `test/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scan } from '../src/index.js';

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

  it('includes readiness score in scan report', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.readiness).toBeDefined();
    expect(report.readiness.overall).toBeGreaterThanOrEqual(0);
    expect(report.readiness.overall).toBeLessThanOrEqual(100);
    expect(report.readiness.dimensions.vulnerability).toBeDefined();
    expect(report.readiness.dimensions.priority).toBeDefined();
    expect(report.readiness.dimensions.migration).toBeDefined();
    expect(report.readiness.dimensions.agility).toBeDefined();
  });

  it('includes enriched findings', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.enrichedFindings).toBeDefined();
    expect(report.enrichedFindings.length).toBe(report.findings.length);
    for (const ef of report.enrichedFindings) {
      expect(ef.context).toBeDefined();
      expect(ef.context.sensitivity).toBeDefined();
      expect(typeof ef.context.hndlRisk).toBe('boolean');
      expect(typeof ef.context.isTestFile).toBe('boolean');
      expect(ef.context.migrationEffort).toBeDefined();
    }
  });

  it('derives grade from readiness score', async () => {
    const report = await scan('test/fixtures/vulnerable');
    // Grade should be consistent with overall score
    if (report.readiness.overall >= 90) expect(report.grade).toBe('A');
    else if (report.readiness.overall >= 70) expect(report.grade).toBe('B');
    else if (report.readiness.overall >= 50) expect(report.grade).toBe('C');
    else if (report.readiness.overall >= 30) expect(report.grade).toBe('D');
    else expect(report.grade).toBe('F');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/index.test.ts
```

Expected: FAIL — `readiness` and `enrichedFindings` not found on report.

- [ ] **Step 3: Update ScanReport type**

In `src/types.ts`, update the `ScanReport` interface:

```typescript
export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  enrichedFindings: EnrichedFinding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness: ReadinessScore;
}
```

- [ ] **Step 4: Update scan function in src/index.ts**

Replace the `computeGrade` function and update the `scan` function:

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Finding, ScanReport } from './types.js';
import { scanSourceFile } from './scanners/source-code.js';
import { scanCertificateFile } from './scanners/certificates.js';
import { scanConfigFile } from './scanners/config-files.js';
import { scanDependencyFile } from './scanners/dependencies.js';
import { getLanguagePatterns } from './rules/patterns.js';
import { enrichFindings } from './analyzers/context.js';
import { computeReadinessScore } from './analyzers/readiness.js';
import { parseQcryptConfig, applyConfigOverrides } from './config/qcrypt-config.js';

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

export function gradeFromScore(overall: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (overall >= 90) return 'A';
  if (overall >= 70) return 'B';
  if (overall >= 50) return 'C';
  if (overall >= 30) return 'D';
  return 'F';
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

  const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
  allFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const summary = {
    critical: allFindings.filter((f) => f.risk === 'CRITICAL').length,
    warning: allFindings.filter((f) => f.risk === 'WARNING').length,
    info: allFindings.filter((f) => f.risk === 'INFO').length,
    ok: allFindings.filter((f) => f.risk === 'OK').length,
  };

  // Enrich findings with context
  let enrichedFindings = enrichFindings(allFindings);

  // Load .qcrypt.yml if present
  const configPath = stat.isDirectory()
    ? path.join(resolvedPath, '.qcrypt.yml')
    : path.join(path.dirname(resolvedPath), '.qcrypt.yml');
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = parseQcryptConfig(configContent);
    enrichedFindings = applyConfigOverrides(enrichedFindings, config);
  } catch {
    // No config file — use defaults
  }

  // Compute readiness score
  const readiness = computeReadinessScore(enrichedFindings, files.length);
  const grade = gradeFromScore(readiness.overall);

  return {
    id: randomUUID(),
    path: targetPath,
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    findings: allFindings,
    enrichedFindings,
    summary,
    grade,
    readiness,
  };
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass. The existing `computeGrade` tests will fail — see next step.

- [ ] **Step 6: Update existing computeGrade tests**

Replace the `computeGrade` tests in `test/index.test.ts` with `gradeFromScore` tests:

```typescript
import { describe, it, expect } from 'vitest';
import { scan, gradeFromScore } from '../src/index.js';

describe('gradeFromScore', () => {
  it('returns A for 90+', () => {
    expect(gradeFromScore(95)).toBe('A');
    expect(gradeFromScore(90)).toBe('A');
  });
  it('returns B for 70-89', () => {
    expect(gradeFromScore(85)).toBe('B');
    expect(gradeFromScore(70)).toBe('B');
  });
  it('returns C for 50-69', () => {
    expect(gradeFromScore(55)).toBe('C');
    expect(gradeFromScore(50)).toBe('C');
  });
  it('returns D for 30-49', () => {
    expect(gradeFromScore(40)).toBe('D');
    expect(gradeFromScore(30)).toBe('D');
  });
  it('returns F for 0-29', () => {
    expect(gradeFromScore(20)).toBe('F');
    expect(gradeFromScore(0)).toBe('F');
  });
});
```

- [ ] **Step 7: Run all tests again**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/index.ts src/types.ts test/index.test.ts
git commit -m "feat: integrate analyzers into scan pipeline with readiness scoring"
```

---

### Task 9: SARIF Reporter

**Files:**
- Create: `src/reporters/sarif.ts`
- Test: `test/reporters/sarif.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/reporters/sarif.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatSarif } from '../src/reporters/sarif.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (): ScanReport => ({
  id: 'test-id',
  path: './test-project',
  scannedAt: '2026-04-02T00:00:00.000Z',
  filesScanned: 100,
  findings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
    },
    {
      file: 'src/hash.ts',
      line: 10,
      algorithm: 'MD5',
      category: 'hash',
      risk: 'WARNING',
      snippet: 'md5(data)',
      explanation: 'Broken classically',
      replacement: 'SHA-256',
    },
  ],
  enrichedFindings: [],
  summary: { critical: 1, warning: 1, info: 0, ok: 0 },
  grade: 'C',
  readiness: {
    overall: 50,
    dimensions: {
      vulnerability: { score: 60, weighted: 24, details: '' },
      priority: { score: 70, weighted: 17.5, details: '' },
      migration: { score: 0, weighted: 0, details: '' },
      agility: { score: 75, weighted: 11.25, details: '' },
    },
  },
});

describe('formatSarif', () => {
  it('produces valid SARIF 2.1.0 structure', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    expect(sarif.$schema).toContain('sarif');
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
  });

  it('includes tool metadata', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const tool = sarif.runs[0].tool.driver;
    expect(tool.name).toBe('qcrypt-scan');
    expect(tool.rules).toHaveLength(2);
  });

  it('maps findings to results with correct levels', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const results = sarif.runs[0].results;
    expect(results).toHaveLength(2);
    expect(results[0].level).toBe('error');    // CRITICAL
    expect(results[1].level).toBe('warning');  // WARNING
  });

  it('includes file locations with line numbers', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const loc = sarif.runs[0].results[0].locations[0].physicalLocation;
    expect(loc.artifactLocation.uri).toBe('src/auth.ts');
    expect(loc.region.startLine).toBe(42);
  });

  it('includes readiness score in properties', () => {
    const sarif = JSON.parse(formatSarif(makeReport()));
    const props = sarif.runs[0].properties;
    expect(props.readinessScore).toBe(50);
    expect(props.grade).toBe('C');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/reporters/sarif.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement SARIF reporter**

Create `src/reporters/sarif.ts`:

```typescript
import type { ScanReport, RiskLevel } from '../types.js';

const SARIF_SCHEMA = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/cos02/schemas/sarif-schema-2.1.0.json';

const levelMap: Record<RiskLevel, string> = {
  CRITICAL: 'error',
  WARNING: 'warning',
  INFO: 'note',
  OK: 'note',
};

export function formatSarif(report: ScanReport): string {
  const rulesMap = new Map<string, { id: string; shortDescription: string; fullDescription: string }>();

  for (const finding of report.findings) {
    if (!rulesMap.has(finding.algorithm)) {
      rulesMap.set(finding.algorithm, {
        id: finding.algorithm,
        shortDescription: `Quantum-vulnerable: ${finding.algorithm}`,
        fullDescription: finding.explanation,
      });
    }
  }

  const rules = Array.from(rulesMap.values()).map((r) => ({
    id: r.id,
    shortDescription: { text: r.shortDescription },
    fullDescription: { text: r.fullDescription },
  }));

  const results = report.findings.map((finding) => ({
    ruleId: finding.algorithm,
    level: levelMap[finding.risk],
    message: {
      text: `${finding.algorithm}: ${finding.explanation} Fix: ${finding.replacement}`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.file },
          region: { startLine: finding.line },
        },
      },
    ],
  }));

  const sarif = {
    $schema: SARIF_SCHEMA,
    version: '2.1.0' as const,
    runs: [
      {
        tool: {
          driver: {
            name: 'qcrypt-scan',
            version: '0.2.0',
            informationUri: 'https://github.com/varmabudharaju/qcrypt-scan',
            rules,
          },
        },
        results,
        properties: {
          readinessScore: report.readiness.overall,
          grade: report.grade,
        },
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/reporters/sarif.test.ts
```

Expected: PASS — all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/reporters/sarif.ts test/reporters/sarif.test.ts
git commit -m "feat: add SARIF 2.1.0 reporter for GitHub Security integration"
```

---

### Task 10: CBOM Reporter

**Files:**
- Create: `src/reporters/cbom.ts`
- Test: `test/reporters/cbom.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/reporters/cbom.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCbom } from '../src/reporters/cbom.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (): ScanReport => ({
  id: 'test-id',
  path: './test-project',
  scannedAt: '2026-04-02T00:00:00.000Z',
  filesScanned: 100,
  findings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken',
      replacement: 'ML-KEM',
    },
    {
      file: 'src/hash.ts',
      line: 10,
      algorithm: 'SHA-256',
      category: 'hash',
      risk: 'OK',
      snippet: 'sha256(data)',
      explanation: 'Safe',
      replacement: 'No change',
    },
  ],
  enrichedFindings: [],
  summary: { critical: 1, warning: 0, info: 0, ok: 1 },
  grade: 'C',
  readiness: {
    overall: 50,
    dimensions: {
      vulnerability: { score: 60, weighted: 24, details: '' },
      priority: { score: 70, weighted: 17.5, details: '' },
      migration: { score: 0, weighted: 0, details: '' },
      agility: { score: 75, weighted: 11.25, details: '' },
    },
  },
});

describe('formatCbom', () => {
  it('produces valid CycloneDX 1.6 structure', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    expect(cbom.bomFormat).toBe('CycloneDX');
    expect(cbom.specVersion).toBe('1.6');
    expect(cbom.components).toHaveLength(2);
  });

  it('includes metadata with tool info', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    expect(cbom.metadata.tools.components[0].name).toBe('qcrypt-scan');
  });

  it('maps findings to cryptographic-asset components', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    expect(rsa.type).toBe('cryptographic-asset');
    expect(rsa.cryptoProperties.assetType).toBe('algorithm');
  });

  it('maps algorithm categories to primitives', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    const sha = cbom.components.find((c: any) => c.name === 'SHA-256');
    expect(rsa.cryptoProperties.algorithmProperties.primitive).toBe('pke');
    expect(sha.cryptoProperties.algorithmProperties.primitive).toBe('hash');
  });

  it('includes risk level in properties', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    const riskProp = rsa.properties.find((p: any) => p.name === 'quantumRisk');
    expect(riskProp.value).toBe('CRITICAL');
  });

  it('includes evidence with file locations', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    expect(rsa.evidence.occurrences[0].location).toBe('src/auth.ts:42');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run test/reporters/cbom.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement CBOM reporter**

Create `src/reporters/cbom.ts`:

```typescript
import { randomUUID } from 'node:crypto';
import type { ScanReport, AlgorithmCategory } from '../types.js';

const primitiveMap: Record<AlgorithmCategory, string> = {
  asymmetric: 'pke',
  symmetric: 'block-cipher',
  hash: 'hash',
  protocol: 'other',
};

export function formatCbom(report: ScanReport): string {
  // Group findings by algorithm to create unique components
  const algorithmFindings = new Map<string, typeof report.findings>();
  for (const finding of report.findings) {
    const existing = algorithmFindings.get(finding.algorithm) ?? [];
    existing.push(finding);
    algorithmFindings.set(finding.algorithm, existing);
  }

  const components = Array.from(algorithmFindings.entries()).map(([algorithm, findings]) => {
    const first = findings[0];
    return {
      type: 'cryptographic-asset' as const,
      name: algorithm,
      'bom-ref': `crypto-${algorithm}-${randomUUID().slice(0, 8)}`,
      cryptoProperties: {
        assetType: 'algorithm' as const,
        algorithmProperties: {
          primitive: primitiveMap[first.category],
        },
      },
      properties: [
        { name: 'quantumRisk', value: first.risk },
        { name: 'occurrenceCount', value: String(findings.length) },
      ],
      evidence: {
        occurrences: findings.map((f) => ({
          location: `${f.file}:${f.line}`,
          snippet: f.snippet,
        })),
      },
    };
  });

  const cbom = {
    bomFormat: 'CycloneDX' as const,
    specVersion: '1.6' as const,
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: report.scannedAt,
      tools: {
        components: [
          {
            type: 'application' as const,
            name: 'qcrypt-scan',
            version: '0.2.0',
          },
        ],
      },
      properties: [
        { name: 'readinessScore', value: String(report.readiness.overall) },
        { name: 'grade', value: report.grade },
      ],
    },
    components,
  };

  return JSON.stringify(cbom, null, 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run test/reporters/cbom.test.ts
```

Expected: PASS — all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/reporters/cbom.ts test/reporters/cbom.test.ts
git commit -m "feat: add CycloneDX 1.6 CBOM reporter"
```

---

### Task 11: Update Terminal Reporter

**Files:**
- Modify: `src/reporters/terminal.ts`
- Modify: `test/reporters/terminal.test.ts`

- [ ] **Step 1: Read current terminal test**

```bash
npx vitest run test/reporters/terminal.test.ts
```

Check what passes currently so we don't break it.

- [ ] **Step 2: Write new tests**

Add to `test/reporters/terminal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/reporters/terminal.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (overrides?: Partial<ScanReport>): ScanReport => ({
  id: 'test-id',
  path: './test-project',
  scannedAt: '2026-04-02T00:00:00.000Z',
  filesScanned: 100,
  findings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
    },
  ],
  enrichedFindings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
      context: {
        sensitivity: 'high',
        hndlRisk: true,
        isTestFile: false,
        migrationEffort: 'high',
      },
    },
  ],
  summary: { critical: 1, warning: 0, info: 0, ok: 0 },
  grade: 'C',
  readiness: {
    overall: 34,
    dimensions: {
      vulnerability: { score: 92, weighted: 36.8, details: '1 critical' },
      priority: { score: 56, weighted: 14, details: '1 HNDL' },
      migration: { score: 0, weighted: 0, details: 'No PQC' },
      agility: { score: 100, weighted: 15, details: '1 file' },
    },
  },
  ...overrides,
});

describe('formatTerminal', () => {
  it('displays readiness score', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('PQC Readiness');
    expect(output).toContain('34');
  });

  it('displays dimension scores', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('Vulnerability');
    expect(output).toContain('Priority');
    expect(output).toContain('Migration');
    expect(output).toContain('Agility');
  });

  it('shows HNDL warning when key exchange vulns present', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('HARVEST');
  });

  it('shows enriched finding context', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('HNDL');
    expect(output).toContain('HIGH');
  });

  it('does not show HNDL warning when no key exchange vulns', () => {
    const report = makeReport({
      enrichedFindings: [
        {
          file: 'src/auth.ts',
          line: 42,
          algorithm: 'ECDSA',
          category: 'asymmetric',
          risk: 'CRITICAL',
          snippet: 'ecdsa.sign()',
          explanation: 'Broken',
          replacement: 'ML-DSA',
          context: {
            sensitivity: 'high',
            hndlRisk: false,
            isTestFile: false,
            migrationEffort: 'medium',
          },
        },
      ],
    });
    const output = formatTerminal(report);
    expect(output).not.toContain('HARVEST');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run test/reporters/terminal.test.ts
```

Expected: FAIL — output doesn't contain readiness info yet.

- [ ] **Step 4: Update terminal reporter**

Replace `src/reporters/terminal.ts`:

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

function renderBar(score: number, max: number): string {
  const width = 10;
  const filled = Math.round((score / max) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

export function formatTerminal(report: ScanReport): string {
  const lines: string[] = [];
  const r = report.readiness;

  lines.push('');
  lines.push(chalk.bold('  qcrypt-scan  ') + chalk.dim('Quantum Cryptography Scanner'));
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');
  lines.push(`  ${chalk.dim('Path:')}    ${report.path}`);
  lines.push(`  ${chalk.dim('Files:')}   ${report.filesScanned} scanned`);
  lines.push('');

  // Grade + Readiness
  const gradeStr = (gradeColors[report.grade] ?? chalk.white)(report.grade);
  lines.push(`  ${chalk.dim('Grade:')} ${gradeStr}  ${chalk.dim('│')}  ${chalk.bold('PQC Readiness:')} ${r.overall}/100`);
  lines.push(`         ${chalk.dim('│')}  Vulnerability ${renderBar(r.dimensions.vulnerability.weighted, 40)} ${Math.round(r.dimensions.vulnerability.weighted)}/40`);
  lines.push(`         ${chalk.dim('│')}  Priority      ${renderBar(r.dimensions.priority.weighted, 25)} ${Math.round(r.dimensions.priority.weighted)}/25`);
  lines.push(`         ${chalk.dim('│')}  Migration     ${renderBar(r.dimensions.migration.weighted, 20)} ${Math.round(r.dimensions.migration.weighted)}/20`);
  lines.push(`         ${chalk.dim('│')}  Agility       ${renderBar(r.dimensions.agility.weighted, 15)} ${Math.round(r.dimensions.agility.weighted)}/15`);
  lines.push('');

  // Summary counts
  lines.push(chalk.bold('  Summary'));
  lines.push(
    `    ${chalk.red('CRITICAL')}: ${report.summary.critical}  ` +
    `${chalk.yellow('WARNING')}: ${report.summary.warning}  ` +
    `${chalk.blue('INFO')}: ${report.summary.info}  ` +
    `${chalk.green('OK')}: ${report.summary.ok}`,
  );
  lines.push('');

  // HNDL Warning
  const hndlFindings = report.enrichedFindings.filter(
    (f) => f.context.hndlRisk && f.risk === 'CRITICAL',
  );
  if (hndlFindings.length > 0) {
    const algorithms = [...new Set(hndlFindings.map((f) => f.algorithm))].join(', ');
    lines.push(chalk.red.bold('  !! HARVEST-NOW-DECRYPT-LATER RISK'));
    lines.push(chalk.red(`  ${hndlFindings.length} key exchange algorithm(s) (${algorithms}) are vulnerable`));
    lines.push(chalk.red('  to data capture attacks happening today.'));
    lines.push('');
  }

  if (report.enrichedFindings.length === 0) {
    lines.push(chalk.green('  No quantum-vulnerable cryptography found. Your project appears quantum-safe!'));
    lines.push('');
    return lines.join('\n');
  }

  // Findings (production files first, test files dimmed at end)
  const prodFindings = report.enrichedFindings.filter((f) => !f.context.isTestFile);
  const testFindings = report.enrichedFindings.filter((f) => f.context.isTestFile);

  if (prodFindings.length > 0) {
    lines.push(chalk.bold('  Findings'));
    lines.push('');

    for (const finding of prodFindings) {
      const badge = riskColors[finding.risk](`[${finding.risk}]`);
      lines.push(`  ${badge} ${chalk.bold(finding.algorithm)} in ${chalk.cyan(finding.file)}:${finding.line}`);
      lines.push(`    ${chalk.dim(finding.snippet)}`);

      // Context badges
      const badges: string[] = [];
      if (finding.context.hndlRisk) badges.push(chalk.red('HNDL Risk'));
      badges.push(`Sensitivity: ${finding.context.sensitivity.toUpperCase()}`);
      badges.push(`Effort: ${finding.context.migrationEffort.toUpperCase()}`);
      lines.push(`    ${badges.join(chalk.dim(' │ '))}`);

      lines.push(`    ${chalk.dim('Why:')} ${finding.explanation}`);
      lines.push(`    ${chalk.dim('Fix:')} ${finding.replacement}`);
      lines.push('');
    }
  }

  if (testFindings.length > 0) {
    lines.push(chalk.dim(`  Test files (${testFindings.length} finding(s) — not counted in score)`));
    for (const finding of testFindings) {
      lines.push(chalk.dim(`    ${finding.algorithm} in ${finding.file}:${finding.line}`));
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run test/reporters/terminal.test.ts
```

Expected: PASS — all tests.

- [ ] **Step 6: Commit**

```bash
git add src/reporters/terminal.ts test/reporters/terminal.test.ts
git commit -m "feat: update terminal reporter with readiness score, HNDL warnings, context"
```

---

### Task 12: Update CLI with New Flags

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Update CLI to support --sarif and --cbom flags**

Replace `src/cli.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { formatSarif } from './reporters/sarif.js';
import { formatCbom } from './reporters/cbom.js';
import { createServer } from './api/server.js';

const program = new Command();

program
  .name('qcrypt-scan')
  .description('Scan codebases for quantum-vulnerable cryptography')
  .version('0.2.0');

program
  .argument('[path]', 'path to scan', '.')
  .option('--json', 'output as JSON')
  .option('--sarif', 'output as SARIF 2.1.0 (for GitHub Security)')
  .option('--cbom', 'output as CycloneDX 1.6 CBOM')
  .option('--config <path>', 'path to .qcrypt.yml config file')
  .option('--serve', 'start API server')
  .option('--port <number>', 'API server port', '3100')
  .action(async (
    targetPath: string,
    options: {
      json?: boolean;
      sarif?: boolean;
      cbom?: boolean;
      config?: string;
      serve?: boolean;
      port?: string;
    },
  ) => {
    if (options.serve) {
      const port = parseInt(options.port ?? '3100', 10);
      const server = createServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`qcrypt-scan API server running on http://localhost:${port}`);
      return;
    }

    try {
      const report = await scan(targetPath);

      if (options.sarif) {
        console.log(formatSarif(report));
      } else if (options.cbom) {
        console.log(formatCbom(report));
      } else if (options.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatTerminal(report));
      }

      if (report.summary.critical > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  });

program.parse();
```

- [ ] **Step 2: Verify it works**

```bash
npx tsx src/cli.ts test/fixtures/vulnerable
npx tsx src/cli.ts test/fixtures/vulnerable --json | head -20
npx tsx src/cli.ts test/fixtures/vulnerable --sarif | head -20
npx tsx src/cli.ts test/fixtures/vulnerable --cbom | head -20
```

Expected: Each produces correctly formatted output.

- [ ] **Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add --sarif and --cbom CLI flags"
```

---

### Task 13: Update package.json Version

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version to 0.2.0**

In `package.json`, change:
```json
"version": "0.1.0"
```
to:
```json
"version": "0.2.0"
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 0.2.0"
```

---

### Task 14: Run Full Test Suite and Fix Any Failures

**Files:**
- All test files

- [ ] **Step 1: Run complete test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Fix any failing tests**

If existing tests fail because `ScanReport` now requires `readiness` and `enrichedFindings`, update those test files to include the new fields in their mock data. The main tests that may need updating:

- `test/reporters/json.test.ts` — mock report needs `readiness` and `enrichedFindings`
- `test/e2e/scan.test.ts` — assertions may need updating for new fields
- `test/e2e/api.test.ts` — API response now includes new fields

For each failing test, add the minimum new fields needed to satisfy the `ScanReport` type.

- [ ] **Step 3: Run tests again**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: update existing tests for new ScanReport shape"
```

---

### Task 15: End-to-End Smoke Test

- [ ] **Step 1: Run scanner against its own codebase**

```bash
npx tsx src/cli.ts .
```

Expected: Terminal output showing readiness score, dimension bars, findings with context badges.

- [ ] **Step 2: Verify SARIF output**

```bash
npx tsx src/cli.ts . --sarif > /tmp/qcrypt-scan-results.sarif
node -e "const s = require('/tmp/qcrypt-scan-results.sarif'); console.log('SARIF valid:', s.version === '2.1.0')"
```

Expected: `SARIF valid: true`

- [ ] **Step 3: Verify CBOM output**

```bash
npx tsx src/cli.ts . --cbom > /tmp/qcrypt-scan-cbom.json
node -e "const c = require('/tmp/qcrypt-scan-cbom.json'); console.log('CBOM valid:', c.bomFormat === 'CycloneDX')"
```

Expected: `CBOM valid: true`

- [ ] **Step 4: Verify JSON output includes new fields**

```bash
npx tsx src/cli.ts test/fixtures/vulnerable --json | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  const r = JSON.parse(chunks.join(''));
  console.log('Has readiness:', !!r.readiness);
  console.log('Has enrichedFindings:', !!r.enrichedFindings);
  console.log('Overall score:', r.readiness.overall);
  console.log('Grade:', r.grade);
});
"
```

Expected: All fields present with valid values.

- [ ] **Step 5: Commit (if any final fixes needed)**

```bash
git add -A
git commit -m "test: verify end-to-end smoke tests pass"
```
