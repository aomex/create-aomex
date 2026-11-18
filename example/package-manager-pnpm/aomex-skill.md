# aomex 开发指引（给 AI）

官方文档：https://aomex.js.org  
包名用 `@aomex/common` / `@aomex/web` / `@aomex/console`。

**用法**：先读现有 `src/` 再改。本文只说明「放哪、怎么写、场景选什么」，不复述脚手架已经生成好的文件内容。

## 东西放哪

| 你要做的事                                       | 放这里                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 新 HTTP 接口                                     | `src/routers/<领域>.router.ts`（`*.router.ts` 才会被扫描）                              |
| 可复用的请求级逻辑（鉴权、限流之外的业务中间件） | `src/middleware/<名>.md.ts`，再挂到 Router / 接口 `mount`                               |
| 业务逻辑、DB、外部 API                           | `src/services/<名>.service.ts`（`export default class`），并在 `services/index.ts` 注册 |
| 入参/出参校验复用、Prisma 字段 override          | `src/schemas/`                                                                          |
| 环境相关配置                                     | `src/configs/`（不要把密钥硬编码进路由）                                                |
| 一次性/运维指令                                  | `src/commanders/<名>.cmd.ts`                                                            |
| 定时任务                                         | 同一个 `*.cmd.ts`，由 `cli.ts` 里的 `crons` 调度（不要另起进程乱写 setInterval）        |
| 改全局中间件顺序 / 语言 / envelope               | 只改 `src/web.ts`（先看现有注释再动）                                                   |
| 改控制台插件                                     | 只改 `src/cli.ts`                                                                       |

路径别名：`@/*` → `src/*`。

**分层**：Router 只做校验 + 鉴权挂载 + 调 Service + `ctx.send`；SQL / 事务 / 缓存 / 第三方调用进 Service。

## 路由怎么写

```ts
import { body, params, query, response, Router } from '@aomex/web';
import { rule } from '@aomex/common';
import { services } from '@/services';
// 若项目有鉴权：import { auth } from '@/middleware/auth.md';

export const router = new Router({ prefix: '/articles' });

router.get('/', {
  mount: [
    query({ page: rule.int().min(1).default(1) }),
    response({
      statusCode: 200,
      content: rule.object({
        list: rule.array({ id: rule.int(), title: rule.string() }),
      }),
    }),
  ],
  action: async (ctx) => {
    const list = await services.article.list(ctx.query.page);
    ctx.send({ list });
  },
});

router.post('/', {
  mount: [
    // auth.authenticate('bearer'),
    body({ title: rule.string(), content: rule.string() }),
    response({
      statusCode: 201,
      content: rule.object({ id: rule.int(), title: rule.string() }),
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.create(ctx.body);
    ctx.send(201, article);
  },
});

router.get('/:id', {
  mount: [
    params({ id: rule.int() }),
    response({ statusCode: 200, content: rule.object({ id: rule.int() }) }),
  ],
  action: async (ctx) => {
    const article = await services.article.findById(ctx.params.id);
    ctx.send(article);
  },
});
```

要点：

- 入参：`body` / `query` / `params`；出参：`response`（OpenAPI 依赖它们）。
- 同前缀共享中间件：`new Router({ prefix, mount: [...] })`；单接口放方法级 `mount`。
- 不要在 `action` 里写长业务；`ctx.send(status?, data)` 即可。
- 文件必须 `export const router`，文件名 `*.router.ts`。

## 校验（rule）

- `rule.array({ ... })` 可直接传对象字段表，不必再包一层 `rule.object`。
- `rule.object({ ... })` 可用对象字面量**深度嵌套**（字段里再写对象 / 数组即可），不必层层拆成多个临时 schema。
- `rule.enum(MyEnum)` **可直接传入 TypeScript `enum`**，不要把成员一个个抄进数组。

```ts
enum Status {
  Draft = 'draft',
  Published = 'published',
}

body({ status: rule.enum(Status) });
```

### Prisma 字段收紧（Json / 业务 enum）

生成器给出的字段类型偏宽松；业务要收紧时，**先**在 `definePrismaSchema` 第二个参数里 **override**（`input` / `output` 的 `extend`）：

- **Json**：用 `rule` 描述结构；再用 `Validator.Infer<typeof 那个 rule>` 写进 `declare global { namespace PrismaJson { ... } }`；Prisma schema 用 `/// [TypeName]` 引用。
- **库里是 `Int`、业务有对应 enum**：不要在路由里散落魔法数字；override 成 `rule.enum(MyEnum)`（可直接传 TS enum），让入参/出参与 Service 类型一致。

```ts
import { rule, Validator } from '@aomex/common';
import { definePrismaSchema } from '@aomex/prisma';
import { generated } from '@/generated/aomex/prisma';

const articleTags = rule.array(rule.string());

export const { prismaInput, prismaOutput, prismaEnum } = definePrismaSchema(generated, {
  article: {
    input: (s) => s.extend({ tags: articleTags }),
    output: (s) => s.extend({ tags: articleTags }),
  },
});

declare global {
  namespace PrismaJson {
    type ArticleTags = Validator.Infer<typeof articleTags>;
  }
}
```

不要手写与 validator 脱节的 `interface` 去「假装」Json 类型。

## 服务（懒加载）

`combineServices` 得到的 `services.xxx` 是**懒加载代理**：从外部（路由 / 其他 Service / commander）调用时，**方法一律按异步使用**（`await services.article.foo()`），即使 Class 里写的是同步方法。类型会精确提示为 `Promise<...>`。

- Service **内部** `this.bar()` / 同文件直调不受影响，该同步仍同步。
- 不要对 `services.xxx.method()` 的返回值当成同步结果用。

## 场景 → 用什么

| 场景                        | 做法                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 需要登录 / 身份             | `mount: [auth.authenticate('<策略名>'), ...]`；策略名以 `auth.md.ts` 里 `strategies` 的 key 为准（如 `bearer` / `jwt` / `apiKey`） |
| 需要权限（已登录后）        | `auth.authenticate(name).authorize(...)` 或 `auth.authorize(name, ...)`                                                            |
| 读写缓存                    | `services.cache`；方法级缓存用 `@remember`（见 `cache.service.ts`）                                                                |
| 业务日志                    | `services.logger`（info/warn/error/fatal）；不要 `console.log` 打生产日志                                                          |
| HTTP 访问日志               | 用已有 `@aomex/http-access-log` 中间件；与业务 logger 分开                                                                         |
| 统一改错误 JSON 形态        | 改 `format-error.md.ts` 的 `globalErrorRewrite`；不要再挂 `app.on('error')` 当唯一处理                                             |
| 全体接口固定壳 + HTTP 200   | 解开 `web.ts` 里 `envelope` 相关注释                                                                                               |
| 按请求头切语言              | 解开 `web.ts` 里 dynamic `language` 注释                                                                                           |
| 入参校验 / 组合字段         | `rule.*`；复用 `schema({...}).pick/omit/extend/partial`；枚举用 `rule.enum(TsEnum)`                                                |
| Prisma 模型校验             | `src/schemas` + `definePrismaSchema`；`body(prismaInput.x.pick(...))`                                                              |
| Prisma Json / Int↔业务 enum | 先 `definePrismaSchema` override；Json 再 `Validator.Infer<>` → `PrismaJson`（见上节）                                             |
| Prisma 可空 Json 写入       | 进 Service 前把 JS `null` 转成 `DbNull`/`JsonNull`（或接口不收 null）                                                              |
| DB 连接生命周期             | Prisma/Mongoose：跟现有 `*.service.ts` + `registerLifecycle`；**不要**再塞进 `combineServices`                                     |
| 新业务 Service              | 新文件 + `combineServices({ xxx: () => import('./xxx.service.js') })`；loader 必须是动态 import；启动即要连的放 `eager`            |
| 调 `services.xxx`           | 一律 `await`（懒加载）；类型已是 `Promise`；Service 内部 `this.` 调用除外                                                          |
| Service 互调                | `import { services } from '@/services'` → `await services.other....`                                                               |
| 控制台命令 / 定时任务       | 见下节「指令与定时任务」                                                                                                           |
| 生产关掉文档 UI             | 已有 `swagger`/`redoc`/`scalar` 用 `.skip(isProduction)`；新加敏感中间件同样模式                                                   |
| 慢请求追踪                  | 已有 async-trace 时挂慢请求中间件；不要自己 setTimeout 统计                                                                        |

## 指令与定时任务

定时任务**建立在指令之上**：先写 `Commander`，需要定时调度时再 `mount: [cron(...)]`。`cli.ts` 里已有 `crons({ commanders, store, port })` 负责收集并调度，**不要**自己 `setInterval`。

### 怎么写指令

```ts
// src/commanders/hello.cmd.ts
import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/common';

export const commander = new Commander();

commander.create('hello', {
  mount: [
    options(
      { user: rule.string().default('World') },
      { user: ['u'] }, // 短选项 -u
    ),
  ],
  action: async (ctx) => {
    await ctx.logger.info(`Hello ${ctx.options.user}`);
  },
});
```

- 文件 `*.cmd.ts`，`export const commander`。
- 业务进 Service；这里只编排。

### 什么时候加 `cron()`

- **只要手动跑**：不要挂 `cron`，用包管理器执行指令即可。
- **要按时间自动跑**：在该指令的 `mount` 里加 `cron(...)`（可挂多个，配合 `args` 区分参数）。
- `cli.ts` 的 `crons({...})` 是调度器入口，和指令上的 `cron()` 不是一回事——前者收集，后者声明调度规则。

### 调度规则写法

```ts
import { cron } from '@aomex/cron';

// 对象字段（推荐可读）
cron({ minute: '*/10' });
cron({ second: '0', minute: '0', hour: '2' }); // 每天 02:00:00

// 或 cron 表达式字符串（5 段从分起，或 6 段含秒；验证可用 https://crontab.guru ）
cron('0 */6 * * *');
cron({ time: '0 0 2 * * *', args: ['--user', 'batch'] });
```

### 长期运行不断开

需要「一直转、直到被停」的循环任务时，用 `ctx.cron.isAlive()`（`aomex cron:stop` 后变为 `false`）：

```ts
commander.create('consume', {
  mount: [cron({ minute: '*' })],
  action: async (ctx) => {
    // 可选：isAlive(maxTimeoutMS) 限制本轮最长存活
    while (ctx.cron.isAlive()) {
      await services.queue.tick();
      // ...
      await sleep(3_000);
    }
  },
});
```

相关：`ctx.cron.isCurrentEpoch()` 判断是否仍处于本触发窗口（`nextScheduleTime > now`）。

### `concurrent` 并发

- 默认 `concurrent: 1`：同一任务同时只跑一个实例。
- 允许跨时间点重叠、或多实例一起干：设 `concurrent: N` 或 `'infinity'`。
- 达上限的新任务进等待池，超时丢弃；用 `waitingTimeout`（默认 `10_000` ms）调节。
- 长循环任务若常跨点，适当加大 `concurrent` / `waitingTimeout`，避免下一轮抢不到执行权。

```ts
cron({
  minute: '*',
  concurrent: 3,
  waitingTimeout: 15_000,
  args: ['--batch', '1'],
});
```

### 调用方式

| 目的             | 命令（按项目包管理器替换）                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 手动跑指令       | `pnpm aomex hello` / `pnpm aomex hello -u World`（yarn 同理；npm 用 `npm exec -- aomex ...`） |
| 看全部指令       | `pnpm aomex -h`                                                                               |
| 启动定时调度     | `pnpm aomex cron:start`（脚手架 `start` 脚本通常已带）                                        |
| 查看运行中任务   | `pnpm aomex cron:stats`                                                                       |
| 优雅停止定时     | `pnpm aomex cron:stop`（`isAlive()` 变 `false`）                                              |
| 导出调度任务列表 | `pnpm aomex cron:eject`                                                                       |

## 中间件（自写时）

```ts
import { middleware } from '@aomex/common';

export const xxx = middleware.web(async (ctx, next) => {
  await next();
});

// 往 ctx 挂字段并保留类型
export const withUser = middleware.web<{ userId: number }>(async (ctx, next) => {
  ctx.userId = 1;
  await next();
});
```

- 仅 Web：`middleware.web`；Web+Console 共用：`middleware.mixin`。
- 全局顺序在 `web.ts` 的 `mount`（洋葱：**越靠前越外层**；出站顺序相反）。改顺序前先对照下面约束，再看现有 `mount`。

### `web.ts` mount 顺序关系

推荐骨架（有则按此相对位置；没有的插件跳过）：

`accessLog → responseTime → cors → rateLimit → compress → etag → globalErrorRewrite → slowTrace → prettyJson → swagger/redoc/scalar → helmet → routers`

| 关系                                  | 要求                                  | 原因                                                                         |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| `responseTime`                        | 尽量最外（`accessLog` 后）            | 覆盖内侧全部耗时                                                             |
| `cors`                                | 靠外；在限流 / 业务 / 错误重写之前    | 预检早返回；429/错误响应也带 CORS 头                                         |
| `rateLimit`                           | `cors` 后、重活前                     | 尽早拒绝；被拒时可不再进 compress 等                                         |
| `compress` → `etag`                   | **compress 必须在 etag 前面**（更外） | 出站先对明文算 ETag 再压缩；若 etag 更外，压缩后 body 变 Stream，etag 会跳过 |
| `swagger`/`redoc`/`scalar` → `helmet` | 文档 UI 在 helmet 前面                | 命中文档则短路，避免 CSP 弄坏文档页                                          |
| `helmet` → `routers`                  | helmet 在路由前                       | 安全头留给业务接口                                                           |

注意：

- `compress` 只需满足「在 etag 前」，可以紧跟 `rateLimit`，不必故意放很后面。
- 启用 `envelope` 时套壳发生在 `flush`（整条中间件之后）；etag 签的是套壳前 body，与最终线上 body 可能不一致——属机制限制，单靠调顺序无法消除。
- nginx 反代不会给动态 JSON 算 ETag；API 仍靠 `@aomex/etag`。nginx 自带 etag 只覆盖它直接提供的静态文件。

## 不要做

- 在路由里堆 SQL / 事务 / 第三方 SDK 调用
- 只靠 `app.on('error')` 处理业务错误响应
- `combineServices` 直接传 Class，或再写已废弃的 `CombinedServices` 模块扩充
- 改完 Service 却忘了注册；或破坏现有 `declare module '@aomex/web'` 的 `Infer` 扩展
- 为已有能力再造一套（鉴权、缓存、cron、错误格式、logger）——先搜现有文件

## 动手前检查

- [ ] 新文件落在正确目录，命名符合扫描约定
- [ ] 接口有 `body`/`query`/`params`（若有入参）和 `response`
- [ ] 业务在 Service；路由只编排
- [ ] 新 Service 已 `combineServices` 注册；需启动初始化的进 `eager`
- [ ] 鉴权 / 文档 / 生产跳过等复用现有模式，不另起炉灶
- [ ] 若改了 `web.ts` `mount` 顺序：仍满足 compress→etag、文档→helmet、cors 靠外
