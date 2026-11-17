import 'dotenv/config';
import { formatError, routers, WebApp } from '@aomex/web';
import { rule } from '@aomex/common';
import { services } from '@/services';

const isProduction = process.env['NODE_ENV'] === 'production';

export const app = new WebApp({
  services,
  logger: services.logger,
  language: { mode: 'dynamic', header: 'accept-language', fallback: 'zh-CN' },
  proxyIP: { mode: 'detect' },
  mount: [
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
