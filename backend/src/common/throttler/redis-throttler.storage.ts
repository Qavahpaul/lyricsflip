import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Redis } from 'ioredis';

export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
}

/**
 * Redis-backed throttler storage so rate limits are shared across instances.
 * Uses INCR + PEXPIRE so each key counts hits within a fixed ttl window.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  constructor(private readonly redis: Redis) {}

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${key}`;
    const results = await this.redis
      .multi()
      .incr(redisKey)
      .pttl(redisKey)
      .exec();
    const totalHits = Number(results?.[0]?.[1] ?? 1);
    let pttl = Number(results?.[1]?.[1] ?? -1);
    if (pttl < 0) {
      await this.redis.pexpire(redisKey, ttl);
      pttl = ttl;
    }
    return { totalHits, timeToExpire: Math.ceil(pttl / 1000) };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
