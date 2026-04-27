# Changelog

All notable changes to qcrypt-scan are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] — 2026-04-27

### Added
- One-click folder picker in the local web dashboard. Click **📁 BROWSE** next
  to the scan input, drill into directories under `$HOME`, and hit
  `SCAN_THIS_FOLDER` to scan immediately. Cloud build (qcrypt.dev) is unchanged.
- `--open` flag for `--serve` that auto-launches the default browser at the
  dashboard URL after the server boots.
- Friendly error message when the requested port is already in use, instead of
  a raw `EADDRINUSE` stack trace.

### Changed
- `npm install` now auto-builds both the TypeScript CLI and the React
  dashboard via the `prepare` lifecycle hook. Forkers no longer need a
  separate `npm run build` step.
- Dashboard advertises local-path scanning when running against the local
  Fastify server (helper text + placeholder change). The cloud version still
  shows only the GitHub URL form.
- README Quick Start rewritten around the clone-and-link path. The
  `npx qcrypt-scan` and `pip install qcrypt-scan` lines now indicate the
  registries are coming.

### Fixed
- `--serve` previously returned 404 on every route after a fresh fork because
  `web/dist/` did not exist. The server now returns a clear 503 with build
  instructions if `web/dist/` is missing, and the prepare hook builds it by
  default so this case should not occur in practice.
- `BrowseResult.entries` typed as `string[]` to match what `/api/browse`
  actually returns (it filters to directory names).

## [0.2.0] — 2026-04-21

Initial public release.

### Added
- CLI scanner with terminal, JSON, SARIF 2.1.0, and CycloneDX 1.6 CBOM output.
- React dashboard at `--serve` (default port 3100) with project tracking,
  scan history, compliance assessments, and benchmarks.
- Support for 11 languages: Python, JavaScript, TypeScript, Go, Rust, Java,
  Kotlin, C, C++, Ruby, PHP.
- Certificate parsing (PEM/CRT/KEY) for actual key type and size.
- Config-file scanning (nginx, sshd, haproxy, OpenSSL).
- Dependency-manifest scanning (package.json, go.mod, requirements.txt,
  Cargo.toml).
- Quantum break-time annotations sourced from peer-reviewed research
  (Gidney & Ekerå 2021, Roetteler et al. 2017, Grassl et al. 2016, NIST IR 8547).
- NIST PQC compliance frameworks: CNSA 2.0, FIPS 140-3, NIST SP 800-208,
  PCI DSS 4.0.
- Diff-aware GitHub Action for PR comments.
- Migration plan generator with code examples and effort estimates.

[Unreleased]: https://github.com/varmabudharaju/qcrypt/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/varmabudharaju/qcrypt/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/varmabudharaju/qcrypt/releases/tag/v0.2.0
