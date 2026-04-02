#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { formatSarif } from './reporters/sarif.js';
import { formatCbom } from './reporters/cbom.js';
import { createServer } from './api/server.js';

const program = new Command();

program
  .name('qcrypt-scan')
  .description('Scan codebases for quantum-vulnerable cryptography')
  .version('0.2.0');

program
  .argument('[path]', 'path to scan', '.')
  .option('--json', 'output as JSON')
  .option('--sarif', 'output as SARIF 2.1.0 (for GitHub Security)')
  .option('--cbom', 'output as CycloneDX 1.6 CBOM')
  .option('--config <path>', 'path to .qcrypt.yml config file')
  .option('--serve', 'start API server')
  .option('--port <number>', 'API server port', '3100')
  .action(async (
    targetPath: string,
    options: {
      json?: boolean;
      sarif?: boolean;
      cbom?: boolean;
      config?: string;
      serve?: boolean;
      port?: string;
    },
  ) => {
    if (options.serve) {
      const port = parseInt(options.port ?? '3100', 10);
      const server = createServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`qcrypt-scan API server running on http://localhost:${port}`);
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

program.parse();
