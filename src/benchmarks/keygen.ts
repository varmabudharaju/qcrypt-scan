import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

// Key exchange algorithms — keygen only
export function getKexKeygenBenchmarks(iterations: number): BenchmarkResult[] {
  return runKeygenSuite(iterations, [
    { algorithm: 'RSA-2048', fn: () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }) },
    { algorithm: 'RSA-4096', fn: () => crypto.generateKeyPairSync('rsa', { modulusLength: 4096 }) },
    { algorithm: 'ECDH-P256', fn: () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }) },
    { algorithm: 'X25519', fn: () => crypto.generateKeyPairSync('x25519') },
  ]);
}

// Signature algorithms — keygen only (sign/verify in sign-verify.ts)
export function getSigKeygenBenchmarks(iterations: number): BenchmarkResult[] {
  return runKeygenSuite(iterations, [
    { algorithm: 'RSA-2048', fn: () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }) },
    { algorithm: 'ECDSA-P256', fn: () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }) },
    { algorithm: 'Ed25519', fn: () => crypto.generateKeyPairSync('ed25519') },
  ]);
}

function runKeygenSuite(
  iterations: number,
  algos: Array<{ algorithm: string; fn: () => void }>,
): BenchmarkResult[] {
  return algos.map(({ algorithm, fn }) => {
    const timing = benchmark(fn, iterations);
    return {
      algorithm,
      operation: 'keygen' as const,
      ...timing,
      iterations,
      isReference: false,
      quantumSafe: false,
    };
  });
}
