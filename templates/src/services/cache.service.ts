import { Service } from '@aomex/core';
import { Caching } from '@aomex/cache';
import { redisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@configs';

export const cache = new Caching(redisAdapter(configs.redis));

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
