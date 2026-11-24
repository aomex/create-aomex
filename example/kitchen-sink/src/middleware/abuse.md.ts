import { Abuse } from '@aomex/abuse';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@/configs';

/**
 * HTTP / WebSocket 共用滥用计数与 IP 封禁。
 * 业务侧可调用 `abuse.ipAbuse` / `abuse.blockIP`；挂 `abuse.web()` / `abuse.socket()`。
 */
export const abuse = new Abuse({
  store: new CacheRedisAdapter(configs.redis),
  strategies: [
    {
      strategy: 'honeypot',
      paths: ['/admin.php', '/wp-login.php', '/.env', '/.git/**'],
      limit: 3,
      window: '1 hour',
      blockFor: '1 day',
    },
    {
      strategy: 'http-error',
      statusCodes: [401, 403, 404],
      limit: 80,
      window: '10 minutes',
      blockFor: '1 hour',
    },
    {
      strategy: 'socket-events',
      events: ['admin.*', 'debug.*', 'internal.*'],
      limit: 5,
      window: '1 hour',
      blockFor: '1 day',
    },
  ],
});
