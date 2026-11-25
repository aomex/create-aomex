import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clusterListen, routers, WebApp } from '@aomex/web';
// import { envelope } from '@aomex/web';
import { globalErrorRewrite } from '@/middleware/format-error.md';
import { httpAccessLog } from '@/middleware/access-log.md';
import { responseTime } from '@aomex/response-time';
import { cors } from '@aomex/cors';
import { csrf } from '@aomex/csrf';
import { rateLimit } from '@aomex/rate-limit';
import { RateLimitRedisStore } from '@aomex/rate-limit-redis-store';
import { compress } from '@aomex/compress';
import { etag } from '@aomex/etag';
import { slowTrace } from '@/middleware/slow-trace.md';
import { prettyJson } from '@aomex/pretty-json';
import { helmet } from '@aomex/helmet';
import { configs } from '@/configs';
import { abuse } from '@/middleware/abuse.md';
import { ws } from '@/ws';
import { docs } from '@/middleware/docs.md';
import { asyncapiDocs } from '@/middleware/asyncapi.md';
import { logger } from '@/services/logger.service';
import { services } from '@/services';

const isProduction = process.env['NODE_ENV'] === 'production';

export const app = new WebApp({
  services,
  logger,
  // 按 Accept-Language 自动切换语言时，改用：
  // language: { mode: 'dynamic', header: 'accept-language', fallback: 'zh-CN' },
  language: { mode: 'fixed', language: 'zh-CN' },
  proxyIP: { mode: 'detect' },
  // 如果要把所有请求都封装成固定格式并调整状态码为200，请解开下面的注释
  // envelope: {
  //   content: {
  //     success: envelope.success,
  //     statusCode: envelope.statusCode,
  //     data: envelope.payload,
  //   },
  // },
  mount: [
    httpAccessLog.skip(isProduction),
    abuse.web(),
    responseTime(),
    cors({
      // 前端请求需携带 Cookies 时解开
      // credentials: true,
      // 开启 credentials 后必须限制 origin（禁止 *）；仅此不能防 CSRF
      // Cookie 会话（如 Session 鉴权）请再挂载 @aomex/csrf 做双提交校验
      // origin: [
      //   'https://www.example.com',
      //   'https://admin.example.com',
      // ],
    }),
    csrf(),
    rateLimit({
      store: new RateLimitRedisStore(configs.redis),
    }),
    // 生产亦可交给 nginx gzip / brotli
    compress(),
    etag(),
    globalErrorRewrite,
    slowTrace,
    prettyJson(),
    docs.skip(isProduction),
    asyncapiDocs.skip(isProduction),
    helmet(),
    routers('./src/routers'),
  ],
});

process.on('uncaughtException', (err) => {
  void logger.fatal(err);
});

// 仅直接运行本文件时 listen（Console openapi 会 import { app }，避免副作用起服）
const isMain =
  !!process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  clusterListen({
    // 勿与 PM2 -i / 容器多副本叠用；容器 / K8s 优先单进程 + 副本扩缩
    workers: 'max',
    listen: () => {
      const port = process.env['PORT'] || 3000;
      const server = app.http({
        // 对应 nginx upstream.keepalive_timeout=60s
        // 注意 nginx upstream.keepalive=N 必须主动配置，否则无法复用连接
        keepAliveTimeout: 61_000,
        headersTimeout: 65_000,
      });
      // 须在 listen 之前 attach；只在本 HTTP 入口调用一次
      ws.attach(app, server);
      server.listen(port, () => {
        console.log(`HTTP server is listening, visit http://localhost:${port}`);
        console.log(`WebSocket endpoint: ws://localhost:${port}/ws`);
      });
    },
  });
}

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
