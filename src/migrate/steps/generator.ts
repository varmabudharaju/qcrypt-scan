import type { Finding, MigrationStep, Priority, Effort, RiskLevel } from '../types.js';
import { getCodeExample, formatCodeExample, GENERIC_GUIDANCE } from './code-examples.js';
import { getDependencies, detectLanguage } from './dependencies.js';

const PRIORITY_MAP: Record<string, Priority> = {
  CRITICAL: 'immediate',
  WARNING: 'short-term',
  INFO: 'long-term',
};

export function mapRiskToPriority(risk: RiskLevel): Priority | null {
  return PRIORITY_MAP[risk] ?? null;
}

export function estimateEffort(finding: Finding): Effort {
  if (finding.category === 'asymmetric') return 'high';
  if (finding.category === 'protocol') return 'medium';
  return 'low';
}

export function generateAction(finding: Finding): string {
  if (finding.category === 'symmetric' && finding.risk !== 'CRITICAL') {
    return `Upgrade ${finding.algorithm} to ${finding.replacement}`;
  }
  return `Replace ${finding.algorithm} with ${finding.replacement}`;
}

const ROLLBACK_NOTES: Record<string, string> = {
  asymmetric:
    'Key formats change. Test key generation, signing/verification, and key exchange. Consider hybrid mode (classical + PQC) during transition.',
  hash:
    'Hash output changes. Update any stored hashes and verification logic. Cannot decrypt data hashed with old algorithm.',
  symmetric:
    'Key size change requires new key generation. Existing encrypted data needs re-encryption or dual-cipher support during migration.',
  protocol:
    'Protocol change may break existing clients. Coordinate upgrade with all consumers. Support both versions during transition.',
};

export function generateMigrationStep(finding: Finding): MigrationStep | null {
  const priority = mapRiskToPriority(finding.risk);
  if (!priority) return null;

  const lang = detectLanguage(finding.file);
  const example = getCodeExample(finding.algorithm, finding.file);
  const dependencies = getDependencies(lang, finding.category);

  return {
    finding,
    priority,
    action: generateAction(finding),
    codeExample: example ? formatCodeExample(example) : GENERIC_GUIDANCE,
    dependencies,
    effort: estimateEffort(finding),
    notes: ROLLBACK_NOTES[finding.category] ?? '',
  };
}
