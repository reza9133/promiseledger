/**
 * genlayer-js decodes contract calldata into JS values whose shape has moved
 * between SDK versions (bigint vs number, Map vs object, address bytes vs
 * hex string). Everything coming off the wire goes through `normalize()` so
 * the rest of the app only ever sees plain JSON: numbers, strings, booleans,
 * arrays and objects.
 */
export function normalize<T = unknown>(value: unknown): T {
  return walk(value, 0) as T;
}

function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function walk(value: unknown, depth: number): unknown {
  if (depth > 12) return null;
  if (typeof value === "bigint") {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= -BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  if (value instanceof Uint8Array) return value.length === 20 ? bytesToHex(value) : Array.from(value);
  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) out[String(k)] = walk(v, depth + 1);
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = walk(v, depth + 1);
    return out;
  }
  return value;
}
