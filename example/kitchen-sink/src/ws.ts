import { WebsocketApp, channels } from '@aomex/websocket';
import { WsTransport } from '@aomex/websocket-ws-transport';
import { RedisHub } from '@aomex/websocket-redis-hub';
import { websocketRateLimit } from '@aomex/rate-limit/websocket';
import { RateLimitRedisStore } from '@aomex/rate-limit-redis-store';
import { configs } from '@/configs';
import { services } from '@/services';
import { abuse } from '@/middleware/abuse.md';
import { wsAccessLog } from '@/middleware/access-log.md';

/**
 * 与 WebApp 同级的 WebSocket 应用。
 * 只在 HTTP 入口 attach 一次；路由 / console 可 import 本模块用 ws.room / ws.all 推送。
 * RedisHub：多机 / console 跨进程推送须与 Web 共用同一 Redis 与 channel 前缀。
 */
export const ws = new WebsocketApp({
  logger: services.logger,
  language: { mode: 'fixed', language: 'zh-CN' },
  path: '/ws',
  transport: new WsTransport({
    // 心跳间隔（毫秒）；`0` 关闭
    heartbeatInterval: 30_000,
    // permessage-deflate（帧级压缩）；高并发 / CPU 紧张时可关
    perMessageDeflate: true,
  }),
  hub: new RedisHub(configs.redis),
  mount: [
    wsAccessLog,
    abuse.socket(),
    websocketRateLimit({
      store: new RateLimitRedisStore(configs.redis),
      limit: 60,
      window: '10s',
    }),
    channels('./src/channels'),
  ],
});
