/* ────────────────────────────────────────────
   QC-SENTRY  //  API Client
   ──────────────────────────────────────────── */

// Use API Gateway directly when hosted on CloudFront, otherwise use relative /api
const CLOUD_API = import.meta.env.VITE_API_URL || '';
const BASE = CLOUD_API ? `${CLOUD_API}/api` : '/api';

// Session ID: unique per browser tab, cleared when the tab closes
function getSessionId(): string {
  let id = sessionStorage.getItem('qcrypt-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('qcrypt-session-id', id);
  }
  return id;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'X-Session-Id': getSessionId(),
  };
  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  return res.json();
}

/* ── Types ── */

export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash' | 'protocol';
  risk: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';
  snippet: string;
  explanation: string;
  replacement: string;
  quantumThreat?: string;
  hndlRisk?: boolean;
  usageType?: 'operation' | 'import' | 'key-material' | 'config' | 'reference' | 'comment';
  keySize?: number;
}

export interface EnrichedFinding extends Finding {
  nistCategory?: string;
  quantumImpact?: string;
  migrationEffort?: 'low' | 'medium' | 'high';
}

export interface ReadinessScore {
  overall: number;
  grade: string;
  breakdown: {
    asymmetric: number;
    symmetric: number;
    hash: number;
    protocol: number;
  };
}

export interface ScanSummary {
  critical: number;
  warning: number;
  info: number;
  ok: number;
}

export interface QuantumThreat {
  algorithm: string;
  classicalBreakTime: string;
  quantumBreakTime: string;
  quantumAlgorithm: string;
  speedup: string;
  qubitsRequired: string;
  threatLevel: string;
  citation: string;
}

export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  enrichedFindings?: EnrichedFinding[];
  summary: ScanSummary;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness?: ReadinessScore;
  usageBreakdown?: { operations: number; imports: number; keyMaterial: number; config: number; references: number; comments: number };
  quantumSummary?: {
    weakestLink: QuantumThreat | null;
    threats: QuantumThreat[];
  };
  languageCoverage?: { scanned: number; skipped: number; unsupportedExtensions: { ext: string; count: number }[] };
}

export interface MigrationStep {
  finding: Finding;
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
  steps: MigrationStep[];
  summary: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
  };
  estimatedEffort: string;
}

export interface BenchmarkResult {
  algorithm: string;
  operation: string;
  opsPerSecond: number;
  avgTimeMs: number;
  quantumSafe: boolean;
  category?: string;
}

export interface BenchmarkReport {
  id: string;
  timestamp: string;
  iterations: number;
  results: BenchmarkResult[];
  category?: string;
}

export interface ProjectWithLatestScan {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  latestScan?: {
    id: string;
    grade: string;
    scannedAt: string;
    summary: ScanSummary;
  };
}

// Raw shape from the API (snake_case flat fields)
interface RawProject {
  id: string;
  name: string;
  path: string;
  created_at: string;
  latest_scan_id: string | null;
  latest_grade: string | null;
  latest_scanned_at: string | null;
  latest_critical: number | null;
  latest_warning: number | null;
  latest_info: number | null;
  latest_ok: number | null;
  latest_files_scanned: number | null;
  scan_count: number;
}

function transformProject(raw: RawProject): ProjectWithLatestScan {
  return {
    id: raw.id,
    name: raw.name,
    path: raw.path,
    createdAt: raw.created_at,
    latestScan: raw.latest_grade && raw.latest_scan_id ? {
      id: raw.latest_scan_id,
      grade: raw.latest_grade,
      scannedAt: raw.latest_scanned_at ?? '',
      summary: {
        critical: raw.latest_critical ?? 0,
        warning: raw.latest_warning ?? 0,
        info: raw.latest_info ?? 0,
        ok: raw.latest_ok ?? 0,
      },
    } : undefined,
  };
}

export interface ProjectDetailScan {
  id: string;
  scanned_at: string;
  grade: string;
  files_scanned: number;
  critical: number;
  warning: number;
  info: number;
  ok: number;
}

export interface ProjectDetail {
  project: {
    id: string;
    name: string;
    path: string;
    created_at: string;
  };
  scans: ProjectDetailScan[];
}

export interface OverviewStats {
  totalProjects: number;
  totalScans: number;
  totalCritical: number;
  worstGrade: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  deadline?: string;
}

export interface ComplianceAssessment {
  framework: ComplianceFramework;
  status: 'pass' | 'fail' | 'warning';
  findings: { finding: Finding; rule: { algorithmPattern: string; status: string }; status: string }[];
  summary: {
    total: number;
    nonCompliant: number;
    deprecated: number;
    compliant: number;
  };
}

export interface FullComplianceReport {
  scanId: string;
  assessments: ComplianceAssessment[];
  overallStatus: 'pass' | 'fail' | 'warning';
  blockingCount: number;
}

export interface BrowseEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface BrowseResult {
  path: string;
  parent: string | null;
  entries: BrowseEntry[];
}

export interface ReferenceData {
  results: BenchmarkResult[];
  profiles: Record<string, unknown>;
}

export interface ScanResponse {
  project: { id: string; name: string; path: string; created_at: string };
  scan: { id: string; grade: string; scanned_at: string };
  report: ScanReport;
  plan: MigrationPlan;
}

/* ── Endpoints ── */

export function scanPath(path: string): Promise<ScanResponse> {
  return request('/scan', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export interface ScanDetail {
  report: ScanReport;
  plan: MigrationPlan;
  status?: 'scanning' | 'failed' | 'complete';
  error?: string;
}

export function getScan(id: string): Promise<ScanDetail> {
  return request(`/scans/${id}`);
}

export async function runBenchmark(opts?: { iterations?: number; category?: string }): Promise<BenchmarkReport> {
  const result = await request<BenchmarkReport & { status?: string; benchId?: string }>('/bench', {
    method: 'POST',
    body: JSON.stringify(opts ?? {}),
  });

  // Async benchmark — poll until ready
  if (result.status === 'running' && result.benchId) {
    const benchId = result.benchId;
    return new Promise((resolve, reject) => {
      async function poll() {
        try {
          const data = await request<BenchmarkReport & { status?: string }>(`/bench/${benchId}`);
          if (data.status === 'running') {
            setTimeout(poll, 2000);
            return;
          }
          if (data.status === 'failed') {
            reject(new Error('Benchmark failed'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(err);
        }
      }
      setTimeout(poll, 2000);
    });
  }

  return result;
}

export function getBenchmarkHistory(): Promise<BenchmarkReport[]> {
  return request('/bench/history');
}

export function getReference(): Promise<ReferenceData> {
  return request('/reference');
}

export async function getMigrationPlan(path?: string): Promise<MigrationPlan> {
  const result = await request<MigrationPlan & { status?: string; scanId?: string }>('/migrate', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });

  // If the backend triggered an async scan, poll until the plan is ready
  if (result.status === 'scanning' && result.scanId) {
    const scanId = result.scanId;
    return new Promise((resolve, reject) => {
      async function poll() {
        try {
          const scan = await request<{ status?: string; report?: unknown; plan?: MigrationPlan }>(`/scans/${scanId}`);
          if (scan.status === 'scanning') {
            setTimeout(poll, 3000);
            return;
          }
          if (scan.status === 'failed') {
            reject(new Error('Scan failed. The repository may be too large, private, or unavailable.'));
            return;
          }
          if (scan.plan) {
            resolve(scan.plan);
          } else {
            reject(new Error('Migration plan not available'));
          }
        } catch (err) {
          reject(err);
        }
      }
      setTimeout(poll, 3000);
    });
  }

  return result;
}

export function browse(path?: string): Promise<BrowseResult> {
  const q = path ? `?path=${encodeURIComponent(path)}` : '';
  return request(`/browse${q}`);
}

export async function getProjects(): Promise<ProjectWithLatestScan[]> {
  const raw = await request<RawProject[]>('/projects');
  return raw.map(transformProject);
}

export function getProject(id: string): Promise<ProjectDetail> {
  return request(`/projects/${id}`);
}

export function deleteProject(id: string): Promise<void> {
  return request(`/projects/${id}`, { method: 'DELETE' });
}

export function rescanProject(id: string): Promise<ScanResponse> {
  return request(`/projects/${id}/scan`, { method: 'POST' });
}

export function getOverview(): Promise<OverviewStats> {
  return request('/overview');
}

export function getComplianceFrameworks(): Promise<ComplianceFramework[]> {
  return request('/compliance/frameworks');
}

export function assessCompliance(scanId: string): Promise<FullComplianceReport> {
  return request(`/compliance/assess/${scanId}`);
}

export function downloadHtmlReport(scanId: string): string {
  return `${BASE}/reports/${scanId}/html`;
}

export function healthCheck(): Promise<{ status: string }> {
  return request('/health');
}
