import { describe, it, expect } from 'vitest';
import { formatMarkdown } from '../src/migrate/reporters/markdown.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatMarkdown', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatMarkdown(plan);

  it('starts with a heading', () => {
    expect(output).toMatch(/^# Migration Plan/);
  });

  it('includes a summary table', () => {
    expect(output).toContain('| Priority');
    expect(output).toContain('| Immediate');
    expect(output).toContain('| Short-term');
    expect(output).toContain('| Long-term');
  });

  it('includes phase sections as h2 headings', () => {
    expect(output).toContain('## Immediate (Critical)');
    expect(output).toContain('## Short-term (Warning)');
    expect(output).toContain('## Long-term (Info)');
  });

  it('includes step details with file references', () => {
    expect(output).toContain('`src/auth.ts:15`');
    expect(output).toContain('RSA-2048');
  });

  it('includes code blocks', () => {
    expect(output).toContain('```');
    expect(output).toContain('// Before:');
    expect(output).toContain('// After:');
  });

  it('includes dependency info', () => {
    expect(output).toContain('`@noble/post-quantum`');
  });

  it('includes rollback notes', () => {
    expect(output).toContain('> **Note:**');
  });
});
