import { BaseCacheService, createRemember } from '@aomex/cache';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@/configs';

export default class CacheService extends BaseCacheService<CacheRedisAdapter> {
  protected readonly captcha = this.key('captcha', 'v1');

  protected createAdapter() {
    return new CacheRedisAdapter(configs.redis);
  }

  async getCaptcha(sessionId: string) {
    return this.cache.get<string>(this.captcha.key(sessionId));
  }

  async setCaptcha(sessionId: string, code: string) {
    return this.cache.set(this.captcha.key(sessionId), code, this.ttl.MINUTE * 5);
  }

  async deleteCaptcha(sessionId: string) {
    return this.cache.delete(this.captcha.key(sessionId));
  }
}

/**
 * 方法装饰器：缓存异步方法返回值（绑定本 CacheService；未命中时并发只跑一次）。
 *
 * ```ts
 * import { Service } from '@aomex/common';
 * import { remember } from '@/services/cache.service';
 *
 * export default class ArticleService extends Service {
 *   // 简写：过期时间（毫秒）；key 默认按「类名-方法名-参数」生成
 *   \@remember(60_000)
 *   async findById(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 *
 *   // 完整写法：自定义 key / defaultValue
 *   \@remember({
 *     duration: 60_000,
 *     key: (id) => `article:${id}`,
 *     // defaultValue: null,
 *   })
 *   async findByIdCached(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 * }
 * ```
 */
export const remember = createRemember(CacheService);
