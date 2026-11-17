# aomex 最佳实践

官方文档：https://aomex.js.org  
包名以 **`@aomex/common` / `@aomex/web` / `@aomex/console`** 为准（不要用已废弃的 `@aomex/core`）。

## 项目约定（本脚手架）

| 路径                               | 职责                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `src/web.ts`                       | HTTP 入口：`WebApp` + 全局 `mount`                          |
| `src/cli.ts`                       | 控制台入口：`ConsoleApp`                                    |
| `src/routers/*.router.ts`          | HTTP 路由，`routers('./src/routers')` 自动扫描              |
| `src/commanders/*.cmd.ts`          | 控制台指令                                                  |
| `src/middleware/*.md.ts`           | 可复用中间件                                                |
| `src/services/*.service.ts`        | 业务服务（默认导出 Class）                                  |
| `src/services/prisma.service.ts`   | Prisma 连接生命周期（若选用）；仍可 `import { prisma }`     |
| `src/services/mongoose.service.ts` | Mongoose 连接生命周期（若选用）；仍可 `import { mongoose }` |
| `src/services/index.ts`            | `combineServices` 注册                                      |
| `src/schemas/`                     | Prisma 校验入口（若选用 Prisma）                            |
| `src/configs/`                     | 多环境配置                                                  |

路径别名：统一 `@/*` → `src/*`（如 `@/services`、`@/middleware/...`、`@/configs`）。

## WebApp / ConsoleApp

创建时必须提供：`services`、`logger`、`language`；Web 另需 `proxyIP`。

```ts
export const app = new WebApp({
  services,
  logger: services.logger,
  language: { mode: 'fixed', language: 'zh-CN' },
  // 或按请求头：{ mode: 'dynamic', header: 'accept-language', fallback: 'zh-CN' }
  proxyIP: { mode: 'detect' },
  mount: [
    // 全局中间件（洋葱模型，越靠前越外层）
    formatError({/* ... */}),
    routers('./src/routers'),
  ],
});

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
```

- **错误响应**：用 `formatError`，不要再挂 `app.on('error')`。
- **未捕获异常**：`process.on('uncaughtException', ...)` + `services.logger.fatal`。
- **集群方案**（勿叠用）：`clusterListen({ workers: 'max', listen })`；或 PM2 `instances: 'max'` + `pm2-runtime`；勿与容器多副本叠用。
- **语言**：使用 BCP 47 规范码（如 `zh-CN`、`en-US`），见 `I18N_LANGUAGES`。

## 路由

```ts
import { body, response, Router } from '@aomex/web';
import { rule } from '@aomex/common';

export const router = new Router({ prefix: '/articles' });

router.post('/', {
  mount: [
    body({ title: rule.string(), content: rule.string() }),
    // 或 body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags'))
    response({ statusCode: 201, content: rule.object({ id: rule.int(), title: rule.string() }) }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(ctx.body);
    ctx.send(201, article);
  },
});
```

规则：

- 入参用 `body` / `query` / `params`；出参用 `response`（便于 OpenAPI）。
- `body`/`response` 接受 `rule.*`、字段表或 `ValidatorSchema`（如 `prismaOutput.article`）。
- 业务逻辑放 **Service**，路由只做编排与 `ctx.send`。
- 文件名建议 `*.router.ts`，与 `routers()` 扫描一致。

## 中间件

```ts
import { middleware } from '@aomex/common';

export const xxx = middleware.web(async (ctx, next) => {
  // 前置
  await next();
  // 后置
});

// 条件跳过
xxx.skip(isProduction);
```

- Web 专用：`middleware.web`；可复用到 Web+Console：`middleware.mixin`。
- 需要往 `ctx` 挂类型时用泛型：`middleware.web<{ userId: number }>(...)`。
- 路由级共享逻辑放 `new Router({ mount: [...] })`；单接口放方法的 `mount`。

## 服务层

```ts
// article.service.ts
import { Service } from '@aomex/common';
export default class ArticleService extends Service {
  async findArticles() {
    /* ... */
  }
}

// index.ts
export const services = await combineServices(
  {
    logger: () => import('./logger.service.js'),
    cache: () => import('./cache.service.js'),
    article: () => import('./article.service.js'),
  },
  { eager: ['logger', 'cache'] }, // 基础设施启动时 onInit
);
```

- Loader **必须**是 `() => import('...')`，不要直接传 Class。
- 类型由 `combineServices` 返回值推断，**不要**再写 `CombinedServices` 模块扩充。
- 互调：`import { services } from '@/services'` 后用 `services.xxx`。
- 把返回的 `services` 交给 `WebApp`/`ConsoleApp`，**不要**手写销毁。
- Prisma：在 `prisma.service.ts` 里 `await registerLifecycle({ onInit: () => prisma.$connect(), onDestroy: () => prisma.$disconnect() })`；业务 `import { prisma } from '@/services/prisma.service'` 时会登记生命周期，不必再放进 `combineServices`。
- Mongoose：在 `mongoose.service.ts` 里 `await registerLifecycle({ onInit: () => mongoose.connect(uri), onDestroy: () => mongoose.disconnect() })`，并由 `services/index.ts` 侧效导入以保证启动即连接；不必再放进 `combineServices`。
- Prisma 可空 `Json`：`Prisma.*Input` 不接受 JS `null`（要 `DbNull` / `JsonNull`）。转换放在进 Service 之前（路由/`nullableJsonFields`），Service 参数仍用 Prisma 类型；或接口不收 `null`（清空用 `[]` / 不传）。

## 校验（rule）

- 优先 `rule.string()` / `rule.int()` / `rule.object()` / `rule.array()` / `rule.enum()`。
- Schema 组合：`schema({...}).pick()` / `.omit()` / `.extend()` / `.partial()`。
- Prisma：在 `definePrismaSchema(generated, { user: { input, output } })` 里 **override** 字段，再用 `Validator.Infer<typeof rule>` 导出 `PrismaJson` 类型；不要手写与校验脱节的 interface。

## 鉴权

- 使用 `@aomex/auth` + 策略（bearer / jwt / api-key）。
- Token 加载顺序、cookie key 与缓存吊销跟现有 `src/middleware/auth.md.ts` 保持一致。
- 需要登录的接口：`mount: [auth.authenticate('user'), ...]`（以项目导出的 `auth` 为准）。

## Console / Cron

- 指令：`Commander` + `options(rule...)`，文件 `*.cmd.ts`。
- 定时：`crons({ commanders, store, port })`；store 常用 `CacheRedisAdapter`。

## 日志

- 继承 `BaseLoggerService`，在 `createTransports()` 返回出口列表。
- HTTP 访问日志用 `@aomex/http-access-log`，与业务 logger 出口分开配置。

## 反模式（不要做）

- 在路由里堆 SQL / 复杂业务，而不走 Service。
- 使用过时包名 `@aomex/core` 或旧的 `app.on('error')` 作为唯一错误处理。
- `combineServices` 直接传 Class，或仍写已废弃的 `CombinedServices` 模块扩充。
- Prisma Json 手写类型却不 override validator（类型与运行时脱节）。
- 忽略 `WebApp.Infer` / `ConsoleApp.Infer` 的 `declare module` 扩展（丢失全局 ctx 类型）。

## 改代码时的检查清单

- [ ] 新接口有 `body`/`query`/`params` 与 `response`
- [ ] 业务在 Service；路由可单测编排
- [ ] 新 Service 已注册到 `combineServices`，需要启动即连的放进 `eager`
- [ ] 中间件顺序符合洋葱模型（文档 UI 一般在 helmet 前）
- [ ] 生产敏感中间件使用 `.skip(isProduction)`（文档 UI 等）
