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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function runBench(iterations: number, category: string): Promise<BenchmarkReport> {
  return fetchJson('/api/bench', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iterations, category }),
  });
}

export function getBenchHistory(): Promise<BenchmarkReport[]> {
  return fetchJson('/api/bench/history');
}

export function getBench(id: string): Promise<BenchmarkReport> {
  return fetchJson(`/api/bench/${id}`);
}

export function getReference(): Promise<{ results: BenchmarkResult[]; profiles: AlgorithmProfile[] }> {
  return fetchJson('/api/reference');
}

export function healthCheck(): Promise<{ status: string }> {
  return fetchJson('/api/health');
}

// ── Browse API ──

export interface BrowseResult {
  path: string;
  parent: string;
  entries: string[];
}

export function browsePath(dirPath?: string): Promise<BrowseResult> {
  const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
  return fetchJson(`/api/browse${params}`);
}

// ── Migrate types ──

export interface MigrateFinding {
  file: string;
  line: number;
  algorithm: string;
  category: string;
  risk: string;
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface MigrationStep {
  finding: MigrateFinding;
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  codeExample: string;
  dependencies: string[];
  effort: 'low' | 'medium' | 'high';
  notes: string;
}

export interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: {
    id: string;
    path: string;
    scannedAt: string;
    filesScanned: number;
    findings: MigrateFinding[];
    summary: { critical: number; warning: number; info: number; ok: number };
    grade: string;
  };
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;
}

// ── Migrate API ──

export function generateMigratePlan(
  path?: string,
  scanReport?: MigrationPlan['scanReport'],
): Promise<MigrationPlan> {
  return fetchJson('/api/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, scanReport }),
  });
}

export function getMigrateHistory(): Promise<MigrationPlan[]> {
  return fetchJson('/api/migrate/history');
}

export function getMigratePlan(id: string): Promise<MigrationPlan> {
  return fetchJson(`/api/migrate/${id}`);
}
