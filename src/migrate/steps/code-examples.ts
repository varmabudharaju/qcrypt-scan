import { detectLanguage } from './dependencies.js';

export interface CodeExample {
  before: string;
  after: string;
  package: string;
}

export function normalizeAlgorithm(algorithm: string): string {
  const lower = algorithm.toLowerCase();
  if (lower.startsWith('rsa')) return 'rsa';
  if (lower.includes('ecdsa') || lower.includes('ed25519') || lower.includes('eddsa')) return 'ecdsa';
  if (lower.includes('ecdh') || lower.includes('x25519')) return 'ecdh';
  if (lower === 'dsa') return 'dsa';
  if (lower === 'dh' || lower.startsWith('diffie')) return 'dh';
  if (lower === 'md5') return 'md5';
  if (lower.startsWith('sha-1') || lower === 'sha1') return 'sha1';
  if (lower.includes('aes-128') || lower.includes('aes128')) return 'aes128';
  if (lower.includes('aes-192') || lower.includes('aes192')) return 'aes192';
  if (lower.includes('des') || lower === '3des' || lower === 'rc4') return 'des';
  if (lower.includes('p-256') || lower.includes('p-384') || lower.includes('secp256') || lower.includes('secp384')) return 'ecdsa';
  return lower;
}

const CODE_EXAMPLES: Record<string, CodeExample> = {
  // ── JavaScript / TypeScript ──
  'rsa:javascript': {
    before: "crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })",
    after: "import { ml_kem768 } from '@noble/post-quantum/ml-kem';\nconst { publicKey, secretKey } = ml_kem768.keygen();",
    package: '@noble/post-quantum',
  },
  'ecdsa:javascript': {
    before: "crypto.sign('sha256', data, ecPrivateKey)",
    after: "import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';\nconst sig = ml_dsa65.sign(secretKey, data);",
    package: '@noble/post-quantum',
  },
  'md5:javascript': {
    before: "crypto.createHash('md5').update(data).digest()",
    after: "crypto.createHash('sha3-256').update(data).digest()",
    package: '(built-in)',
  },
  'aes128:javascript': {
    before: "crypto.createCipheriv('aes-128-gcm', key16, iv)",
    after: "crypto.createCipheriv('aes-256-gcm', key32, iv)",
    package: '(built-in)',
  },
  'ecdh:javascript': {
    before: "crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })",
    after: "import { ml_kem768 } from '@noble/post-quantum/ml-kem';\nconst { publicKey, secretKey } = ml_kem768.keygen();",
    package: '@noble/post-quantum',
  },
  // ── Python ──
  'rsa:python': {
    before: 'rsa.generate_private_key(public_exponent=65537, key_size=2048)',
    after: "from oqs import KeyEncapsulation\nkem = KeyEncapsulation('ML-KEM-768')\npk, sk = kem.generate_keypair()",
    package: 'oqs',
  },
  'ecdsa:python': {
    before: 'ec.generate_private_key(SECP256R1())',
    after: "from oqs import Signature\nsig = Signature('ML-DSA-65')\npk, sk = sig.generate_keypair()",
    package: 'oqs',
  },
  'md5:python': {
    before: 'hashlib.md5(data)',
    after: 'hashlib.sha3_256(data)',
    package: '(built-in)',
  },
  'aes128:python': {
    before: 'AES.new(key, AES.MODE_GCM)  # 16-byte key',
    after: 'AES.new(key, AES.MODE_GCM)  # 32-byte key',
    package: '(same package)',
  },
  // ── Go ──
  'rsa:go': {
    before: 'rsa.GenerateKey(rand.Reader, 2048)',
    after: 'import "github.com/cloudflare/circl/kem/mlkem/mlkem768"',
    package: 'github.com/cloudflare/circl',
  },
  'ecdsa:go': {
    before: 'ecdsa.GenerateKey(elliptic.P256(), rand.Reader)',
    after: 'import "github.com/cloudflare/circl/sign/mldsa/mldsa65"',
    package: 'github.com/cloudflare/circl',
  },
  'md5:go': {
    before: 'md5.Sum(data)',
    after: 'sha3.Sum256(data)',
    package: 'golang.org/x/crypto/sha3',
  },
  // ── Rust ──
  'rsa:rust': {
    before: 'rsa::RsaPrivateKey::new(&mut rng, 2048)',
    after: 'use pqcrypto_mlkem::mlkem768::*;\nlet (pk, sk) = keypair();',
    package: 'pqcrypto',
  },
  'ecdsa:rust': {
    before: 'ecdsa::SigningKey::random(&mut rng)',
    after: 'use pqcrypto_mldsa::mldsa65::*;\nlet (pk, sk) = keypair();',
    package: 'pqcrypto',
  },
  // ── Java / Kotlin ──
  'rsa:java': {
    before: 'KeyPairGenerator.getInstance("RSA")',
    after: 'KeyPairGenerator.getInstance("ML-KEM", "BCPQC")',
    package: 'bcpqc (Bouncy Castle)',
  },
  'ecdsa:java': {
    before: 'KeyPairGenerator.getInstance("EC")',
    after: 'KeyPairGenerator.getInstance("ML-DSA", "BCPQC")',
    package: 'bcpqc (Bouncy Castle)',
  },
  'md5:java': {
    before: 'MessageDigest.getInstance("MD5")',
    after: 'MessageDigest.getInstance("SHA3-256")',
    package: '(built-in)',
  },
};

const LANG_FALLBACKS: Record<string, string> = {
  typescript: 'javascript',
  kotlin: 'java',
};

const ALGO_FALLBACKS: Record<string, string> = {
  dsa: 'ecdsa',
  dh: 'ecdh',
  sha1: 'md5',
  des: 'aes128',
  rc4: 'aes128',
  aes192: 'aes128',
};

export function getCodeExample(algorithm: string, filePath: string): CodeExample | null {
  const algo = normalizeAlgorithm(algorithm);
  const lang = detectLanguage(filePath);

  const algos = [algo];
  if (ALGO_FALLBACKS[algo]) algos.push(ALGO_FALLBACKS[algo]);

  const langs = [lang];
  if (LANG_FALLBACKS[lang]) langs.push(LANG_FALLBACKS[lang]);

  for (const a of algos) {
    for (const l of langs) {
      const key = `${a}:${l}`;
      if (CODE_EXAMPLES[key]) return CODE_EXAMPLES[key];
    }
  }

  return null;
}

export function formatCodeExample(example: CodeExample): string {
  return `// Before:\n${example.before}\n\n// After:\n${example.after}`;
}

export const GENERIC_GUIDANCE =
  'No language-specific code example available.\nSee NIST FIPS 203/204/205 for PQC standards.\nConsider hybrid approaches during transition.';
