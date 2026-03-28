import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

export function getKeygenBenchmarks(iterations: number): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // RSA-2048
  const rsa2048 = benchmark(() => {
    crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  }, iterations);
  results.push({
    algorithm: 'RSA-2048',
    operation: 'keygen',
    ...rsa2048,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // RSA-4096
  const rsa4096 = benchmark(() => {
    crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
  }, iterations);
  results.push({
    algorithm: 'RSA-4096',
    operation: 'keygen',
    ...rsa4096,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // ECDH-P256
  const ecdhP256 = benchmark(() => {
    crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  }, iterations);
  results.push({
    algorithm: 'ECDH-P256',
    operation: 'keygen',
    ...ecdhP256,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // X25519
  const x25519 = benchmark(() => {
    crypto.generateKeyPairSync('x25519');
  }, iterations);
  results.push({
    algorithm: 'X25519',
    operation: 'keygen',
    ...x25519,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // ECDSA-P256 (keygen only — sign/verify in sign-verify.ts)
  const ecdsaP256 = benchmark(() => {
    crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  }, iterations);
  results.push({
    algorithm: 'ECDSA-P256',
    operation: 'keygen',
    ...ecdsaP256,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  // Ed25519 (keygen only — sign/verify in sign-verify.ts)
  const ed25519 = benchmark(() => {
    crypto.generateKeyPairSync('ed25519');
  }, iterations);
  results.push({
    algorithm: 'Ed25519',
    operation: 'keygen',
    ...ed25519,
    iterations,
    isReference: false,
    quantumSafe: false,
  });

  return results;
}
