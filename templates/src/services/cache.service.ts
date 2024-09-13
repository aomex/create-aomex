import { Service } from '@aomex/core';
import { Caching, CacheMemoryAdapter } from '@aomex/cache';
// import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';

export const cache = new Caching(new CacheMemoryAdapter());

export class CacheService extends Service {
  protected readonly hotRankingKey = 'hot-rankings';

  getHotRankings() {
    return cache.get<HotRankingItem[]>(this.hotRankingKey, []);
  }

  setHotRankings(value: HotRankingItem[]) {
    return cache.set(this.hotRankingKey, value, 300_000);
  }
}

interface HotRankingItem {
  id: number;
  name: string;
  ranking: number;
}
