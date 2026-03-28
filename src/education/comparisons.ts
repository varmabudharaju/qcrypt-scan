import type { Comparison } from '../types.js';

const COMPARISONS: Comparison[] = [
  {
    classical: 'RSA-2048',
    postQuantum: 'ML-KEM-768',
    speedup: 'ML-KEM-768 is ~1000x faster at key generation than RSA-2048',
    sizeTradeoff: 'Public keys are 4x larger (1184B vs 294B), but ciphertext is smaller (1088B vs 256B)',
    explanation:
      'RSA key generation requires finding two large primes and is computationally expensive. ' +
      'ML-KEM (formerly Kyber) uses structured lattice problems — key generation is just matrix arithmetic, ' +
      'making it dramatically faster. The tradeoff is larger keys, but the speed difference is so vast that ' +
      'ML-KEM is practical even with the size increase. RSA is broken by Shor\'s algorithm on a quantum computer; ' +
      'ML-KEM is believed resistant to both classical and quantum attacks.',
  },
  {
    classical: 'ECDSA-P256',
    postQuantum: 'ML-DSA-65',
    speedup: 'ML-DSA-65 signs ~2x slower but verifies ~2x faster than ECDSA-P256',
    sizeTradeoff: 'Signatures are ~50x larger (3293B vs 64B) and public keys are ~30x larger (1952B vs 65B)',
    explanation:
      'ECDSA relies on the elliptic curve discrete logarithm problem, which Shor\'s algorithm breaks efficiently. ' +
      'ML-DSA (formerly Dilithium) uses lattice-based math for signatures. Signing is slightly slower because of ' +
      'rejection sampling (the algorithm may retry internally), but verification is faster — a useful property since ' +
      'signatures are verified far more often than they are created. The big tradeoff is size: ML-DSA signatures ' +
      'and keys are much larger, which matters for bandwidth-constrained protocols like TLS.',
  },
  {
    classical: 'ECDH-P256',
    postQuantum: 'ML-KEM-768',
    speedup: 'ML-KEM-768 encapsulation is comparable in speed to ECDH key agreement',
    sizeTradeoff: 'Public keys are ~18x larger (1184B vs 65B), ciphertext is 1088B vs ~65B for ECDH shared point',
    explanation:
      'ECDH derives a shared secret from two parties\' public keys using elliptic curve math. ' +
      'ML-KEM replaces this with a Key Encapsulation Mechanism: one party generates a shared secret and ' +
      '"encapsulates" it using the other\'s public key. The operational speed is similar, but the protocol ' +
      'flow changes from interactive key agreement to encapsulate/decapsulate. Keys and ciphertexts are larger, ' +
      'which adds bandwidth cost in TLS handshakes.',
  },
  {
    classical: 'Ed25519',
    postQuantum: 'ML-DSA-44',
    speedup: 'ML-DSA-44 is ~3-5x slower to sign and ~2x slower to verify than Ed25519',
    sizeTradeoff: 'Signatures are ~38x larger (2420B vs 64B) and public keys are ~41x larger (1312B vs 32B)',
    explanation:
      'Ed25519 is one of the fastest classical signature schemes, using the Edwards curve over a prime field. ' +
      'ML-DSA-44 is the smallest/fastest ML-DSA variant, targeting NIST Level 2 security. ' +
      'The speed gap is noticeable — Ed25519 is highly optimized for speed and compactness. The size difference ' +
      'is dramatic and matters most for applications that embed signatures in small payloads (JWTs, blockchain transactions). ' +
      'However, Ed25519 is completely broken by quantum computers, while ML-DSA-44 is not.',
  },
  {
    classical: 'RSA-2048',
    postQuantum: 'SLH-DSA-128s',
    speedup: 'SLH-DSA-128s is ~10x slower to sign than RSA-2048, but keygen is comparable',
    sizeTradeoff: 'Signatures are enormous (7856B vs 256B) but keys are tiny (32B pk vs 294B)',
    explanation:
      'SLH-DSA (formerly SPHINCS+) is the conservative choice — it relies only on hash function security, ' +
      'making it the simplest assumption in post-quantum crypto. Unlike lattice-based schemes, there is no ' +
      'concern about future lattice-breaking advances. The cost is speed: signing is slow because it builds ' +
      'a hash tree for each signature. Verification is moderate. The unique advantage is tiny keys (just hash seeds) ' +
      'but the signatures themselves are very large. Best suited for applications where signing is infrequent ' +
      'but long-term security assurance is critical (firmware updates, code signing, certificates).',
  },
];

export function getComparisons(): Comparison[] {
  return COMPARISONS;
}
