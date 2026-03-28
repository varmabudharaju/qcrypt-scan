import type { MigrationPlan } from '../types.js';

export function formatJson(plan: MigrationPlan): string {
  return JSON.stringify(plan, null, 2);
}
