import type { MigrationPlan, MigrationStep } from '../types.js';

function stepToMarkdown(step: MigrationStep, index: number): string {
  const lines = [
    `### ${index + 1}. ${step.action}`,
    '',
    `- **File:** \`${step.finding.file}:${step.finding.line}\``,
    `- **Priority:** ${step.priority}`,
    `- **Effort:** ${step.effort}`,
    `- **Current:** \`${step.finding.algorithm}\``,
    '',
    '```',
    step.codeExample,
    '```',
    '',
  ];

  if (step.dependencies.length > 0) {
    lines.push(
      `**Dependencies:** ${step.dependencies.map((d) => `\`${d}\``).join(', ')}`,
      '',
    );
  }

  lines.push(`> **Note:** ${step.notes}`, '');

  return lines.join('\n');
}

export function formatMarkdown(plan: MigrationPlan): string {
  const immediate = plan.steps.filter((s) => s.priority === 'immediate');
  const shortTerm = plan.steps.filter((s) => s.priority === 'short-term');
  const longTerm = plan.steps.filter((s) => s.priority === 'long-term');

  const lines = [
    '# Migration Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    `Scan: ${plan.scanReport.path} (${plan.scanReport.filesScanned} files, grade ${plan.scanReport.grade})`,
    '',
    `Changes: ${plan.estimatedEffort}`,
    '',
    '| Priority | Count |',
    '|----------|-------|',
    `| Immediate | ${plan.summary.immediate} |`,
    `| Short-term | ${plan.summary.shortTerm} |`,
    `| Long-term | ${plan.summary.longTerm} |`,
    '',
  ];

  if (immediate.length > 0) {
    lines.push('## Immediate (Critical)', '');
    let idx = 0;
    for (const step of immediate) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  if (shortTerm.length > 0) {
    lines.push('## Short-term (Warning)', '');
    let idx = immediate.length;
    for (const step of shortTerm) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  if (longTerm.length > 0) {
    lines.push('## Long-term (Info)', '');
    let idx = immediate.length + shortTerm.length;
    for (const step of longTerm) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  return lines.join('\n');
}
