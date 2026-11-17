import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clusterListen, formatError, routers, WebApp } from '@aomex/web';
import { rule } from '@aomex/common';
import { httpAccessLog } from '@/middleware/http-access-log.md';
import { responseTime } from '@aomex/response-time';
import { slowTrace } from '@/middleware/slow-trace.md';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';
import { etag } from '@aomex/etag';
import { prettyJson } from '@aomex/pretty-json';
import { rateLimit } from '@aomex/rate-limit';
import { serveStatic } from '@aomex/serve-static';
import { helmet } from '@aomex/helmet';
import { swagger } from '@/middleware/swagger.md';
import { services } from '@/services';

const isProduction = process.env['NODE_ENV'] === 'production';

export const app = new WebApp({
  services,
  logger: services.logger,
  language: { mode: 'dynamic', header: 'accept-language', fallback: 'zh-CN' },
  proxyIP: { mode: 'detect' },
  mount: [
    httpAccessLog.skip(isProduction),
    responseTime(),
    slowTrace,
    cors({ credentials: true }),
    compress(),
    etag(),
    prettyJson(),
    rateLimit(),
    serveStatic('./public'),
    swagger.skip(isProduction),
    helmet(),
    formatError({
      content: { code: rule.string(), message: rule.string() },
      handler(err) {
        return { code: err.code || '', message: err.message };
      },
    }),
    routers('./src/routers'),
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});

// 仅直接运行本文件时 listen（Console openapi 会 import { app }，避免副作用起服）
const isMain =
  !!process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  clusterListen({
    // 勿与 PM2 -i / 容器多副本叠用；容器 / K8s 优先单进程 + 副本扩缩
    workers: 'max',
    listen: () => {
      app
        .http({
          // 对应 nginx upstream.keepalive_timeout=60s
          // 注意 nginx upstream.keepalive=N 必须主动配置，否则无法复用连接
          keepAliveTimeout: 61_000,
          headersTimeout: 65_000,
        })
        .listen(process.env['PORT'] || 3000, () => {
          console.log('HTTP server is listening');
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
