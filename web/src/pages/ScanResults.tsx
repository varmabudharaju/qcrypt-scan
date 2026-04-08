import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScan } from '../api';
import type { ScanReport, MigrationPlan, ScanDetail, QuantumThreat } from '../api';
// Grade badge colors
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-primary-container text-on-primary',
  B: 'bg-secondary text-on-primary',
  C: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  D: 'bg-error/80 text-on-error',
  F: 'bg-error text-on-error',
};
import { FindingCard } from '../components/FindingCard';
import { StatsCard } from '../components/StatsCard';

export function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function poll() {
      try {
        const data: ScanDetail = await getScan(id!);
        if (cancelled) return;
        if (data.status === 'scanning') {
          setScanning(true);
          setTimeout(poll, 3000);
          return;
        }
        if (data.status === 'failed') {
          setError(data.error || 'Scan failed');
          setScanning(false);
          return;
        }
        setScanning(false);
        setReport(data.report);
        if (data.plan) setPlan(data.plan);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scan');
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="font-mono text-error text-sm">{error}</p>
        <Link to="/" className="font-mono text-xs text-primary-container hover:text-primary-fixed">
          &lt; RETURN TO DASHBOARD
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-on-surface-variant tracking-wider">
          {scanning ? 'SCANNING REPOSITORY... THIS MAY TAKE A FEW MINUTES' : 'LOADING SCAN DATA...'}
        </p>
        {scanning && (
          <p className="font-mono text-[10px] text-on-surface-variant/50 tracking-wider">
            ANALYZING CRYPTOGRAPHIC PRIMITIVES // CHECKING QUANTUM VULNERABILITY
          </p>
        )}
      </div>
    );
  }

  const pathName = report.path.split('/').pop() || report.path;
  const filteredFindings = filter === 'all'
    ? report.findings
    : report.findings.filter((f) => f.risk === filter);

  const totalFindings = report.findings.length;
  const threatScore = totalFindings > 0
    ? Math.round(((report.summary.critical * 3 + report.summary.warning) / (totalFindings * 3)) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back link */}
      <Link to="/" className="font-mono text-xs text-primary-container hover:text-primary-fixed inline-flex items-center gap-1 transition-colors">
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        DASHBOARD
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-primary uppercase">{pathName}</h1>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-primary-container/15 text-primary-container tracking-wider">
              STATUS: ANALYSIS COMPLETE
            </span>
          </div>
          <p className="font-mono text-xs text-on-surface-variant">{report.path}</p>
          <p className="font-mono text-[10px] text-on-surface-variant/50 mt-0.5">
            {report.filesScanned} files scanned // {new Date(report.scannedAt).toLocaleString()}
          </p>
        </div>
        <span className={`font-mono text-4xl font-black px-5 py-3 ${GRADE_COLORS[report.grade] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
          {report.grade}
        </span>
      </div>

      {/* Threat Level + Stats */}
      <div className="grid grid-cols-5 gap-px bg-surface-container-high">
        <div className="bg-surface-container-low p-5 col-span-2">
          <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">THREAT LEVEL</p>
          <p className={`stat-value text-5xl ${threatScore > 50 ? 'text-error' : threatScore > 20 ? 'text-tertiary-fixed-dim' : 'text-primary-container text-glow'}`}>
            {threatScore}
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant mt-1">/ 100 QUANTUM RISK INDEX</p>
        </div>
        <StatsCard label="Critical" value={report.summary.critical} accentColor={report.summary.critical > 0 ? 'error' : 'default'} />
        <StatsCard label="Warning" value={report.summary.warning} accentColor={report.summary.warning > 0 ? 'warning' : 'default'} />
        <StatsCard label="Info / OK" value={`${report.summary.info} / ${report.summary.ok}`} accentColor="neon" />
      </div>

      {/* Language Coverage Warning */}
      {(() => {
        const lc = report.languageCoverage;
        if (!lc) return null;
        const total = lc.scanned + lc.skipped;
        const pct = total > 0 ? Math.round((lc.skipped / total) * 100) : 0;
        if (pct <= 30) return null;
        return (
          <div className="bg-tertiary-fixed-dim/10 border border-tertiary-fixed-dim/30 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px] mt-0.5">warning</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-tertiary-fixed-dim mb-1">
                LANGUAGE COVERAGE WARNING &mdash; {pct}% FILES UNSUPPORTED
              </p>
              <p className="font-mono text-xs text-on-surface-variant">
                {lc.scanned} files scanned, {lc.skipped} skipped.
                {lc.unsupportedExtensions.length > 0 && (
                  <> Unsupported: {lc.unsupportedExtensions.map((e) => `${e.ext} (${e.count})`).join(', ')}</>
                )}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Quantum Threat Analysis */}
      {report.quantumSummary && report.quantumSummary.threats.length > 0 && (
        <div className="bg-surface-container-low p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">
            QUANTUM THREAT ANALYSIS
          </p>

          {/* Weakest link */}
          {report.quantumSummary.weakestLink && (
            <div className="bg-error-container/10 border border-error/30 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-error mb-2">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">crisis_alert</span>
                WEAKEST LINK: {report.quantumSummary.weakestLink.algorithm}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant/60 uppercase tracking-wider">CLASSICAL</p>
                  <p className="font-mono text-sm text-on-surface-variant">{report.quantumSummary.weakestLink.classicalBreakTime}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant/60 uppercase tracking-wider">QUANTUM</p>
                  <p className="font-mono text-sm text-error">{report.quantumSummary.weakestLink.quantumBreakTime}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant/60 uppercase tracking-wider">ATTACK</p>
                  <p className="font-mono text-sm text-on-surface-variant">{report.quantumSummary.weakestLink.quantumAlgorithm}</p>
                </div>
              </div>
            </div>
          )}

          {/* Threat list */}
          <div className="space-y-1">
            {report.quantumSummary.threats.map((t: QuantumThreat, i: number) => {
              const color =
                t.threatLevel === 'broken-quantum' ? 'text-error' :
                t.threatLevel === 'weakened' ? 'text-tertiary-fixed-dim' :
                'text-primary-container';
              const dot =
                t.threatLevel === 'broken-quantum' ? 'bg-error' :
                t.threatLevel === 'weakened' ? 'bg-tertiary-fixed-dim' :
                'bg-primary-container';
              return (
                <div key={`${t.algorithm}-${i}`} className="flex items-center gap-3 px-3 py-2 bg-surface-container-lowest">
                  <span className={`w-2 h-2 flex-shrink-0 ${dot}`} />
                  <span className={`font-mono text-xs font-semibold flex-1 ${color}`}>{t.algorithm}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">{t.quantumBreakTime}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${color}`}>{t.threatLevel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NIST Compliance Deadline */}
      {(() => {
        // Compute deadlines from findings client-side using known dates
        const NIST_DATES: Record<string, { prohibited: number; label: string }> = {
          'RSA': { prohibited: 2035, label: 'RSA' },
          'ECDSA': { prohibited: 2035, label: 'ECDSA' },
          'ECDH': { prohibited: 2035, label: 'ECDH' },
          'Ed25519': { prohibited: 2035, label: 'Ed25519' },
          'DSA': { prohibited: 2023, label: 'DSA' },
          'DH': { prohibited: 2035, label: 'DH' },
          'SHA-1': { prohibited: 2030, label: 'SHA-1' },
          'MD5': { prohibited: 2010, label: 'MD5' },
          'DES': { prohibited: 2005, label: 'DES' },
          '3DES': { prohibited: 2023, label: '3DES' },
          'RC4': { prohibited: 2015, label: 'RC4' },
        };
        const now = new Date().getFullYear();
        const deadlines = Object.entries(NIST_DATES)
          .filter(([algo]) => report.findings.some((f) => f.algorithm.startsWith(algo) && f.risk !== 'OK'))
          .map(([algo, d]) => ({
            algo,
            label: d.label,
            prohibited: d.prohibited,
            remaining: d.prohibited - now,
            count: report.findings.filter((f) => f.algorithm.startsWith(algo) && f.risk !== 'OK').length,
          }))
          .filter((d) => d.remaining <= 5)
          .sort((a, b) => a.remaining - b.remaining);

        if (deadlines.length === 0) return null;

        return (
          <div className="bg-surface-container-low p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container mb-3">
              NIST COMPLIANCE DEADLINE
            </p>
            <div className="space-y-2">
              {deadlines.map((d) => (
                <div key={d.algo} className="flex items-center gap-3 px-3 py-2 bg-surface-container-lowest">
                  <span className={`material-symbols-outlined text-[16px] ${d.remaining <= 0 ? 'text-error' : d.remaining <= 3 ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>
                    {d.remaining <= 0 ? 'error' : 'schedule'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-primary flex-1">{d.label}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">
                    prohibited {d.prohibited}
                  </span>
                  <span className={`font-mono text-[10px] font-bold tracking-wider ${d.remaining <= 0 ? 'text-error' : d.remaining <= 3 ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant'}`}>
                    {d.remaining <= 0 ? 'OVERDUE' : `${d.remaining}y remaining`}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant/40">
                    {d.count} finding{d.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant/40 mt-2">
              Source: NIST IR 8547 (draft), FIPS 186-5
            </p>
          </div>
        );
      })()}

      {/* Usage Breakdown */}
      {report.usageBreakdown && (
        <div className="bg-surface-container-low p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container mb-3">
            USAGE BREAKDOWN
          </p>
          <div className="flex flex-wrap gap-2">
            {report.usageBreakdown.operations > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error-container/30 font-mono text-[10px] font-bold tracking-wider text-error uppercase">
                <span className="w-1.5 h-1.5 bg-error" />
                OPERATIONS {report.usageBreakdown.operations}
              </span>
            )}
            {report.usageBreakdown.keyMaterial > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error-container/30 font-mono text-[10px] font-bold tracking-wider text-error uppercase">
                <span className="w-1.5 h-1.5 bg-error" />
                KEY-MATERIAL {report.usageBreakdown.keyMaterial}
              </span>
            )}
            {report.usageBreakdown.config > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-tertiary-fixed-dim/15 font-mono text-[10px] font-bold tracking-wider text-tertiary-fixed-dim uppercase">
                <span className="w-1.5 h-1.5 bg-tertiary-fixed-dim" />
                CONFIG {report.usageBreakdown.config}
              </span>
            )}
            {report.usageBreakdown.imports > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high font-mono text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/50" />
                IMPORTS {report.usageBreakdown.imports}
              </span>
            )}
            {report.usageBreakdown.references > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container font-mono text-[10px] font-bold tracking-wider text-on-surface-variant/60 uppercase">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/30" />
                REFERENCES {report.usageBreakdown.references}
              </span>
            )}
            {report.usageBreakdown.comments > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container font-mono text-[10px] tracking-wider text-on-surface-variant/40 uppercase italic">
                <span className="w-1.5 h-1.5 bg-on-surface-variant/20" />
                COMMENTS {report.usageBreakdown.comments}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {['all', 'CRITICAL', 'WARNING', 'INFO', 'OK'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider transition-all ${
              filter === f
                ? 'bg-primary-container text-on-primary shadow-neon-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f === 'all' ? `ALL (${totalFindings})` : f}
          </button>
        ))}
      </div>

      {/* Findings */}
      <div className="space-y-1">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">search_off</span>
            <p className="font-mono text-xs text-on-surface-variant mt-2">No findings matching this filter</p>
          </div>
        ) : (
          filteredFindings.map((finding, i) => (
            <FindingCard key={`${finding.file}-${finding.line}-${i}`} finding={finding} />
          ))
        )}
      </div>

      {/* Remediation Plan */}
      {plan && plan.steps.length > 0 && (
        <div className="bg-surface-container-low p-6">
          <h3 className="font-mono text-xs tracking-[0.2em] text-primary-container mb-4 uppercase">
            POST-QUANTUM REMEDIATION PLAN
          </h3>
          <div className="space-y-3">
            {plan.steps.slice(0, 5).map((step, i) => (
              <div key={i} className="flex gap-4 p-3 bg-surface-container-lowest">
                <div className="flex-shrink-0">
                  <span className={`font-mono text-[10px] px-2 py-0.5 ${
                    step.priority === 'immediate' ? 'bg-error-container/40 text-error' :
                    step.priority === 'short-term' ? 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim' :
                    'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {step.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-primary">
                    {step.finding.algorithm} &rarr; <span className="text-primary-container">{step.finding.replacement}</span>
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">
                    {step.finding.file}:{step.finding.line}
                  </p>
                  {step.codeExample && (
                    <code className="block font-mono text-[10px] text-primary-container mt-1 p-2 bg-surface">
                      {step.codeExample}
                    </code>
                  )}
                </div>
                <span className={`font-mono text-[10px] self-start ${
                  step.effort === 'high' ? 'text-error' :
                  step.effort === 'medium' ? 'text-tertiary-fixed-dim' :
                  'text-primary-container'
                }`}>
                  {step.effort.toUpperCase()} EFFORT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/reports/${id}/html`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-neon px-6 py-2.5 text-xs inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          EXPORT REPORT
        </a>
        <Link
          to={`/migration?path=${encodeURIComponent(report.path)}`}
          className="px-6 py-2.5 font-mono text-xs font-bold text-primary-container bg-surface-container hover:bg-surface-container-high transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">conversion_path</span>
          MIGRATION PLAN
        </Link>
        <Link
          to={`/compliance?scanId=${id}`}
          className="px-6 py-2.5 font-mono text-xs font-bold text-primary-container bg-surface-container hover:bg-surface-container-high transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          COMPLIANCE
        </Link>
      </div>
    </div>
  );
}
