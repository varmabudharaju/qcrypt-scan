import path from 'node:path';
import type { Finding } from '../types.js';
import { scanContent } from '../rules/patterns.js';
import { getAlgorithmRule } from '../rules/algorithms.js';
import { getExplanation } from '../education/explanations.js';

export function scanSourceFile(filePath: string, content: string): Finding[] {
  const ext = path.extname(filePath);
  const matches = scanContent(content, ext);

  return matches
    .map((match) => {
      const rule = getAlgorithmRule(match.algorithm);
      if (!rule) return null;

      const education = getExplanation(match.algorithm);
      return {
        file: filePath,
        line: match.line,
        algorithm: match.algorithm,
        category: rule.category,
        risk: rule.risk,
        snippet: match.snippet,
        explanation: education.explanation,
        replacement: education.replacement,
      };
    })
    .filter((f): f is Finding => f !== null);
}
