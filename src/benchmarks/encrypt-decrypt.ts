import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.alloc(1024, 'a');

function aesSuite(
  algorithm: string,
  cipherName: string,
  keyLength: number,
  iterations: number,
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const key = crypto.randomBytes(keyLength);

  const encryptTiming = benchmark(() => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(cipherName, key, iv, { authTagLength: 16 });
    cipher.update(TEST_DATA);
    cipher.final();
    cipher.getAuthTag();
  }, iterations);
  results.push({
    algorithm, operation: 'encrypt', ...encryptTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  // Prepare a ciphertext for decryption benchmarking
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(cipherName, key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(TEST_DATA), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const decryptTiming = benchmark(() => {
    const decipher = crypto.createDecipheriv(cipherName, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    decipher.update(encrypted);
    decipher.final();
  }, iterations);
  results.push({
    algorithm, operation: 'decrypt', ...decryptTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  return results;
}

export function getEncryptDecryptBenchmarks(iterations: number): BenchmarkResult[] {
  return [
    ...aesSuite('AES-128-GCM', 'aes-128-gcm', 16, iterations),
    ...aesSuite('AES-256-GCM', 'aes-256-gcm', 32, iterations),
  ];
}
