import { routers, WebApp } from '@aomex/web';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';
import { httpLogger } from '@aomex/http-logger';
import { etag } from '@aomex/etag';
import { helmet } from '@aomex/helmet';
import { responseTime } from '@aomex/response-time';
import { traceMiddleware } from '@aomex/async-trace';
import { swaggerUI } from '@aomex/swagger-ui';
import { generateOpenapi } from '@aomex/openapi';

export const app = new WebApp({
  locale: 'zh_CN',
  mount: [
    responseTime,
    traceMiddleware('生命周期', async (record) => {
      // 根据 record.delta 上报慢日志
      // console.log(record);
    }),
    cors(),
    compress(),
    etag(),
    // 访问 http://localhost:3000/swagger 可以查看文档
    swaggerUI({
      openapi: () => {
        return generateOpenapi({
          routers: './src/routers',
          docs: {
            servers: [{ url: 'http://localhost:3000', description: 'Local' }],
          },
        });
      },
    }),
    helmet(),
    httpLogger(),
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
