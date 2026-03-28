import crypto from 'node:crypto';
import os from 'node:os';
import { getKexKeygenBenchmarks, getSigKeygenBenchmarks } from './benchmarks/keygen.js';
import { getSignVerifyBenchmarks } from './benchmarks/sign-verify.js';
import { getEncryptDecryptBenchmarks } from './benchmarks/encrypt-decrypt.js';
import { getHashBenchmarks } from './benchmarks/hash.js';
import { getPqcReferenceResults, getPqcProfiles } from './reference/pqc-data.js';
import { getComparisons } from './education/comparisons.js';
import type { BenchmarkCategory, BenchmarkReport, BenchmarkResult } from './types.js';

export interface RunOptions {
  iterations: number;
  category: BenchmarkCategory;
}

// Which PQC reference results to include for each category
const PQC_CATEGORY_PREFIXES: Record<BenchmarkCategory, string[]> = {
  all: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
  kex: ['ML-KEM'],
  sigs: ['ML-DSA', 'SLH-DSA'],
  sym: [],
  hash: [],
};

function filterPqcResults(
  allPqc: BenchmarkResult[],
  category: BenchmarkCategory,
): BenchmarkResult[] {
  const prefixes = PQC_CATEGORY_PREFIXES[category];
  if (prefixes.length === 0) return [];
  return allPqc.filter((r) => prefixes.some((p) => r.algorithm.startsWith(p)));
}

export function runBenchmarks(options: RunOptions): BenchmarkReport {
  const { iterations, category } = options;
  const localResults: BenchmarkResult[] = [];

  if (category === 'all' || category === 'kex') {
    localResults.push(...getKexKeygenBenchmarks(iterations));
  }

  if (category === 'all' || category === 'sigs') {
    localResults.push(...getSigKeygenBenchmarks(iterations));
    localResults.push(...getSignVerifyBenchmarks(iterations));
  }

  if (category === 'all' || category === 'sym') {
    localResults.push(...getEncryptDecryptBenchmarks(iterations));
  }

  if (category === 'all' || category === 'hash') {
    localResults.push(...getHashBenchmarks(iterations));
  }

  const pqcResults = filterPqcResults(getPqcReferenceResults(), category);
  const profiles = getPqcProfiles();
  const comparisons = getComparisons();

  const cpus = os.cpus();

  return {
    id: crypto.randomUUID(),
    runAt: new Date().toISOString(),
    platform: {
      os: process.platform,
      arch: process.arch,
      node: process.version,
      cpuModel: cpus.length > 0 ? cpus[0].model : 'unknown',
    },
    iterations,
    results: [...localResults, ...pqcResults],
    profiles,
    comparisons,
  };
}
