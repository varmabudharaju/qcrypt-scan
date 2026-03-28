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
