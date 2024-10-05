import { Service } from '@aomex/core';
import { Caching } from '@aomex/cache';
import { redisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@configs';

export const cache = new Caching(redisAdapter(configs.redis));

export class CacheService extends Service {
  protected readonly demoKey = 'demo';

  getHotRankings() {
    return cache.get<DemoItem[]>(this.demoKey, []);
  }

  setHotRankings(value: DemoItem[]) {
    return cache.set(this.demoKey, value, 30_000);
  }
}

interface DemoItem {
  id: number;
  name: string;
}
