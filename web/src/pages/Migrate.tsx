import { useState } from 'react';
import { generateMigratePlan, type MigrationPlan, type MigrationStep } from '../api.ts';
import FolderPicker from '../components/FolderPicker.tsx';

const PRIORITY_STYLES: Record<string, string> = {
  immediate: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  'short-term': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  'long-term': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
};

const EFFORT_STYLES: Record<string, string> = {
  low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

function StepCard({ step }: { step: MigrationStep }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-[#333] rounded-lg p-4 mb-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[step.priority]}`}>
            {step.priority}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${EFFORT_STYLES[step.effort]}`}>
            {step.effort}
          </span>
          <span className="font-medium text-sm">{step.action}</span>
          <span className="ml-auto text-slate-400 text-xs">{expanded ? '\u25BC' : '\u25B6'}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {step.finding.file}:{step.finding.line}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current Code</div>
            <pre className="bg-slate-100 dark:bg-[#111] p-2 rounded text-xs overflow-x-auto">
              {step.finding.snippet}
            </pre>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Migration Example</div>
            <pre className="bg-slate-100 dark:bg-[#111] p-2 rounded text-xs overflow-x-auto">
              {step.codeExample}
            </pre>
          </div>
          {step.dependencies.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Dependencies: </span>
              {step.dependencies.map((d) => (
                <code key={d} className="bg-slate-100 dark:bg-[#111] px-1 rounded mr-1">{d}</code>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Note: </span>{step.notes}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Migrate() {
  const [scanPath, setScanPath] = useState('.');
  const [showBrowser, setShowBrowser] = useState(false);
  const [running, setRunning] = useState(false);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await generateMigratePlan(scanPath);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate migration plan');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = () => {
    if (!plan) return;
    const lines = [
      '# Migration Plan\n\n',
      `Generated: ${plan.generatedAt}\n\n`,
      `Changes: ${plan.estimatedEffort}\n\n`,
    ];
    for (const step of plan.steps) {
      lines.push(`## ${step.action}\n\n`);
      lines.push(`- **File:** ${step.finding.file}:${step.finding.line}\n`);
      lines.push(`- **Priority:** ${step.priority} | **Effort:** ${step.effort}\n\n`);
      lines.push(`\`\`\`\n${step.codeExample}\n\`\`\`\n\n`);
      if (step.dependencies.length > 0) {
        lines.push(`**Dependencies:** ${step.dependencies.join(', ')}\n\n`);
      }
      lines.push(`> ${step.notes}\n\n`);
    }
    const blob = new Blob([lines.join('')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'migration-plan.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const immediate = plan?.steps.filter((s) => s.priority === 'immediate') ?? [];
  const shortTerm = plan?.steps.filter((s) => s.priority === 'short-term') ?? [];
  const longTerm = plan?.steps.filter((s) => s.priority === 'long-term') ?? [];

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Migration Guide</h2>

      <div className="flex items-end gap-4 mb-8 flex-wrap">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Path to scan</label>
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] bg-white dark:bg-[#111] text-sm w-64"
            placeholder="."
          />
        </div>

        <button
          onClick={() => setShowBrowser(true)}
          className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
        >
          Browse...
        </button>

        <button
          onClick={handleGenerate}
          disabled={running}
          className="px-4 py-1.5 rounded bg-accent text-black font-medium text-sm hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {running ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {showBrowser && (
        <FolderPicker
          onSelect={(p) => { setScanPath(p); setShowBrowser(false); }}
          onClose={() => setShowBrowser(false)}
        />
      )}

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-4 text-sm">
              <span className="text-red-600 dark:text-red-400 font-medium">
                Immediate: {plan.summary.immediate}
              </span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                Short-term: {plan.summary.shortTerm}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Long-term: {plan.summary.longTerm}
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Download as Markdown
            </button>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {plan.estimatedEffort} &mdash; Grade: {plan.scanReport.grade}
          </div>

          {immediate.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3">Immediate</h3>
              {immediate.map((step, i) => (
                <StepCard key={`imm-${i}`} step={step} />
              ))}
            </div>
          )}

          {shortTerm.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-3">Short-term</h3>
              {shortTerm.map((step, i) => (
                <StepCard key={`st-${i}`} step={step} />
              ))}
            </div>
          )}

          {longTerm.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">Long-term</h3>
              {longTerm.map((step, i) => (
                <StepCard key={`lt-${i}`} step={step} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
