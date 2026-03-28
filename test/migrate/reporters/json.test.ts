import { describe, it, expect } from 'vitest';
import { formatJson } from '../src/migrate/reporters/json.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatJson', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatJson(plan);

  it('produces valid JSON', () => {
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('round-trips the plan structure', () => {
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe(plan.id);
    expect(parsed.steps.length).toBe(plan.steps.length);
    expect(parsed.summary).toEqual(plan.summary);
    expect(parsed.estimatedEffort).toBe(plan.estimatedEffort);
  });

  it('is pretty-printed with 2-space indent', () => {
    expect(output).toContain('\n  ');
  });
});
