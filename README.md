# qcrypt

[![npm](https://img.shields.io/npm/v/qcrypt-scan.svg)](https://www.npmjs.com/package/qcrypt-scan)
[![CI](https://github.com/varmabudharaju/qcrypt/actions/workflows/ci.yml/badge.svg)](https://github.com/varmabudharaju/qcrypt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Scan any codebase for quantum-vulnerable cryptography. Get a grade, see what breaks when quantum computers arrive, and know exactly what to fix.

**11 languages** | **Cited quantum break times** | **NIST deadline tracking** | **Diff-aware CI**

![Dashboard](docs/images/dashboard.png)

## Why

RSA-2048 can be broken in **~8 hours** by a quantum computer ([Gidney & Ekeraa, 2021](https://doi.org/10.22331/q-2021-04-15-433)). NIST says migrate by 2035. Most codebases don't know where their crypto is.

qcrypt finds it, grades it, and tells you how long you have.

## Quick Start

**No install — hosted:** paste any public GitHub URL at [qcrypt.dev](https://qcrypt.dev).

**Zero-install with npx (scans run on your machine, nothing uploaded):**

```bash
npx qcrypt-scan https://github.com/nodejs/node    # scan any public repo
npx qcrypt-scan .                                  # scan current directory
npx qcrypt-scan /path/to/project --json            # JSON for scripting
npx qcrypt-scan --serve --open                     # launch local dashboard at :3100
```

**Or install globally:**

```bash
npm install -g qcrypt-scan
qcrypt-scan --serve --open
```

**Build from source (for contributors):**

```bash
git clone https://github.com/varmabudharaju/qcrypt.git
cd qcrypt
npm install              # auto-builds CLI + web dashboard via the prepare hook
node dist/cli.js --serve --open
```

> `pip install qcrypt-scan` is coming next. Until then, use one of the paths above.

## What You Get

### Scan Results with Quantum Threat Analysis

Every finding comes with: what algorithm, where in code, how it's used (operation vs import vs reference), how fast a quantum computer breaks it, and what NIST says about the deadline.

![Scan Results](docs/images/scan-results.png)

### Usage Classification

Not all findings are equal. qcrypt distinguishes between actual crypto operations (`rsa.GenerateKey()`), imports, key material, references, and comments. Comments are excluded from scoring. Imports weigh less than operations.

![Findings](docs/images/findings.png)

### Compliance Assessment

Check your cryptographic posture against CNSA 2.0, FIPS 140-3, NIST SP 800-208, and PCI DSS 4.0.

![Compliance](docs/images/compliance.png)

### PQC Benchmarks

Benchmark classical crypto on your hardware and compare against NIST post-quantum reference data.

![Benchmarks](docs/images/benchmarks.png)

### Project Monitoring

Track multiple projects over time. See grades at a glance.

![Projects](docs/images/projects.png)

## What It Detects

| Algorithm | Risk | Quantum Attack | Break Time |
|-----------|------|---------------|------------|
| RSA (all sizes) | CRITICAL | Shor's algorithm | ~8 hours (2048-bit) |
| ECDSA, ECDH, Ed25519 | CRITICAL | Shor's algorithm | Minutes to hours |
| DH, DSA | CRITICAL | Shor's algorithm | ~hours |
| AES-128 | WARNING | Grover's algorithm | Reduced to 64-bit security |
| MD5, SHA-1 | WARNING | Classically broken | Already broken |
| DES, 3DES, RC4 | WARNING | Classically broken | Already broken |
| AES-256, SHA-256, SHA-3 | OK | Quantum-safe | No migration needed |

All quantum break time estimates are sourced from peer-reviewed research. See [`src/reference/quantum-estimates.ts`](src/reference/quantum-estimates.ts) for full citations.

## Languages

Python, JavaScript, TypeScript, Go, Rust, Java, Kotlin, C, C++, Ruby, PHP.

Certificate files (PEM, CRT, KEY) are parsed for actual key type and size. Config files (nginx, sshd, haproxy, OpenSSL) are scanned for protocol and cipher settings. Dependency manifests (package.json, go.mod, requirements.txt, Cargo.toml) are checked for crypto libraries.

## GitHub Action

Add quantum crypto scanning to every PR. **Diff-aware** — only reports NEW findings introduced by the PR, not existing tech debt.

```yaml
name: Quantum Crypto Scan
on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  qcrypt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: varmabudharaju/qcrypt@main
        with:
          fail-on: critical
```

The action posts a comment on the PR:

```
## qcrypt-scan — Quantum Crypto Audit

Grade: B → D  |  New: 3 findings  |  Resolved: 0

| Risk | Algorithm | Location | Type |
|------|-----------|----------|------|
| CRITICAL | RSA-2048 | src/auth.go:45 | operation |
| WARNING | MD5 | src/hash.go:12 | operation |

> Quantum Threat: RSA-2048 — breakable in ~8 hours (Shor's algorithm)
```

## CLI Reference

```bash
# Scan
qcrypt-scan [path or github-url]       # Terminal output
qcrypt-scan . --json                    # JSON
qcrypt-scan . --sarif                   # SARIF 2.1.0
qcrypt-scan . --cbom                    # CycloneDX 1.6 CBOM

# CI
qcrypt-scan . --ci --fail-on C          # Exit code 1 if grade is C or worse
qcrypt-scan ci init --provider github   # Scaffold CI workflow
qcrypt-scan ci diff --pr a.json --base b.json  # Diff two scans

# Tools
qcrypt-scan bench                       # Benchmark crypto performance
qcrypt-scan bench --category kex --json # Benchmark key exchange, JSON output
qcrypt-scan migrate [path]              # Generate migration plan
qcrypt-scan migrate . --markdown        # Write migration-plan.md

# Web UI
qcrypt-scan --serve                     # Start dashboard on port 3100
qcrypt-scan --serve --port 8080         # Custom port
```

## How It Works

1. **Discover** — walks the codebase, classifies files by language
2. **Scan** — language-aware pattern matching for crypto APIs (OpenSSL, stdlib, common libraries)
3. **Classify** — each finding tagged as operation, import, key-material, config, reference, or comment
4. **Parse** — certificates and keys parsed for actual key type and size via Node.js crypto
5. **Score** — multi-dimensional readiness score (vulnerability, priority, migration, agility)
6. **Analyze** — quantum break times from peer-reviewed research, NIST compliance deadlines
7. **Report** — terminal, JSON, SARIF, CBOM, HTML, or web dashboard

The scanner uses regex-based pattern matching, not AST parsing. This means ~85-90% accuracy across languages with occasional false positives from string literals and documentation. Usage classification (operation vs import vs comment) significantly reduces noise. A language coverage warning appears when the primary language is unsupported.

## Research Sources

| Source | Used For |
|--------|----------|
| [Gidney & Ekeraa (2021)](https://doi.org/10.22331/q-2021-04-15-433) | RSA-2048 quantum break time: ~8 hours, 20M qubits |
| [Roetteler et al. (2017)](https://doi.org/10.1007/978-3-319-70697-9_9) | ECC quantum resource estimates: 2,330 logical qubits for P-256 |
| [Grassl et al. (2016)](https://doi.org/10.1007/978-3-319-29360-8_3) | AES quantum circuit: 2,953 qubits for AES-128, 6,681 for AES-256 |
| [NIST IR 8547 (2024, draft)](https://csrc.nist.gov/pubs/ir/8547/ipd) | PQC transition timelines: 2030 deprecation, 2035 prohibition |
| [Proos & Zalka (2003)](https://arxiv.org/abs/quant-ph/0301141) | Elliptic curve discrete log: ~6n qubits for n-bit curve |

## License

MIT
