import { readFileSync, readdirSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
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

  const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
  allFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const summary = {
    critical: allFindings.filter((f) => f.risk === 'CRITICAL').length,
    warning: allFindings.filter((f) => f.risk === 'WARNING').length,
    info: allFindings.filter((f) => f.risk === 'INFO').length,
    ok: allFindings.filter((f) => f.risk === 'OK').length,
  };

  return {
    id: randomUUID(),
    path: targetPath,
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    findings: allFindings,
    summary,
    grade: computeGrade(summary.critical, summary.warning),
  };
}
