import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMigrationPlan, getProjects } from '../api';
import type { MigrationPlan, MigrationStep, ProjectWithLatestScan } from '../api';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  immediate: { bg: 'bg-error-container/40', text: 'text-error', label: 'IMMEDIATE' },
  'short-term': { bg: 'bg-tertiary-fixed-dim/20', text: 'text-tertiary-fixed-dim', label: 'SHORT-TERM' },
  'long-term': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'LONG-TERM' },
};

const EFFORT_COLORS: Record<string, string> = {
  low: 'text-primary-container',
  medium: 'text-tertiary-fixed-dim',
  high: 'text-error',
};

function StepCard({ step }: { step: MigrationStep }) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_STYLES[step.priority] ?? PRIORITY_STYLES['long-term'];

  return (
    <div className="bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 ${priority.bg} ${priority.text} flex-shrink-0`}>
            {priority.label}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-sm text-primary">
              {step.finding.algorithm} &rarr; <span className="text-primary-container">{step.finding.replacement}</span>
            </p>
            <p className="font-mono text-[10px] text-on-surface-variant mt-0.5 truncate">
              {step.finding.file}:{step.finding.line}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`font-mono text-[10px] font-bold ${EFFORT_COLORS[step.effort] ?? 'text-on-surface-variant'}`}>
            {step.effort.toUpperCase()}
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-container-high space-y-3">
          <p className="text-xs text-on-surface-variant">{step.action}</p>
          {step.finding.snippet && (
            <div>
              <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">SOURCE</p>
              <code className="block font-mono text-xs bg-surface p-3 text-on-surface overflow-x-auto">
                {step.finding.snippet}
              </code>
            </div>
          )}
          {step.codeExample && (
            <div>
              <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">CODE EXAMPLE</p>
              <pre className="font-mono text-xs text-primary-container bg-surface p-3 overflow-x-auto whitespace-pre-wrap">
                {step.codeExample}
              </pre>
            </div>
          )}
          {step.dependencies.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">DEPENDENCIES</p>
              <div className="flex flex-wrap gap-1">
                {step.dependencies.map((dep) => (
                  <span key={dep} className="font-mono text-[10px] px-2 py-0.5 bg-surface-container text-primary-container">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
          {step.notes && (
            <p className="text-xs text-on-surface-variant/70 italic">{step.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function downloadHtml(plan: MigrationPlan) {
  const date = new Date().toISOString().split('T')[0];
  const rows = plan.steps.map(s => `
    <tr>
      <td><span class="badge ${s.priority === 'immediate' ? 'red' : s.priority === 'short-term' ? 'yellow' : 'dim'}">${s.priority.toUpperCase()}</span></td>
      <td class="mono">${esc(s.finding.file)}:${s.finding.line}</td>
      <td class="mono">${esc(s.finding.algorithm)}</td>
      <td>${esc(s.action)}</td>
      <td class="mono accent">${esc(s.finding.replacement)}</td>
      <td><span class="badge ${s.effort === 'high' ? 'red' : s.effort === 'medium' ? 'yellow' : 'green'}">${s.effort.toUpperCase()}</span></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Migration Plan — ${date}</title>
<style>
  :root{--bg:#131318;--s:#1b1b20;--t:#e4e1e9;--d:#baccb0;--a:#39ff14;--e:#ffb4ab;--w:#fbbf24;}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--t);font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;padding:3rem 2rem;max-width:1100px;margin:0 auto}
  .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
  h1{font-size:2rem;color:var(--a);margin-bottom:.5rem;letter-spacing:-.02em}
  .sub{font-size:10px;color:var(--d);text-transform:uppercase;letter-spacing:.15em;margin-bottom:2rem}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
  .stat{background:var(--s);padding:1rem}
  .stat .label{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.15em;color:var(--d);margin-bottom:.25rem}
  .stat .val{font-family:'JetBrains Mono',monospace;font-size:1.5rem;font-weight:700}
  table{width:100%;border-collapse:separate;border-spacing:0 2px}
  th{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--d);text-align:left;padding:.5rem .75rem;background:#0e0e13}
  td{padding:.5rem .75rem;background:var(--s);font-size:13px}
  .badge{display:inline-block;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700}
  .red{background:rgba(255,180,171,.15);color:var(--e)}
  .yellow{background:rgba(251,191,36,.15);color:var(--w)}
  .green{background:rgba(57,255,20,.15);color:var(--a)}
  .dim{background:rgba(186,204,176,.1);color:var(--d)}
  .accent{color:var(--a)}
  @media print{body{background:#fff;color:#000}td{background:#f5f5f5}th{background:#eee;color:#333}.accent{color:#006600}}
</style></head><body>
<h1>PQC MIGRATION PLAN</h1>
<div class="sub">Generated ${date} // ${plan.estimatedEffort}</div>
<div class="summary">
  <div class="stat"><div class="label">Immediate</div><div class="val" style="color:var(--e)">${plan.summary.immediate}</div></div>
  <div class="stat"><div class="label">Short-term</div><div class="val" style="color:var(--w)">${plan.summary.shortTerm}</div></div>
  <div class="stat"><div class="label">Long-term</div><div class="val">${plan.summary.longTerm}</div></div>
  <div class="stat"><div class="label">Total Steps</div><div class="val" style="color:var(--a)">${plan.steps.length}</div></div>
</div>
<table><thead><tr><th>Priority</th><th>Location</th><th>Algorithm</th><th>Action</th><th>Replacement</th><th>Effort</th></tr></thead>
<tbody>${rows}</tbody></table>
<p style="margin-top:2rem;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--d);text-transform:uppercase;letter-spacing:.1em">
  Generated by qcrypt-scan v0.2.0 // Print (CMD+P) for PDF
</p></body></html>`;

  downloadFile(html, `migration-plan-${date}.html`, 'text/html');
}

export function Migration() {
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [path, setPath] = useState(searchParams.get('path') || '');
  const [projects, setProjects] = useState<ProjectWithLatestScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load projects for the dropdown
  useEffect(() => {
    getProjects().then(setProjects).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'));
  }, []);

  // Auto-generate if path came from URL param
  useEffect(() => {
    const paramPath = searchParams.get('path');
    if (paramPath) {
      setPath(paramPath);
      setLoading(true);
      setError('');
      getMigrationPlan(paramPath)
        .then(setPlan)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to generate migration plan'))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  const handleGenerateForPath = async (targetPath: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getMigrationPlan(targetPath || undefined);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate migration plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => handleGenerateForPath(path);

  const handleSelectProject = (projectPath: string) => {
    setPath(projectPath);
    handleGenerateForPath(projectPath);
  };

  const groupByPriority = (steps: MigrationStep[]) => {
    const groups: Record<string, MigrationStep[]> = {
      immediate: [],
      'short-term': [],
      'long-term': [],
    };
    for (const step of steps) {
      const key = step.priority in groups ? step.priority : 'long-term';
      groups[key].push(step);
    }
    return groups;
  };

  const groups = plan ? groupByPriority(plan.steps) : null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mb-2">
            TRANSITION PLANNER
          </p>
          <h1 className="font-headline text-3xl font-bold text-primary uppercase tracking-tight">
            PQC MIGRATION PLAN
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-xl">
            Prioritized migration steps to transition your cryptographic infrastructure to quantum-resistant algorithms.
          </p>
        </div>
        {plan && (
          <div className="flex gap-2">
            <button
              onClick={() => downloadJson(plan, `migration-plan-${new Date().toISOString().split('T')[0]}.json`)}
              className="px-4 py-2 font-mono text-xs font-bold text-primary-container bg-surface-container hover:bg-surface-container-high transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">data_object</span>
              JSON
            </button>
            <button
              onClick={() => downloadHtml(plan)}
              className="btn-neon px-4 py-2 text-xs inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              HTML
            </button>
          </div>
        )}
      </div>

      {/* Path input + Project selector */}
      <div className="bg-surface-container-low p-5 space-y-3">
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-2">SELECT PROJECT</p>
          <div className="flex flex-wrap gap-2">
            {projects.filter((p) => p.latestScan).map((proj) => (
              <button
                key={proj.id}
                onClick={() => handleSelectProject(proj.path)}
                className={`px-3 py-1.5 font-mono text-[10px] transition-colors ${
                  path === proj.path
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                }`}
              >
                {proj.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-2">OR ENTER PATH / GITHUB URL</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="https://github.com/org/repo"
              className="flex-1 px-3 py-2 bg-surface-container-lowest text-primary font-mono text-sm placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-container/50 border-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-neon px-6 py-2 text-xs"
            >
              {loading ? 'GENERATING...' : 'GENERATE PLAN'}
            </button>
          </div>
          {error && <p className="font-mono text-xs text-error mt-2">{error}</p>}
        </div>
      </div>

      {/* Summary */}
      {plan?.summary && (
        <div className="grid grid-cols-4 gap-px bg-surface-container-high">
          <div className="bg-surface-container-low p-4">
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">IMMEDIATE</p>
            <p className="stat-value text-2xl text-error">{plan.summary.immediate}</p>
          </div>
          <div className="bg-surface-container-low p-4">
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">SHORT-TERM</p>
            <p className="stat-value text-2xl text-tertiary-fixed-dim">{plan.summary.shortTerm}</p>
          </div>
          <div className="bg-surface-container-low p-4">
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">LONG-TERM</p>
            <p className="stat-value text-2xl text-on-surface-variant">{plan.summary.longTerm}</p>
          </div>
          <div className="bg-surface-container-low p-4">
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">TOTAL EFFORT</p>
            <p className="stat-value text-sm text-primary-container">{plan.estimatedEffort}</p>
          </div>
        </div>
      )}

      {/* Migration Steps by Priority */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-surface-container-low">
          <div className="w-6 h-6 border-2 border-primary-container border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-on-surface-variant ml-3 tracking-wider">COMPUTING MIGRATION PATH...</span>
        </div>
      ) : groups ? (
        <>
          {(['immediate', 'short-term', 'long-term'] as const).map((priority) => {
            const steps = groups[priority];
            if (steps.length === 0) return null;
            const style = PRIORITY_STYLES[priority];
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant/50">{steps.length} steps</span>
                </div>
                <div className="space-y-1">
                  {steps.map((step, i) => (
                    <StepCard key={`${step.finding.file}-${step.finding.line}-${i}`} step={step} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : !error ? (
        <div className="bg-surface-container-low p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">conversion_path</span>
          <p className="font-mono text-xs text-on-surface-variant mt-4">
            Select a project or enter a path to generate a migration plan.
          </p>
        </div>
      ) : null}
    </div>
  );
}
