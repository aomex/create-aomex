import { routers, WebApp } from '@aomex/web';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';
import { httpLogger } from '@aomex/http-logger';
import { etag } from '@aomex/etag';
import { helmet } from '@aomex/helmet';
import { responseTime } from '@aomex/response-time';
import { swagger } from '@middleware/swagger.md';
import { i18nProvider } from '@middleware/i18n-provider.md';
import { trace } from '@middleware/trace.md';

export const app = new WebApp({
  language: 'zh_CN',
  mount: [
    i18nProvider,
    httpLogger(),
    responseTime,
    trace,
    cors(),
    compress(),
    etag(),
    swagger,
    helmet(),
    routers('./src/routers'),
  ],
});

app.on('error', (err, ctx) => {
  // 上报错误日志
  app.log(err, ctx);
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
