import { randomUUID } from 'node:crypto';
import type { ScanReport, MigrationPlan, MigrationStep } from './types.js';
import { generateMigrationStep } from './steps/generator.js';

export function generateMigrationPlan(scanReport: ScanReport): MigrationPlan {
  const steps: MigrationStep[] = [];

  for (const finding of scanReport.findings) {
    const step = generateMigrationStep(finding);
    if (step) steps.push(step);
  }

  const summary = {
    immediate: steps.filter((s) => s.priority === 'immediate').length,
    shortTerm: steps.filter((s) => s.priority === 'short-term').length,
    longTerm: steps.filter((s) => s.priority === 'long-term').length,
  };

  const fileCount = new Set(steps.map((s) => s.finding.file)).size;

  return {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    scanReport,
    steps,
    summary,
    estimatedEffort: `${steps.length} changes across ${fileCount} files`,
  };
}
