import type { BenchmarkReport } from '../api.ts';

interface Props {
  results: BenchmarkReport['results'];
}

export default function ResultsTable({ results }: Props) {
  const local = results.filter((r) => !r.isReference);
  const reference = results.filter((r) => r.isReference);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#333] text-left text-slate-500 dark:text-slate-400">
            <th className="pb-2 pr-4">Algorithm</th>
            <th className="pb-2 pr-4">Operation</th>
            <th className="pb-2 pr-4 text-right">ops/sec</th>
            <th className="pb-2 pr-4 text-right">avg ms</th>
            <th className="pb-2 pr-4 text-center">Quantum Safe</th>
            <th className="pb-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {local.length > 0 && (
            <tr>
              <td colSpan={6} className="pt-4 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Classical (local benchmark)
              </td>
            </tr>
          )}
          {local.map((r, i) => (
            <ResultRow key={`local-${i}`} result={r} />
          ))}
          {reference.length > 0 && (
            <tr>
              <td colSpan={6} className="pt-6 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Post-Quantum (NIST reference)
              </td>
            </tr>
          )}
          {reference.map((r, i) => (
            <ResultRow key={`ref-${i}`} result={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultRow({ result: r }: { result: BenchmarkReport['results'][number] }) {
  return (
    <tr className="border-b border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#111]">
      <td className="py-2 pr-4 font-mono">{r.algorithm}</td>
      <td className="py-2 pr-4">{r.operation}</td>
      <td className="py-2 pr-4 text-right font-mono">{r.opsPerSecond.toLocaleString()}</td>
      <td className="py-2 pr-4 text-right font-mono">{r.avgTimeMs.toFixed(4)}</td>
      <td className="py-2 pr-4 text-center">
        {r.quantumSafe ? (
          <span className="text-green-500">Yes</span>
        ) : (
          <span className="text-red-400">No</span>
        )}
      </td>
      <td className="py-2">
        {r.isReference ? (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            NIST ref
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            Local
          </span>
        )}
      </td>
    </tr>
  );
}
