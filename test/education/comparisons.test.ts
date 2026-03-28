import { describe, it, expect } from 'vitest';
import { getComparisons } from '../src/education/comparisons.js';
import type { Comparison } from '../src/types.js';

describe('educational comparisons', () => {
  it('returns all 5 comparison pairs', () => {
    const comparisons = getComparisons();
    expect(comparisons).toHaveLength(5);
  });

  it('includes RSA-2048 → ML-KEM-768', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'RSA-2048' && c.postQuantum === 'ML-KEM-768'
    );
    expect(match).toBeDefined();
    expect(match!.speedup).toBeTruthy();
    expect(match!.sizeTradeoff).toBeTruthy();
    expect(match!.explanation).toBeTruthy();
  });

  it('includes ECDSA-P256 → ML-DSA-65', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'ECDSA-P256' && c.postQuantum === 'ML-DSA-65'
    );
    expect(match).toBeDefined();
  });

  it('includes ECDH-P256 → ML-KEM-768', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'ECDH-P256' && c.postQuantum === 'ML-KEM-768'
    );
    expect(match).toBeDefined();
  });

  it('includes Ed25519 → ML-DSA-44', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'Ed25519' && c.postQuantum === 'ML-DSA-44'
    );
    expect(match).toBeDefined();
  });

  it('includes RSA-2048 → SLH-DSA-128s', () => {
    const comparisons = getComparisons();
    const match = comparisons.find(
      (c) => c.classical === 'RSA-2048' && c.postQuantum === 'SLH-DSA-128s'
    );
    expect(match).toBeDefined();
  });

  it('all comparisons have non-empty explanations', () => {
    const comparisons = getComparisons();
    for (const c of comparisons) {
      expect(c.explanation.length).toBeGreaterThan(50);
    }
  });
});
