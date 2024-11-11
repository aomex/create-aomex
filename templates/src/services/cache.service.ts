import { Service } from '@aomex/common';
import { Caching } from '@aomex/cache';
import { redisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@configs';

export const redisCache = new Caching(redisAdapter(configs.redis));

export class CacheService extends Service {}
