import type { ScanReport, RiskLevel } from '../types.js';

const SARIF_SCHEMA = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/cos02/schemas/sarif-schema-2.1.0.json';

const levelMap: Record<RiskLevel, string> = {
  CRITICAL: 'error',
  WARNING: 'warning',
  INFO: 'note',
  OK: 'note',
};

export function formatSarif(report: ScanReport): string {
  const rulesMap = new Map<string, { id: string; shortDescription: string; fullDescription: string }>();

  for (const finding of report.findings) {
    if (!rulesMap.has(finding.algorithm)) {
      rulesMap.set(finding.algorithm, {
        id: finding.algorithm,
        shortDescription: `Quantum-vulnerable: ${finding.algorithm}`,
        fullDescription: finding.explanation,
      });
    }
  }

  const rules = Array.from(rulesMap.values()).map((r) => ({
    id: r.id,
    shortDescription: { text: r.shortDescription },
    fullDescription: { text: r.fullDescription },
  }));

  const results = report.findings.map((finding) => ({
    ruleId: finding.algorithm,
    level: levelMap[finding.risk],
    message: {
      text: `${finding.algorithm}: ${finding.explanation} Fix: ${finding.replacement}`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.file },
          region: { startLine: finding.line },
        },
      },
    ],
  }));

  const sarif = {
    $schema: SARIF_SCHEMA,
    version: '2.1.0' as const,
    runs: [
      {
        tool: {
          driver: {
            name: 'qcrypt-scan',
            version: '0.2.0',
            informationUri: 'https://github.com/varmabudharaju/qcrypt-scan',
            rules,
          },
        },
        results,
        properties: {
          readinessScore: report.readiness.overall,
          grade: report.grade,
        },
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
