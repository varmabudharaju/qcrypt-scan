export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';

export type AlgorithmCategory = 'asymmetric' | 'symmetric' | 'hash' | 'protocol';

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
  enrichedFindings: EnrichedFinding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness: ReadinessScore;
}

export interface AlgorithmRule {
  id: string;
  name: string;
  risk: RiskLevel;
  category: AlgorithmCategory;
}

export interface PatternMatch {
  algorithm: string;
  line: number;
  snippet: string;
}

export interface LanguagePatterns {
  extensions: string[];
  patterns: Array<{
    algorithm: string;
    regex: RegExp;
  }>;
}

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
