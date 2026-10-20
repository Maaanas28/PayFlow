import { createHash } from 'crypto';

/**
 * Computes a deterministic SHA-256 hash of a normalized JSON payload.
 * Recursively sorts object keys so that differences in property ordering
 * do not alter the resulting hash.
 */
export function computeRequestHash(payload: unknown): string {
  const normalize = (val: unknown): unknown => {
    if (val === null || typeof val !== 'object') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(normalize);
    }
    const record = val as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalize(record[key]);
        return acc;
      }, {} as Record<string, unknown>);
  };

  const canonicalJson = JSON.stringify(normalize(payload));
  return createHash('sha256').update(canonicalJson).digest('hex');
}
