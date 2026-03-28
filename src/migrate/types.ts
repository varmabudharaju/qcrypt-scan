export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';
export type AlgorithmCategory = 'asymmetric' | 'symmetric' | 'hash' | 'protocol';
export type Priority = 'immediate' | 'short-term' | 'long-term';
export type Effort = 'low' | 'medium' | 'high';

export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: AlgorithmCategory;
  risk: RiskLevel;
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface MigrationStep {
  finding: Finding;
  priority: Priority;
  action: string;
  codeExample: string;
  dependencies: string[];
  effort: Effort;
  notes: string;
}

export interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: ScanReport;
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;
}
