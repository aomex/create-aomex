import 'dotenv/config';
import { routers, WebApp } from '@aomex/web';
import { globalErrorRewrite } from '@/middleware/format-error.md';
import { httpAccessLog } from '@/middleware/http-access-log.md';
import { responseTime } from '@aomex/response-time';
import { slowTrace } from '@/middleware/slow-trace.md';
import { cors } from '@aomex/cors';
import { etag } from '@aomex/etag';
import { helmet } from '@aomex/helmet';
import { swagger } from '@/middleware/swagger.md';
import { services } from '@/services';

const isProduction = process.env['NODE_ENV'] === 'production';

export const app = new WebApp({
  services,
  logger: services.logger,
  language: { mode: 'fixed', language: 'zh-CN' },
  proxyIP: { mode: 'detect' },
  mount: [
    httpAccessLog.skip(isProduction),
    responseTime(),
    globalErrorRewrite,
    slowTrace,
    cors({
      // 如果请求需要携带cookies，请解开下面这行注释
      // credentials: true,
    }),
    etag(),
    swagger.skip(isProduction),
    helmet(),
    routers('./src/routers'),
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});

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

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
