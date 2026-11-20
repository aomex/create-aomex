import 'dotenv/config';
import { clusterListen, routers, WebApp } from '@aomex/web';
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
    etag(),
    globalErrorRewrite,
    helmet(),
    routers('./src/routers'),
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});

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

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
