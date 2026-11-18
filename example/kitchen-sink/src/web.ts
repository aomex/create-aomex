import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clusterListen, routers, WebApp } from '@aomex/web';
// import { envelope } from '@aomex/web';
import { globalErrorRewrite } from '@/middleware/format-error.md';
import { httpAccessLog } from '@/middleware/http-access-log.md';
import { responseTime } from '@aomex/response-time';
import { cors } from '@aomex/cors';
import { rateLimit } from '@aomex/rate-limit';
import { compress } from '@aomex/compress';
import { etag } from '@aomex/etag';
import { slowTrace } from '@/middleware/slow-trace.md';
import { prettyJson } from '@aomex/pretty-json';
import { helmet } from '@aomex/helmet';
import { swagger } from '@/middleware/swagger.md';
import { services } from '@/services';

const isProduction = process.env['NODE_ENV'] === 'production';

export const app = new WebApp({
  services,
  logger: services.logger,
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
    responseTime(),
    cors({
      // 如果请求需要携带cookies，请解开下面这行注释
      // credentials: true,
    }),
    rateLimit(),
    compress(),
    etag(),
    globalErrorRewrite,
    slowTrace,
    prettyJson(),
    swagger.skip(isProduction),
    helmet(),
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
      const port = process.env['PORT'] || 3000;
      app
        .http({
          // 对应 nginx upstream.keepalive_timeout=60s
          // 注意 nginx upstream.keepalive=N 必须主动配置，否则无法复用连接
          keepAliveTimeout: 61_000,
          headersTimeout: 65_000,
        })
        .listen(port, () => {
          console.log(`HTTP server is listening, visit http://localhost:${port}`);
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
