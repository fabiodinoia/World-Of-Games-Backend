// Copies only the listed keys that are present on `source` (e.g. a request body).
export const pick = <T extends object, K extends string>(
  source: T | undefined,
  keys: readonly K[]
) =>
  Object.fromEntries(
    keys
      .filter((key) => source && (source as Record<string, unknown>)[key] !== undefined)
      .map((key) => [key, (source as Record<string, unknown>)[key]])
  ) as Partial<Record<K, T extends Record<K, infer V> ? V : any>>;
