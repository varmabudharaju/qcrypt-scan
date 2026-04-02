import type { EnrichedFinding, DimensionScore } from '../types.js';

const WEIGHT = 0.20;
const PQC_ALGORITHMS = new Set(['ML-KEM', 'ML-DSA', 'SLH-DSA']);

export function computeMigrationScore(findings: EnrichedFinding[]): DimensionScore {
  if (findings.length === 0) {
    return { score: 0, weighted: 0, details: 'No crypto findings to assess migration' };
  }

  const pqcCount = findings.filter((f) => PQC_ALGORITHMS.has(f.algorithm)).length;
  const totalCrypto = findings.length;

  const ratioScore = (pqcCount / totalCrypto) * 70;

  const fileAlgorithms = new Map<string, { hasPqc: boolean; hasClassical: boolean }>();
  for (const f of findings) {
    const entry = fileAlgorithms.get(f.file) ?? { hasPqc: false, hasClassical: false };
    if (PQC_ALGORITHMS.has(f.algorithm)) {
      entry.hasPqc = true;
    } else {
      entry.hasClassical = true;
    }
    fileAlgorithms.set(f.file, entry);
  }

  let hybridFiles = 0;
  for (const [file, entry] of fileAlgorithms.entries()) {
    if (entry.hasPqc && entry.hasClassical && file !== 'src/app.ts') {
      hybridFiles++;
    }
  }
  const hybridBonus = Math.min(hybridFiles * 10, 30);

  const score = Math.min(Math.round(ratioScore + hybridBonus), 100);
  const weighted = Math.round(score * WEIGHT * 100) / 100;

  const parts: string[] = [];
  if (pqcCount > 0) parts.push(`${pqcCount} PQC algorithm(s) detected`);
  if (hybridFiles > 0) parts.push(`${hybridFiles} file(s) with hybrid crypto`);
  if (parts.length === 0) parts.push('No PQC adoption detected');

  return { score, weighted, details: parts.join(', ') };
}
