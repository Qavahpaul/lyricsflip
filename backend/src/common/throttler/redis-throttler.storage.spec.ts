import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  const store = new Map<string, { hits: number; pttl: number }>();
  const redis: any = {
    multi: () => {
      const ops: Array<() => [null, number]> = [];
      const chain = {
        incr: (k: string) => {
          ops.push(() => {
            const e = store.get(k) ?? { hits: 0, pttl: -1 };
            e.hits += 1;
            store.set(k, e);
            return [null, e.hits];
          });
          return chain;
        },
        pttl: (k: string) => {
          ops.push(() => [null, store.get(k)?.pttl ?? -2]);
          return chain;
        },
        exec: async () => ops.map((op) => op()),
      };
      return chain;
    },
    pexpire: async (k: string, ms: number) => {
      store.get(k)!.pttl = ms;
    },
    quit: async () => undefined,
  };

  it('counts hits per key and sets expiry on first hit', async () => {
    const storage = new RedisThrottlerStorage(redis);
    const first = await storage.increment('ip-1', 60_000);
    const second = await storage.increment('ip-1', 60_000);
    const other = await storage.increment('ip-2', 60_000);
    expect(first).toEqual({ totalHits: 1, timeToExpire: 60 });
    expect(second.totalHits).toBe(2);
    expect(other.totalHits).toBe(1);
  });
});
