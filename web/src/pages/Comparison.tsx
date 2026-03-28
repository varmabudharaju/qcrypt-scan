import { useEffect, useState } from 'react';
import { runBench, getReference, type BenchmarkReport } from '../api.ts';
import SpeedBar from '../components/SpeedBar.tsx';
import SizeBadge from '../components/SizeBadge.tsx';

interface ReferenceData {
  results: BenchmarkReport['results'];
  profiles: BenchmarkReport['profiles'];
}

export default function Comparison() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      runBench(100, 'all'),
      getReference(),
    ]).then(([benchReport, reference]) => {
      setReport(benchReport);
      setRefData(reference);
    }).catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-slate-500">Running benchmarks for comparison...</div>;
  }

  if (error || !report || !refData) {
    return <div className="text-red-500">{error || 'Failed to load data'}</div>;
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Classical vs Post-Quantum</h2>

      <div className="space-y-8">
        {report.comparisons.map((comp) => {
          const classicalResult = report.results.find(
            (r) => r.algorithm === comp.classical && r.operation === 'keygen'
          );
          const pqcResult = refData.results.find(
            (r) => r.algorithm === comp.postQuantum && r.operation === 'keygen'
          );
          const pqcProfile = refData.profiles.find(
            (p) => p.algorithm === comp.postQuantum
          );

          const maxOps = Math.max(
            classicalResult?.opsPerSecond ?? 0,
            pqcResult?.opsPerSecond ?? 0,
          );

          return (
            <div
              key={`${comp.classical}-${comp.postQuantum}`}
              className="p-6 rounded-lg border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111]"
            >
              <h3 className="text-lg font-bold mb-4">
                <span className="text-red-400">{comp.classical}</span>
                {' → '}
                <span className="text-green-400">{comp.postQuantum}</span>
              </h3>

              {classicalResult && pqcResult && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Key Generation Speed</h4>
                  <SpeedBar label={comp.classical} value={classicalResult.opsPerSecond} maxValue={maxOps} color="#f87171" />
                  <SpeedBar label={comp.postQuantum} value={pqcResult.opsPerSecond} maxValue={maxOps} color="#4ade80" />
                </div>
              )}

              {pqcProfile && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Key & Artifact Sizes</h4>
                  <div className="flex gap-2 flex-wrap">
                    <SizeBadge label="Public Key" bytes={pqcProfile.publicKeySize} />
                    <SizeBadge label="Private Key" bytes={pqcProfile.privateKeySize} />
                    {pqcProfile.signatureSize && <SizeBadge label="Signature" bytes={pqcProfile.signatureSize} />}
                    {pqcProfile.ciphertextSize && <SizeBadge label="Ciphertext" bytes={pqcProfile.ciphertextSize} />}
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <p className="text-green-500">{comp.speedup}</p>
                <p className="text-yellow-500">{comp.sizeTradeoff}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{comp.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
