# PQC Readiness Scoring — Design Spec

**Date:** 2026-04-02
**Version:** 0.2.0
**Goal:** Evolve qcrypt-scan from a vulnerability scanner into a PQC Readiness Platform with a composite 0-100 score, context-aware analysis, and industry-standard output formats.

---

## 1. Architecture

Current pipeline: **Scan → Findings → Grade → Report**
New pipeline: **Scan → Findings → Analysis → Readiness Score → Report**

The analysis phase is a new layer between scanning and reporting. It does NOT modify existing scanners — it enriches their output.

### New file structure

```
src/
  analyzers/
    context.ts        # Path sensitivity, HNDL tagging, test detection
    agility.ts        # File concentration ratio
    migration.ts      # PQC/hybrid detection from existing findings
    readiness.ts      # Composite score calculation
  reporters/
    sarif.ts          # SARIF 2.1.0 output
    cbom.ts           # CycloneDX 1.6 CBOM output
  config/
    qcrypt-config.ts  # .qcrypt.yml loader
```

Existing files modified:
- `types.ts` — new types added (EnrichedFinding, ReadinessScore, etc.)
- `index.ts` — orchestration calls analyzers after scan, before report
- `reporters/terminal.ts` — display readiness score and enriched findings
- `reporters/json.ts` — include readiness and enriched findings
- `cli.ts` — new flags: `--sarif`, `--cbom`, `--config`
- `api/server.ts` — ScanReport response now includes readiness data

---

## 2. New Types

```typescript
export interface EnrichedFinding extends Finding {
  context: FindingContext;
}

export interface FindingContext {
  sensitivity: 'high' | 'medium' | 'low';
  hndlRisk: boolean;
  isTestFile: boolean;
  migrationEffort: 'low' | 'medium' | 'high';
}

export interface ReadinessScore {
  overall: number;  // 0-100
  dimensions: {
    vulnerability: DimensionScore;
    priority: DimensionScore;
    migration: DimensionScore;
    agility: DimensionScore;
  };
}

export interface DimensionScore {
  score: number;     // 0-100 raw
  weighted: number;  // after weight applied
  details: string;   // human-readable explanation
}
```

`ScanReport` extended with:
- `readiness: ReadinessScore`
- `enrichedFindings: EnrichedFinding[]`

Existing `grade` field now derived from `readiness.overall` instead of raw critical count.

---

## 3. Readiness Score Engine

### 3.1 Vulnerability (40% weight)

"How broken is your crypto?"

```
raw = 100
For each CRITICAL finding (not in test files):
  deduction = clamp(400 / filesScanned, 3, 8)
  raw -= deduction
For each WARNING finding (not in test files):
  deduction = clamp(100 / filesScanned, 1, 3)
  raw -= deduction
raw = clamp(raw, 0, 100)
weighted = raw * 0.40
```

Normalization by `filesScanned` prevents small projects from being unfairly penalized compared to large codebases.

### 3.2 Priority (25% weight)

"How urgent is your exposure?"

```
raw = 100
For each CRITICAL finding with hndlRisk:
  raw -= 12
For each CRITICAL finding in high-sensitivity path:
  raw -= 8
For each CRITICAL finding in medium-sensitivity path:
  raw -= 5
For each CRITICAL finding in low-sensitivity path (test/mock):
  raw -= 2
Apply .qcrypt.yml overrides
raw = clamp(raw, 0, 100)
weighted = raw * 0.25
```

### 3.3 Migration Progress (20% weight)

"Have you started fixing?"

```
pqcCount = count of OK findings where algorithm in [ML-KEM, ML-DSA, SLH-DSA]
hybridBonus = files containing both PQC and classical algorithms
totalCrypto = total findings (all risk levels)

raw = (pqcCount / max(totalCrypto, 1)) * 70   // up to 70 pts
raw += min(hybridBonus * 10, 30)                // up to 30 pts
raw = clamp(raw, 0, 100)
weighted = raw * 0.20
```

### 3.4 Crypto Agility (15% weight)

"How easy is the rest to fix?"

```
filesWithCrypto = count of unique files containing any finding

filesWithCrypto <= 2:  raw = 100
filesWithCrypto <= 5:  raw = 75
filesWithCrypto <= 10: raw = 50
filesWithCrypto <= 20: raw = 25
else:                  raw = 10

weighted = raw * 0.15
```

### 3.5 Grade Mapping

```
90-100 → A   (Quantum-ready or actively transitioning)
70-89  → B   (Good awareness, migration underway)
50-69  → C   (Significant work needed)
30-49  → D   (High quantum risk)
0-29   → F   (Critical quantum exposure)
```

---

## 4. Context Analyzer

### 4.1 Path Sensitivity Classification

```
HIGH:   auth/, tls/, ssl/, crypto/, security/, keys/, certs/, secrets/, payment/
LOW:    test/, tests/, __tests__/, spec/, mock/, mocks/, fixture/, fixtures/,
        example/, examples/, demo/, benchmark/, e2e/
MEDIUM: everything else
```

### 4.2 HNDL Risk Algorithms

Key exchange algorithms vulnerable to harvest-now-decrypt-later:
- ECDH, DH, X25519, RSA (when category is 'asymmetric' and used for encryption/key exchange)

Signature-only algorithms (ECDSA, Ed25519, DSA) are CRITICAL but NOT HNDL-flagged.

### 4.3 Test File Detection

A file is a test file if its path matches:
- Contains `/test/`, `/tests/`, `/__tests__/`, `/spec/`, `/mock/`, `/fixture/`
- Filename matches `*.test.*`, `*.spec.*`, `*_test.*`, `*_spec.*`

### 4.4 Migration Effort Estimates

```
LOW:    AES-128→AES-256, MD5→SHA-256, SHA-1→SHA-256, DES→AES-256, 3DES→AES-256, RC4→AES-256
MEDIUM: RSA→ML-DSA (signing), ECDSA→ML-DSA, Ed25519→ML-DSA, DSA→ML-DSA
HIGH:   ECDH→ML-KEM, DH→ML-KEM, X25519→ML-KEM, RSA→ML-KEM (key exchange)
```

---

## 5. Configuration — `.qcrypt.yml`

Optional file at project root. All fields optional.

```yaml
sensitivity:
  high: ["src/payments/**", "src/auth/**"]
  low: ["src/legacy/**"]
  ignore: ["vendor/**", "scripts/**"]
```

- `high`/`low` override heuristic path classification
- `ignore` excludes paths from scanning entirely
- No config needed for default behavior

Loaded by `src/config/qcrypt-config.ts` using a YAML parser (add `yaml` dependency).

---

## 6. SARIF Reporter

SARIF 2.1.0 JSON for GitHub Security tab integration.

Mapping:
- Each finding → `result` with `ruleId` (algorithm name), `level`, `message`, `location`
- CRITICAL → `error`, WARNING → `warning`, INFO/OK → `note`
- Readiness score stored in `run.properties.readinessScore`
- Tool metadata: `name: "qcrypt-scan"`, `version`, `informationUri`

CLI: `qcrypt-scan ./project --sarif`

Output to stdout for piping: `qcrypt-scan ./project --sarif > results.sarif`

---

## 7. CBOM Reporter

CycloneDX 1.6 Cryptographic Bill of Materials.

Mapping:
- Each finding → `component` with `type: "cryptographic-asset"`
- `cryptoProperties.algorithmMode` from algorithm name
- `cryptoProperties.primitive` mapped from category (asymmetric→pke/signature, symmetric→blockcipher, hash→hash)
- Risk level in `properties` array
- Standard envelope: `bomFormat: "CycloneDX"`, `specVersion: "1.6"`, `serialNumber`, `metadata`

CLI: `qcrypt-scan ./project --cbom`

---

## 8. Terminal Reporter Updates

Enhanced output format:

```
qcrypt-scan v0.2.0

Scanned: ./my-project (1,247 files)

Grade: C  |  PQC Readiness: 34/100
          |  Vulnerability ████░░░░░░ 38/40
          |  Priority      ██████░░░░ 14/25
          |  Migration     █░░░░░░░░░  2/20
          |  Agility       ████░░░░░░  9/15

!! HARVEST-NOW-DECRYPT-LATER RISK
  3 key exchange algorithms (ECDH, DH) are vulnerable
  to data capture attacks happening today.

CRITICAL  src/auth/session.ts:42
  ECDH (P-256) — key exchange
  HNDL Risk | Sensitivity: HIGH | Effort: HIGH
  Fix: Replace with ML-KEM (FIPS 203) hybrid key exchange
```

Changes from current reporter:
- Readiness score bar chart added below grade
- HNDL warning section when key exchange vulnerabilities found
- Each finding shows sensitivity, HNDL badge, and migration effort
- Test file findings shown separately at the bottom (dimmed)

---

## 9. Web UI Updates

- Dashboard: readiness score donut chart alongside grade
- ScanResults: 4-dimension breakdown bar chart, HNDL badges on findings, effort tags
- Findings: filterable by sensitivity level and HNDL risk
- Readiness Trend: line chart if multiple scans exist for same path (from scan history)

---

## 10. CLI Changes

New flags:
- `--sarif` — output SARIF 2.1.0 format to stdout
- `--cbom` — output CycloneDX 1.6 CBOM to stdout
- `--config <path>` — custom config file path (default: `.qcrypt.yml` in scan target root)

Mutually exclusive: `--json`, `--sarif`, `--cbom` (only one output format at a time, default is terminal).

---

## 11. Dependencies

New:
- `yaml` — parse `.qcrypt.yml` config files
- `minimatch` — glob pattern matching for config path overrides

No other new dependencies. SARIF and CBOM are plain JSON — no SDK needed.

---

## 12. Backwards Compatibility

- Existing `ScanReport` fields unchanged — `readiness` and `enrichedFindings` are additive
- Default CLI output remains terminal format
- `--json` output includes new fields but existing consumers can ignore them
- API endpoints return same structure with new fields added
- Grade mapping changes from count-based to score-based, so grades may shift slightly for existing scans
