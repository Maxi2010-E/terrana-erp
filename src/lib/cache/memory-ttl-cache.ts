type MemoryCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export function createMemoryTtlCache<T>(ttlMs: number) {
  const store = new Map<string, MemoryCacheEntry<T>>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key: string, value: T) {
      store.set(key, { expiresAt: Date.now() + ttlMs, value });
    },
    delete(key: string) {
      store.delete(key);
    },
  };
}
