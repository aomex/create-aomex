import 'dotenv/config';
import { routers, WebApp } from '@aomex/web';
// import { envelope } from '@aomex/web';
import { globalErrorRewrite } from '@/middleware/format-error.md';
import { responseTime } from '@aomex/response-time';
import { cors } from '@aomex/cors';
import { etag } from '@aomex/etag';
import { helmet } from '@aomex/helmet';
import { services } from '@/services';

export const app = new WebApp({
  services,
  logger: services.logger,
  // 按 Accept-Language 自动切换语言时，改用：
  // language: { mode: 'dynamic', header: 'accept-language', fallback: 'en-US' },
  language: { mode: 'fixed', language: 'en-US' },
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
    responseTime(),
    cors({
      // 如果请求需要携带cookies，请解开下面这行注释
      // credentials: true,
    }),
    etag(),
    globalErrorRewrite,
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
