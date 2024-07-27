import { Service } from '@aomex/core';
import { Caching, CacheMemoryStore } from '@aomex/cache';
// import { CacheRedisStore } from '@aomex/cache-redis-store';

export const cache = new Caching(CacheMemoryStore, {});

export class CacheService extends Service {
  protected hotRankingKey = 'hot-rankings';

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
