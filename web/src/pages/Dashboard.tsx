import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { scanPath, getOverview, getProjects } from '../api';
import type { OverviewStats, ProjectWithLatestScan } from '../api';
import { StatsCard } from '../components/StatsCard';

const LOG_LINES = [
  '> QUANTUM_AUDIT_ENGINE initialized',
  '> Loading NIST PQC reference database...',
  '> FIPS 203 (ML-KEM) patterns loaded',
  '> FIPS 204 (ML-DSA) patterns loaded',
  '> FIPS 205 (SLH-DSA) patterns loaded',
  '> Shor vulnerability scanner: ACTIVE',
  '> Grover vulnerability scanner: ACTIVE',
  '> HNDL threat model: ENABLED',
  '> Compliance frameworks: CNSA 2.0, FIPS 140-3, PCI DSS 4.0',
  '> System ready. Awaiting target designation.',
];

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-primary-container text-on-primary',
  B: 'bg-secondary text-on-primary',
  C: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  D: 'bg-error/80 text-on-error',
  F: 'bg-error text-on-error',
};

export function Dashboard() {
  const navigate = useNavigate();
  const [path, setPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [projects, setProjects] = useState<ProjectWithLatestScan[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    getOverview().then(setOverview).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load overview'));
    getProjects().then(setProjects).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'));
  }, []);

  // Animate log lines
  useEffect(() => {
    let idx = 0;
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      const line = LOG_LINES[idx];
      if (line !== undefined) {
        setLogLines((prev) => [...prev, line]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 300);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleScan = useCallback(async () => {
    if (!path.trim()) return;
    setScanning(true);
    setError('');
    setLogLines((prev) => [...prev, `> Initiating scan: ${path.trim()}`]);
    try {
      const res = await scanPath(path.trim());
      setLogLines((prev) => [...prev, '> Scan complete. Rendering results...']);
      navigate(`/scans/${res.scan.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setError(msg);
      setLogLines((prev) => [...prev, `> ERROR: ${msg}`]);
    } finally {
      setScanning(false);
    }
  }, [path, navigate]);

  const threatLevel = overview
    ? Math.min(100, Math.round((overview.totalCritical / Math.max(overview.totalScans, 1)) * 100))
    : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero */}
      <div>
        <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mb-2">
          POST-QUANTUM CRYPTOGRAPHIC AUDIT
        </p>
        <h1 className="font-headline text-4xl font-bold text-primary uppercase tracking-tight">
          INITIATE QUANTUM AUDIT
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-xl">
          Scan any repository for quantum-vulnerable cryptographic primitives. Get remediation plans aligned with NIST PQC standards.
        </p>
      </div>

      {/* Scan Input */}
      <div className="bg-surface-container-low p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="https://github.com/org/repo"
            disabled={scanning}
            className="flex-1 px-4 py-3 bg-surface-container-lowest text-primary font-mono text-sm placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container/50 border-none"
          />
          <button
            onClick={handleScan}
            disabled={scanning || !path.trim()}
            className="btn-neon px-8 py-3 text-xs whitespace-nowrap"
          >
            {scanning ? 'SCANNING...' : 'RUN_ANALYSIS'}
          </button>
        </div>
        {error && (
          <p className="mt-3 font-mono text-xs text-error">{error}</p>
        )}
        <p className="mt-2 font-mono text-[10px] text-on-surface-variant/60 tracking-wider">
          PASTE ANY PUBLIC GITHUB REPO URL
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-surface-container-high">
        <StatsCard
          label="Global Threat Level"
          value={`${threatLevel}%`}
          accentColor={threatLevel > 50 ? 'error' : threatLevel > 20 ? 'warning' : 'neon'}
          subtitle="Avg critical findings per scan"
        />
        <StatsCard
          label="Total Scans"
          value={overview?.totalScans ?? 0}
          accentColor="neon"
          subtitle="Scans executed"
        />
        <StatsCard
          label="Projects Monitored"
          value={overview?.totalProjects ?? 0}
          accentColor="default"
          subtitle="Ecosystem coverage"
        />
      </div>

      {/* Recent Intelligence */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase">
              RECENT_INTELLIGENCE
            </h2>
            <Link to="/projects" className="font-mono text-xs text-primary-container hover:text-primary-fixed transition-colors">
              VIEW ALL &gt;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-container-high">
            {projects.slice(0, 6).map((proj) => (
              <Link
                key={proj.id}
                to={`/projects/${proj.id}`}
                className="bg-surface-container-low p-4 hover:bg-surface-container transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-primary truncate group-hover:text-primary-container transition-colors">
                      {proj.name}
                    </p>
                    <p className="font-mono text-[10px] text-on-surface-variant/60 mt-0.5 truncate">
                      {proj.path}
                    </p>
                  </div>
                  {proj.latestScan && (
                    <span className={`font-mono text-xs font-bold px-2 py-1 ${GRADE_COLORS[proj.latestScan.grade] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                      {proj.latestScan.grade}
                    </span>
                  )}
                </div>
                {proj.latestScan && (
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    {proj.latestScan.summary.critical > 0 && (
                      <span className="text-error">{proj.latestScan.summary.critical} CRIT</span>
                    )}
                    {proj.latestScan.summary.warning > 0 && (
                      <span className="text-tertiary-fixed-dim">{proj.latestScan.summary.warning} WARN</span>
                    )}
                    <span className="text-on-surface-variant/50">
                      {new Date(proj.latestScan.scannedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Live Forensic Feed */}
      <div>
        <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-3">
          LIVE_FORENSIC_FEED
        </h2>
        <div className="terminal-log p-4 h-48 overflow-y-auto">
          {logLines.map((line, i) => {
            const text = line ?? '';
            return (
              <div key={i} className={`${text.includes('ERROR') ? 'text-error' : text.includes('ACTIVE') || text.includes('ENABLED') ? 'text-primary-container' : ''}`}>
                {text}
              </div>
            );
          })}
          {scanning && (
            <div className="text-primary-container animate-pulse">&gt; Processing...</div>
          )}
          <div className="text-primary-container">_</div>
        </div>
      </div>
    </div>
  );
}
