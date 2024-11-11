import { routers, WebApp } from '@aomex/web';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';
import { etag } from '@aomex/etag';
import { helmet } from '@aomex/helmet';
import { responseTime } from '@aomex/response-time';
import { swagger } from '@middleware/swagger.md';
import { i18nProvider } from '@middleware/i18n-provider.md';
import { trace } from '@middleware/trace.md';
import { httpLogger } from '@middleware/http-logger.md';
import { logger } from '@services/logger';

export const app = new WebApp({
  language: 'zh_CN',
  mount: [
    i18nProvider,
    httpLogger,
    responseTime,
    cors(),
    compress(),
    etag(),
    swagger,
    helmet(),
    trace,
    routers('./src/routers'),
  ],
});

app.on('error', (err, ctx) => {
  logger.error(err.stack || '');
  ctx.response.body = {
    status: ctx.response.statusCode,
    message: ctx.response.body,
  };
});

const port = process.env['PORT'] || 3000;
app.listen(port, () => {
  console.log(`服务已启动，点击 http://localhost:${port} 访问`);
});

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
