#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { formatSarif } from './reporters/sarif.js';
import { formatCbom } from './reporters/cbom.js';
import { createServer } from './api/server.js';
import { runBenchmarks } from './benchmarks/index.js';
import { formatTerminal as formatBenchTerminal } from './reporters/bench-terminal.js';
import { formatJson as formatBenchJson } from './reporters/bench-json.js';
import { generateMigrationPlan } from './migrate/index.js';
import { formatTerminal as formatMigrateTerminal } from './migrate/reporters/terminal.js';
import { formatMarkdown } from './migrate/reporters/markdown.js';
import { formatJson as formatMigrateJson } from './migrate/reporters/json.js';
import { isGitHubUrl } from './github/scanner.js';
import { runCI } from './ci/index.js';
import { scaffoldWorkflow, getNextSteps } from './ci/init.js';
import { GRADE_ORDER, type Grade } from './ci/exit.js';
import type { BenchmarkCategory } from './types.js';
import type { CIProvider } from './ci/detect.js';
import { writeFileSync } from 'node:fs';

const VALID_CATEGORIES: BenchmarkCategory[] = ['all', 'kex', 'sigs', 'sym', 'hash'];

const program = new Command();

program
  .name('qcrypt-scan')
  .description('Quantum cryptography scanner, benchmarking, and migration toolkit')
  .version('0.2.1')
  .option('--serve', 'start Quantum Sentry web UI')
  .option('--port <number>', 'server port', '3100')
  .option('--open', 'open the dashboard in your default browser when --serve starts');

// Default action: scan
program
  .argument('[path]', 'path or GitHub URL to scan', '.')
  .option('--json', 'output as JSON')
  .option('--sarif', 'output as SARIF 2.1.0')
  .option('--cbom', 'output as CycloneDX 1.6 CBOM')
  .option('--config <path>', 'path to .qcrypt.yml config file')
  .option('--ci', 'run in CI mode with structured output')
  .option('--fail-on <grade>', 'fail if grade is this or worse (A/B/C/D/F)')
  .action(async (
    targetPath: string,
    options: {
      json?: boolean;
      sarif?: boolean;
      cbom?: boolean;
      config?: string;
      serve?: boolean;
      port?: string;
      open?: boolean;
      ci?: boolean;
      failOn?: string;
    },
  ) => {
    if (options.serve) {
      const port = parseInt(options.port ?? '3100', 10);
      const server = createServer();

      try {
        await server.listen({ port, host: '0.0.0.0' });
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EADDRINUSE') {
          console.error('');
          console.error(`  ✗ Port ${port} is already in use.`);
          console.error('');
          console.error('    Try a different port:');
          console.error(`      qcrypt-scan --serve --port ${port + 1}`);
          console.error('');
          console.error('    Or stop whatever is using it:');
          console.error(`      kill $(lsof -tiTCP:${port} -sTCP:LISTEN)`);
          console.error('');
          process.exit(1);
        }
        throw err;
      }

      const url = `http://localhost:${port}`;
      console.log('');
      console.log('  ⬡ Quantum Sentry is live');
      console.log(`  ➜ Local:   ${url}`);
      const nets = Object.values(await import('node:os').then((m) => m.networkInterfaces())).flat().filter((n) => n && n.family === 'IPv4' && !n.internal);
      if (nets.length > 0) {
        console.log(`  ➜ Network: http://${nets[0]!.address}:${port}`);
      }
      console.log('');

      if (options.open) {
        const { spawn } = await import('node:child_process');
        const cmd = process.platform === 'darwin' ? 'open'
                  : process.platform === 'win32' ? 'cmd'
                  : 'xdg-open';
        const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
        try {
          spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
        } catch {
          // Best-effort: if the browser open fails, the URL is still printed above.
        }
      }

      // Keep process alive until interrupted
      process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
      });
      // Block forever — the server event loop handles requests
      await new Promise(() => {});
      return;
    }

    // CI mode
    if (options.ci) {
      if (!options.failOn) {
        console.error('Error: --fail-on is required with --ci');
        process.exit(2);
      }
      const grade = options.failOn.toUpperCase() as Grade;
      if (!GRADE_ORDER.includes(grade)) {
        console.error(`Error: invalid grade "${options.failOn}". Must be one of: ${GRADE_ORDER.join(', ')}`);
        process.exit(2);
      }
      const result = await runCI({ targetPath, failOn: grade, sarifPath: null });
      console.log(JSON.stringify(result.summary, null, 2));
      process.exit(result.exitCode);
      return;
    }

    try {
      const report = await scan(targetPath);

      if (options.sarif) {
        console.log(formatSarif(report));
      } else if (options.cbom) {
        console.log(formatCbom(report));
      } else if (options.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatTerminal(report));
      }

      if (report.summary.critical > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  });

// bench subcommand
program
  .command('bench')
  .description('Benchmark classical crypto and compare with post-quantum alternatives')
  .option('--iterations <n>', 'number of iterations', '1000')
  .option('--category <cat>', 'category: all, kex, sigs, sym, hash', 'all')
  .option('--json', 'output as JSON')
  .action((opts: { iterations: string; category: string; json?: boolean }) => {
    const iterations = parseInt(opts.iterations, 10);
    const category = opts.category as BenchmarkCategory;

    if (!VALID_CATEGORIES.includes(category)) {
      console.error(`Invalid category: ${category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
      process.exit(2);
    }

    const report = runBenchmarks({ iterations, category });

    if (opts.json) {
      console.log(formatBenchJson(report));
    } else {
      console.log(formatBenchTerminal(report));
    }
  });

// migrate subcommand
program
  .command('migrate [path]')
  .description('Generate a post-quantum migration plan')
  .option('--json', 'output as JSON')
  .option('--markdown', 'write migration-plan.md')
  .action(async (targetPath: string = '.', opts: { json?: boolean; markdown?: boolean }) => {
    try {
      const report = await scan(targetPath);
      const plan = generateMigrationPlan(report);

      if (opts.json) {
        console.log(formatMigrateJson(plan));
      } else if (opts.markdown) {
        const md = formatMarkdown(plan);
        writeFileSync('migration-plan.md', md);
        console.log('Written to migration-plan.md');
      } else {
        console.log(formatMigrateTerminal(plan));
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  });

// ci subcommand
const ciCmd = program
  .command('ci')
  .description('CI/CD integration tools');

ciCmd
  .command('init')
  .description('Scaffold a CI workflow for quantum crypto scanning')
  .requiredOption('--provider <provider>', 'CI provider: github, gitlab, generic')
  .option('--force', 'overwrite existing workflow file')
  .action((opts: { provider: string; force?: boolean }) => {
    const provider = opts.provider.toLowerCase() as CIProvider;
    if (!['github', 'gitlab', 'generic'].includes(provider)) {
      console.error(`Error: unknown provider "${opts.provider}". Must be: github, gitlab, generic`);
      process.exit(2);
    }

    const result = scaffoldWorkflow(provider, process.cwd(), opts.force ?? false);
    if (!result.created) {
      console.error(result.error);
      process.exit(1);
    }

    console.log(`Created: ${result.filePath}`);
    console.log();
    console.log(getNextSteps(provider));
  });

ciCmd
  .command('diff')
  .description('Compare two scan results and report new/resolved findings')
  .requiredOption('--pr <path>', 'path to PR scan JSON file')
  .requiredOption('--base <path>', 'path to base scan JSON file')
  .option('--fail-on <level>', 'fail if new findings at this level: critical, warning, any', 'critical')
  .option('--github-comment', 'output as GitHub PR comment markdown')
  .action(async (opts: { pr: string; base: string; failOn: string; githubComment?: boolean }) => {
    const { readFileSync: readFile } = await import('node:fs');
    const { diffScans, shouldFail } = await import('./ci/diff.js');
    const { formatGitHubComment, formatCheckSummary } = await import('./ci/github-comment.js');

    let prReport, baseReport;
    try {
      prReport = JSON.parse(readFile(opts.pr, 'utf-8'));
      baseReport = JSON.parse(readFile(opts.base, 'utf-8'));
    } catch (err) {
      console.error(`Error reading scan files: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }

    const diff = diffScans(baseReport, prReport);

    if (opts.githubComment) {
      console.log(formatGitHubComment(diff));
    } else {
      console.log(JSON.stringify({
        newFindings: diff.newFindings.length,
        resolvedFindings: diff.resolvedFindings.length,
        unchangedCount: diff.unchangedCount,
        gradeChange: diff.gradeChanged ? `${diff.baseGrade} → ${diff.prGrade}` : null,
        summary: formatCheckSummary(diff),
        findings: diff.newFindings,
      }, null, 2));
    }

    const failLevel = opts.failOn as 'critical' | 'warning' | 'any';
    if (!['critical', 'warning', 'any'].includes(failLevel)) {
      console.error(`Invalid --fail-on value: ${opts.failOn}. Must be: critical, warning, any`);
      process.exit(2);
    }

    if (shouldFail(diff, failLevel)) {
      process.exit(1);
    }
  });

program.parseAsync().catch((err) => {
  console.error(err);
  process.exit(2);
});
