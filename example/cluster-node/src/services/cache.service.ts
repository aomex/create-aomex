import { Caching, createRemember } from '@aomex/cache';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@/configs';

const adapter = new CacheRedisAdapter(configs.redis);

export const cache = new Caching(adapter);

/**
 * 方法装饰器：缓存异步方法返回值（绑定本 cache；未命中时并发只跑一次）。
 *
 * ```ts
 * import { Service } from '@aomex/common';
 * import { remember } from '@/services/cache.service';
 *
 * export default class ArticleService extends Service {
 *   // 简写：过期时间（毫秒或 '1 minute'）；key 默认按「类名-方法名-参数」生成
 *   \@remember(60_000)
 *   async findById(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 *
 *   // 完整写法：自定义 key / defaultValue
 *   \@remember({
 *     duration: '1 minute',
 *     key: (id) => `article:${id}`,
 *     // defaultValue: null,
 *   })
 *   async findByIdCached(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 * }
 * ```
 */
export const remember = createRemember(cache);
