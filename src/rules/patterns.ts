import type { LanguagePatterns, PatternMatch } from '../types.js';

const pythonPatterns: LanguagePatterns = {
  extensions: ['.py'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa\b.*(?:generate|private|public|key|sign|encrypt)/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'ECDSA', regex: /\bec\.(?:generate_private_key|SECP|ECDSA)\b/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b/i },
    { algorithm: 'DSA', regex: /\bdsa\.(?:generate_private_key|DSAPrivateKey)\b/i },
    { algorithm: 'DH', regex: /\bdh\.(?:generate_parameters|DHPrivateKey)\b/i },
    { algorithm: 'Ed25519', regex: /\bEd25519\b/ },
    { algorithm: 'AES-128', regex: /\bAES\b.*\b128\b/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*\b256\b/ },
    { algorithm: 'DES', regex: /\bDES\b(?!3)(?!ede)/i },
    { algorithm: '3DES', regex: /\b(?:3DES|DES3|DESede|TripleDES)\b/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /\bsha[-_]?1\b/i },
    { algorithm: 'SHA-256', regex: /\bsha[-_]?256\b/i },
    { algorithm: 'SHA-512', regex: /\bsha[-_]?512\b/i },
    { algorithm: 'SHA-3', regex: /\bsha3[-_]/i },
  ],
};

const jsPatterns: LanguagePatterns = {
  extensions: ['.js', '.ts', '.mjs', '.cjs'],
  patterns: [
    { algorithm: 'RSA', regex: /['"]rsa['"]/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'RSA', regex: /generateKeyPairSync\s*\(\s*['"]rsa['"]/i },
    { algorithm: 'ECDSA', regex: /['"]ec['"]/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b|createECDH/i },
    { algorithm: 'DH', regex: /\bcreateDiffieHellman\b/ },
    { algorithm: 'Ed25519', regex: /\bEd25519\b|['"]ed25519['"]/i },
    { algorithm: 'AES-128', regex: /\baes-128\b/i },
    { algorithm: 'AES-256', regex: /\baes-256\b/i },
    { algorithm: 'DES', regex: /['"]des['"]|['"]des-/i },
    { algorithm: '3DES', regex: /['"]des-ede3['"]/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /['"]sha1['"]/i },
    { algorithm: 'SHA-256', regex: /['"]sha256['"]/i },
    { algorithm: 'SHA-512', regex: /['"]sha512['"]/i },
    { algorithm: 'P-256', regex: /\bprime256v1\b|\bP-256\b|\bsecp256r1\b/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const goPatterns: LanguagePatterns = {
  extensions: ['.go'],
  patterns: [
    { algorithm: 'RSA', regex: /\bcrypto\/rsa\b|rsa\.GenerateKey|rsa\.SignPKCS|rsa\.EncryptPKCS/ },
    { algorithm: 'ECDSA', regex: /\bcrypto\/ecdsa\b|ecdsa\.GenerateKey|ecdsa\.Sign/ },
    { algorithm: 'ECDH', regex: /\bcrypto\/ecdh\b|ecdh\./ },
    { algorithm: 'DSA', regex: /\bcrypto\/dsa\b|dsa\.GenerateKey/ },
    { algorithm: 'Ed25519', regex: /\bcrypto\/ed25519\b|ed25519\.GenerateKey/ },
    { algorithm: 'DES', regex: /\bcrypto\/des\b|des\.NewCipher/ },
    { algorithm: '3DES', regex: /des\.NewTripleDESCipher/ },
    { algorithm: 'MD5', regex: /\bcrypto\/md5\b|md5\.New\b|md5\.Sum/ },
    { algorithm: 'SHA-1', regex: /\bcrypto\/sha1\b|sha1\.New\b|sha1\.Sum/ },
    { algorithm: 'SHA-256', regex: /\bcrypto\/sha256\b|sha256\.New\b|sha256\.Sum/ },
    { algorithm: 'SHA-512', regex: /\bcrypto\/sha512\b|sha512\.New\b/ },
    { algorithm: 'AES-128', regex: /\baes\.NewCipher\b.*16\b/ },
    { algorithm: 'AES-256', regex: /\baes\.NewCipher\b.*32\b/ },
    { algorithm: 'RSA', regex: /\bx509\..*RSA\b/ },
  ],
};

const rustPatterns: LanguagePatterns = {
  extensions: ['.rs'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa::?\b|RsaPrivateKey|RsaPublicKey/i },
    { algorithm: 'ECDSA', regex: /\becdsa::?\b|EcdsaKeyPair/i },
    { algorithm: 'Ed25519', regex: /\bed25519\b|Ed25519KeyPair/i },
    { algorithm: 'DES', regex: /\bdes::?\b|Des\b/ },
    { algorithm: 'MD5', regex: /\bmd5::?\b|Md5::/ },
    { algorithm: 'SHA-1', regex: /\bsha1::?\b|Sha1::/ },
    { algorithm: 'SHA-256', regex: /\bsha2?256\b|Sha256::/i },
    { algorithm: 'AES-128', regex: /\bAes128\b/ },
    { algorithm: 'AES-256', regex: /\bAes256\b/ },
    { algorithm: 'P-256', regex: /\bNIST_P256\b|SECP256R1/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const javaPatterns: LanguagePatterns = {
  extensions: ['.java', '.kt'],
  patterns: [
    { algorithm: 'RSA', regex: /getInstance\s*\(\s*"RSA/i },
    { algorithm: 'RSA', regex: /KeyPairGenerator.*"RSA"/ },
    { algorithm: 'ECDSA', regex: /getInstance\s*\(\s*"EC"|"ECDSA"/i },
    { algorithm: 'DSA', regex: /getInstance\s*\(\s*"DSA"/i },
    { algorithm: 'DH', regex: /getInstance\s*\(\s*"DH"|DiffieHellman/i },
    { algorithm: 'DES', regex: /getInstance\s*\(\s*"DES\b/i },
    { algorithm: '3DES', regex: /getInstance\s*\(\s*"DESede/i },
    { algorithm: 'AES-128', regex: /\bAES\b.*128/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*256/ },
    { algorithm: 'MD5', regex: /getInstance\s*\(\s*"MD5"/i },
    { algorithm: 'SHA-1', regex: /getInstance\s*\(\s*"SHA-?1"/i },
    { algorithm: 'SHA-256', regex: /getInstance\s*\(\s*"SHA-?256"/i },
    { algorithm: 'RC4', regex: /getInstance\s*\(\s*"RC4"|"ARCFOUR"/i },
  ],
};

const allLanguages: LanguagePatterns[] = [
  pythonPatterns,
  jsPatterns,
  goPatterns,
  rustPatterns,
  javaPatterns,
];

export function getLanguagePatterns(extension: string): LanguagePatterns | undefined {
  return allLanguages.find((lang) => lang.extensions.includes(extension));
}

export function scanContent(content: string, extension: string): PatternMatch[] {
  const lang = getLanguagePatterns(extension);
  if (!lang) return [];

  const lines = content.split('\n');
  const matches: PatternMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of lang.patterns) {
      if (pattern.regex.test(line)) {
        const key = `${pattern.algorithm}:${i + 1}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            algorithm: pattern.algorithm,
            line: i + 1,
            snippet: line.trim(),
          });
        }
      }
    }
  }

  return matches;
}
