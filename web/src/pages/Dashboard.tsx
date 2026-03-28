import { useState } from 'react';
import { runBench, type BenchmarkReport } from '../api.ts';
import ResultsTable from '../components/ResultsTable.tsx';

const CATEGORIES = ['all', 'kex', 'sigs', 'sym', 'hash'] as const;

export default function Dashboard() {
  const [iterations, setIterations] = useState(1000);
  const [category, setCategory] = useState<string>('all');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await runBench(iterations, category);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Benchmark failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Benchmark Dashboard</h2>

      <div className="flex items-end gap-4 mb-8">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Iterations</label>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-48"
          />
          <span className="ml-2 text-sm font-mono">{iterations}</span>
        </div>

        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] bg-white dark:bg-[#111] text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-1.5 rounded bg-accent text-black font-medium text-sm hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {running ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Platform: {report.platform.os} {report.platform.arch}</span>
            <span>CPU: {report.platform.cpuModel}</span>
            <span>Node: {report.platform.node}</span>
          </div>
          <ResultsTable results={report.results} />
        </div>
      )}
    </div>
  );
}
