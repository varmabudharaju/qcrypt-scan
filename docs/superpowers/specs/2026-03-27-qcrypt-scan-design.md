# qcrypt-scan — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Series:** qcrypt (1 of 3: scan → bench → migrate)

## Problem

Developers are being told to migrate to post-quantum cryptography, but most have no idea what's vulnerable in their own codebases. Existing scanner tools (crypto-scanner, IBM CBOMkit, QRAMM CryptoScan) are enterprise-focused compliance tools — none of them explain *why* something is vulnerable or *what to do about it* in developer-friendly terms.

## Solution

A CLI + REST API tool that scans any codebase for quantum-vulnerable cryptography and produces an educational, actionable report. Every finding explains the quantum risk in plain English and recommends a NIST-approved replacement.

## Differentiators

1. **Educational-first** — every finding explains why it's quantum-vulnerable
2. **Web UI ready** — JSON API for a visual dashboard (UI design coming later)
3. **TypeScript/Node ecosystem** — where these tools barely exist
4. **Migration guidance** — not just detection, but recommended replacements
5. **Part of a series** — scanner feeds into benchmarker and migrator

## Architecture

### Project Structure

```
qcrypt-scan/
├── src/
│   ├── scanners/           # one scanner per concern
│   │   ├── source-code.ts     # pattern matching in code files
│   │   ├── certificates.ts    # x509/PEM file analysis
│   │   ├── config-files.ts    # TLS/SSH/nginx/apache configs
│   │   └── dependencies.ts    # package.json, requirements.txt, go.mod
│   ├── rules/              # detection rules
│   │   ├── algorithms.ts      # algorithm definitions + risk classification
│   │   └── patterns.ts        # per-language regex patterns
│   ├── education/           # the differentiator
│   │   └── explanations.ts    # why each algo is vulnerable + replacements
│   ├── reporters/           # output formatting
│   │   ├── terminal.ts        # colored CLI output with risk badges
│   │   └── json.ts            # structured JSON for API/UI
│   ├── api/                 # REST API
│   │   └── server.ts          # Fastify, POST /api/scan
│   ├── cli.ts               # CLI entry point
│   └── index.ts             # core scan orchestrator
├── test/
│   ├── fixtures/            # sample code for testing
│   │   ├── vulnerable/        # known-vulnerable samples
│   │   ├── safe/              # known-safe samples
│   │   └── mixed/             # realistic mixed project
│   └── e2e/                 # end-to-end tests
├── package.json
└── tsconfig.json
```

### Core Types

```typescript
type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK'

interface Finding {
  file: string
  line: number
  algorithm: string         // e.g. "RSA-2048", "ECDSA-P256"
  category: 'asymmetric' | 'symmetric' | 'hash' | 'protocol'
  risk: RiskLevel
  snippet: string           // the matching line of code
  explanation: string       // why it's quantum-vulnerable
  replacement: string       // NIST-recommended alternative
}

interface ScanReport {
  path: string
  scannedAt: string
  filesScanned: number
  findings: Finding[]
  summary: { critical: number; warning: number; info: number; ok: number }
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}
```

### Core Flow

```
Input (directory path)
  → Discover files (glob by extension)
  → Route to scanners (source-code, certs, configs, deps)
  → Each scanner returns Finding[]
  → Enrich with education/explanations
  → Aggregate & sort by risk
  → Compute grade
  → Output via reporter (terminal or JSON)
```

### Detection Approach

Regex-based pattern matching, not AST parsing.

**Why:** Works across all 5 target languages without needing separate parsers. Accepts some false positives in exchange for shipping fast and broad coverage.

**Rejected alternative:** Per-language AST parsing — more accurate but 5x the complexity for v1.

### Risk Classification

| Risk | Algorithms | Quantum Threat |
|------|-----------|----------------|
| CRITICAL | RSA (all sizes), ECDSA, ECDH, DSA, DH | Broken by Shor's algorithm |
| WARNING | AES-128, SHA-1, MD5, DES, 3DES | Weakened by Grover's (or already weak) |
| INFO | AES-192 | Reduced security margin under Grover's |
| OK | AES-256, SHA-256, SHA-3, ML-KEM, ML-DSA, SLH-DSA | Quantum-resistant |

### Grading

- **A** — No critical or warning findings
- **B** — No critical, some warnings
- **C** — 1-3 critical findings
- **D** — 4-10 critical findings
- **F** — 10+ critical findings

### Language Support (v1)

| Language | Libraries/Patterns |
|----------|-------------------|
| Python | `cryptography`, `pycryptodome`, `hashlib`, `ssl` |
| JS/TS | `crypto`, `node-forge`, `jose`, `tweetnacl` |
| Go | `crypto/*`, `x/crypto` |
| Rust | `ring`, `rustls`, `openssl` |
| Java | `javax.crypto`, `java.security`, `BouncyCastle` |

### API

```
POST /api/scan
Body: { "path": "/absolute/path/to/project" }
Response: ScanReport (JSON)

GET /api/health
Response: { "status": "ok" }
```

### CLI

```bash
npx qcrypt-scan ./my-project           # scan with terminal output
npx qcrypt-scan ./my-project --json    # scan with JSON output
npx qcrypt-scan --serve                # start API server on port 3100
```

## Testing Strategy

### Test Fixtures

- `fixtures/vulnerable/` — Python/JS/Go/Rust/Java files using RSA, ECDSA, DES, MD5
- `fixtures/safe/` — files using AES-256-GCM, SHA-3, Argon2
- `fixtures/mixed/` — realistic project structure with both

### E2E Tests

- Scan vulnerable fixtures → assert all critical findings detected
- Scan safe fixtures → assert grade A, no critical/warning findings
- Scan mixed fixtures → assert correct mix of findings and grade
- CLI output format tests (terminal + JSON)
- API endpoint tests (POST /api/scan returns valid ScanReport)

## Tech Stack

- TypeScript + Node.js 20+
- Fastify (API server)
- Vitest (testing)
- chalk (terminal colors)
- glob (file discovery)
- commander (CLI parsing)

## Out of Scope (v1)

- Git repo URL input (local paths only)
- Auto-fix / code modification (that's qcrypt-migrate)
- Web UI (design coming separately)
- SARIF/CBOM output formats
- Binary/compiled code scanning
