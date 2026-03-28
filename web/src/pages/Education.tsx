import { useEffect, useState } from 'react';
import { getReference, type BenchmarkReport } from '../api.ts';

interface AlgorithmInfo {
  name: string;
  type: string;
  description: string;
  standard: string;
  url: string;
}

const ALGORITHMS: AlgorithmInfo[] = [
  {
    name: 'ML-KEM (FIPS 203)',
    type: 'Key Encapsulation Mechanism',
    description:
      'Lattice-based key encapsulation, formerly known as CRYSTALS-Kyber. Replaces RSA and ECDH for key exchange. ' +
      'Based on the Module Learning With Errors (MLWE) problem. Extremely fast key generation and encapsulation.',
    standard: 'FIPS 203',
    url: 'https://csrc.nist.gov/pubs/fips/203/final',
  },
  {
    name: 'ML-DSA (FIPS 204)',
    type: 'Digital Signature',
    description:
      'Lattice-based digital signature scheme, formerly known as CRYSTALS-Dilithium. Replaces RSA, ECDSA, and Ed25519 signatures. ' +
      'Based on the Module Learning With Errors (MLWE) problem. Uses rejection sampling during signing.',
    standard: 'FIPS 204',
    url: 'https://csrc.nist.gov/pubs/fips/204/final',
  },
  {
    name: 'SLH-DSA (FIPS 205)',
    type: 'Digital Signature (Hash-based)',
    description:
      'Hash-based digital signature scheme, formerly known as SPHINCS+. The most conservative PQC signature scheme — ' +
      'relies only on the security of hash functions, with no algebraic structure that might be attacked. ' +
      'Slow signing, but tiny keys and minimal security assumptions.',
    standard: 'FIPS 205',
    url: 'https://csrc.nist.gov/pubs/fips/205/final',
  },
];

export default function Education() {
  const [profiles, setProfiles] = useState<BenchmarkReport['profiles']>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReference()
      .then((data) => setProfiles(data.profiles))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load profiles'));
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Post-Quantum Cryptography</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        NIST finalized three post-quantum cryptography standards in 2024. Here is what they are and why they matter.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {ALGORITHMS.map((algo) => {
          const relatedProfiles = profiles.filter((p) =>
            p.algorithm.startsWith(algo.name.split(' ')[0])
          );

          return (
            <div
              key={algo.name}
              className="p-6 rounded-lg border border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111]"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">{algo.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                  {algo.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{algo.description}</p>

              {relatedProfiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Parameter Sets</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#333] text-left text-slate-400">
                          <th className="pb-1 pr-4">Variant</th>
                          <th className="pb-1 pr-4 text-right">Public Key</th>
                          <th className="pb-1 pr-4 text-right">Private Key</th>
                          <th className="pb-1 pr-4 text-right">{algo.type.includes('Signature') ? 'Signature' : 'Ciphertext'}</th>
                          <th className="pb-1">Security Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedProfiles.map((p) => (
                          <tr key={p.algorithm} className="border-b border-slate-100 dark:border-[#1a1a1a]">
                            <td className="py-1.5 pr-4 font-mono">{p.algorithm}</td>
                            <td className="py-1.5 pr-4 text-right font-mono">{p.publicKeySize}B</td>
                            <td className="py-1.5 pr-4 text-right font-mono">{p.privateKeySize}B</td>
                            <td className="py-1.5 pr-4 text-right font-mono">
                              {p.signatureSize ? `${p.signatureSize}B` : p.ciphertextSize ? `${p.ciphertextSize}B` : '—'}
                            </td>
                            <td className="py-1.5 text-slate-500 dark:text-slate-400">{p.securityLevel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Standard: {algo.standard} —{' '}
                <a href={algo.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{algo.standard}</a>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded border border-slate-200 dark:border-[#1a1a1a] text-sm text-slate-500 dark:text-slate-400">
        <h3 className="font-bold mb-2">Why does this matter?</h3>
        <p>
          Quantum computers capable of breaking RSA, ECDSA, and ECDH may arrive within the next decade.
          The threat is not just future — adversaries can record encrypted traffic today and decrypt it
          later ("harvest now, decrypt later"). Migrating to post-quantum cryptography protects against
          both current and future threats.
        </p>
      </div>
    </div>
  );
}
