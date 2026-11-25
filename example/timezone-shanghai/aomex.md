# aomex 开发指引（给 AI）

官方文档：https://aomex.js.org  
包名用 `@aomex/common` / `@aomex/web` / `@aomex/console`。升级任一 `@aomex/*` 时，`package.json` 里所有 `@aomex/*` 须锁同一版本号，不要只升其中一个。

**用法**：先读现有 `src/` 再改。本文只说明「放哪、怎么写、场景选什么」；脚手架已生成的 `web.ts` / `cli.ts` / 全局插件配置通常不用动。

## 找包：先 aomex / aomex-contrib

需要中间件、鉴权、缓存适配、登录厂商、OpenAPI UI、日志出口、限流压缩等能力时，**先在下列仓库找现成包**，不要一上来就 `npm search` 第三方或自写一套：

| 仓库                                                          | 范围                                                                                                              | 包名               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------ |
| [aomex/aomex](https://github.com/aomex/aomex)                 | 框架核心与官方插件（Web / Console / auth / cache / cron / cors / compress / rate-limit / OpenAPI·AsyncAPI UI 等） | `@aomex/*`         |
| [aomex/aomex-contrib](https://github.com/aomex/aomex-contrib) | 周边集成（OAuth2 厂商、Google GIS、微信小程序登录等）                                                             | `@aomex-contrib/*` |

**怎么查**：

1. 打开仓库 README / `packages/` 目录，或文档站 https://aomex.js.org 对照能力表。
2. 项目里已装的 `@aomex/*` / `@aomex-contrib/*`（及 `web.ts` 注释模板）优先复用；未装再 `pnpm add`。
3. **只有**官方仓没有对应能力时，再考虑通用 npm 包或自写 Service / middleware。
4. 新增 `@aomex/*`：版本必须与现有 `@aomex/*` **同一号**；`@aomex-contrib/*` 按各包独立版本，勿与 `@aomex/*` 混锁。

## 东西放哪

| 你要做的事                         | 放这里                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| 新 HTTP 接口                       | `src/routers/<领域>.router.ts`（`*.router.ts` 才会被扫描）                                |
| 新 WebSocket 事件                  | `src/channels/<名>.channel.ts`（`*.channel.ts`；挂到 `src/ws.ts`；AsyncAPI 从这里生成）   |
| 向已连接客户端推送                 | 业务侧 `import { ws } from '@/ws'`，用 `ws.room` / `ws.all`（勿在 console 进程再 attach） |
| 可复用的请求级逻辑                 | `src/middleware/<名>.md.ts`，再挂到 Router / 接口 `mount`                                 |
| 业务逻辑、DB、外部 API、业务缓存   | `src/services/<名>.service.ts`（`export default class`），并在 `services/index.ts` 注册   |
| 共享缓存 / `@remember`             | `src/services/cache.service.ts`（`export const cache`）                                   |
| 应用日志                           | `src/services/logger.service.ts`（`export const logger`）                                 |
| 入参/出参校验复用、Prisma override | `src/schemas/`（可 `*.schema.ts`）                                                        |
| 环境相关配置                       | `src/configs/`（不要把密钥硬编码进路由）                                                  |
| 一次性/运维指令、定时任务          | `src/commanders/<名>.cmd.ts`（定时用 `cron()` 挂在指令上，由已有 `cli.ts` 调度）          |
| Mongoose 模型（若选了 mongoose）   | `src/models/` + `defineMongooseModel`（与路由共用 `rule`）                                |

路径别名：`@/*` → `src/*`。

**分层**：Router 只做校验 + 鉴权挂载 + 调 Service + `ctx.send` / `ctx.throw`；SQL / 事务 / 业务缓存 / 第三方调用进 Service。不要自己 `new XxxService()`。

## 路由怎么写

```ts
import { body, params, query, response, Router } from '@aomex/web';
import { rule } from '@aomex/common';
import { services } from '@/services';
// 若项目有鉴权：import { auth } from '@/middleware/auth.md';

export const router = new Router({
  prefix: '/articles',
  docs: { tags: ['Article'] }, // OpenAPI 侧栏分组；不写则默认用文件名，可读性差
  // 整组要登录：mount: [auth.authenticate('bearer')],
});

router.get('/', {
  docs: { summary: '文章列表' },
  mount: [
    query({
      page: rule.int().min(1).default(1),
      size: rule.int().min(1).max(50).default(20),
    }),
    response({
      statusCode: 200,
      content: {
        total: rule.int(),
        items: rule.array({ id: rule.int(), title: rule.string() }),
      },
    }),
  ],
  action: async (ctx) => {
    const result = await services.article.list(ctx.query);
    ctx.send(result);
  },
});

router.post('/', {
  docs: { summary: '创建文章' },
  mount: [
    body({ title: rule.string(), content: rule.string() }),
    response({
      statusCode: 201,
      content: rule.object({ id: rule.int(), title: rule.string() }),
    }),
    response({ statusCode: 400 }),
  ],
  action: async (ctx) => {
    const article = await services.article.create(ctx.body);
    ctx.send(201, article);
  },
});

router.get('/:id', {
  docs: { summary: '文章详情' },
  mount: [
    params({ id: rule.int() }),
    response({ statusCode: 200, content: rule.object({ id: rule.int() }) }),
    response({ statusCode: 404 }), // 声明后 ctx.throw(404) 才是合法出口
  ],
  action: async (ctx) => {
    const article = await services.article.findById(ctx.params.id);
    if (!article) return ctx.throw(404);
    ctx.send(article);
  },
});

router.delete('/:id', {
  docs: { summary: '删除文章' },
  mount: [params({ id: rule.int() }), response({ statusCode: 204 }), response({ statusCode: 404 })],
  action: async (ctx) => {
    const ok = await services.article.remove(ctx.params.id);
    if (!ok) return ctx.throw(404);
    ctx.send(204); // 无 body，别塞 {}
  },
});
```

要点：

- 入参：`body` / `query` / `params`；出参：`response`（OpenAPI 与类型依赖它们）。可多次挂 `response`（成功 + 404/400 等）。
- 同前缀共享中间件：`new Router({ prefix, mount })`；单接口放方法级 `mount`。公开接口与需登录接口**拆文件**，别在已鉴权 Router 里到处 skip。
- 字面量路径优先于 `:param`（`/articles/count` 不会被 `/:id` 吃掉）。路径参数键名须与 `params()` 字段一致；不挂 `params` 时全是字符串。
- 文件必须 `export const router`，文件名 `*.router.ts`。
- OpenAPI：`Router({ docs: { tags } })` + 方法级 `docs: { summary }`；方法级 `tags` 会**整份替换** Router 的 tags（浅合并，不数组合并）。隐藏接口：`docs: { showInOpenapi: false }`。半成品可 `disabled: true`（或按环境变量）不注册。
- 同路径多动词（webhook）：`router.customize(['GET', 'POST'], '/webhook', { ... })`。

### 发响应 / 抛错

| 意图                       | 写法                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| 成功 200                   | `ctx.send(data)`                                                                     |
| 成功其它 2xx               | `ctx.send(201, data)`；204 用 `ctx.send(204)`                                        |
| 业务失败                   | `ctx.throw(404)` / `ctx.throw(403, { code: 'FORBIDDEN' })` / `ctx.throw(400, 'msg')` |
| 重定向                     | `ctx.redirect(302, url)`（先声明对应 `response`）                                    |
| 特殊媒体类型               | `response({ contentType: 'application/pdf' \| 'text/event-stream', ... })`           |
| 全站开了 envelope 仍要裸写 | 对应 `response({ skipEnvelope: true })`（下载、SSE 等）                              |

不要用 `send(404)` 冒充错误；错误 JSON 形状已由脚手架的 `format-error.md.ts` 统一，业务里只 `throw`。改信封形态才去动那个文件，不要靠 `app.on('error')`。某前缀要另一套错误字段：在该 `Router({ mount: [formatError(...)] })` 再挂一层（洋葱内侧先接住）。

`response()` 只约束类型与 OpenAPI，**不会**在运行时再验 `send` 的 body。

## 校验（rule / schema）

- `rule.array({ ... })` 可直接传对象字段表，不必再包 `rule.object`。
- `rule.object({ ... })` 可深度嵌套对象/数组字面量。
- `rule.enum(MyEnum)` **可直接传 TS enum**，不要手抄成员数组。
- 复用字段表用 `schema({...})`，放 `src/schemas/`；路由上 `body(userSchema.omit('id'))`、`body(userSchema.pick(...).partial())`（PATCH）。
- `optional()` = 可不传（`undefined`）；`nullable()` = 可 `null`（PATCH 清空字段）；`default(v)` = 没传则用默认。三者别混。
- **query 不要 `strict()`**（查询串几乎全是字符串，strict 易整页 400）。
- `transform(fn)` 只做整形（CSV 拆分、大小写）；权限/配额放 Service，别塞 transform。
- 类型：`type User = Validator.Infer<typeof userSchema>`，与 `ctx.body` 对齐；别再手写一份 interface。
- OpenAPI 组件名：`schema(...).asName('User')`；`pick`/`omit`/`extend` 后的新形状要各自再 `asName`。
- 根级数组体：`body(rule.array(rule.int()))`。互斥形状：`body(rule.oneOf([rule.object({ type: rule.literal('a'), ... }), ...]))`（恰好一种命中）。
- `partial()` 后空 `{}` 也能过校验——若必须「至少改一个字段」，在 action / Service 里再判。

```ts
import { schema, rule, type Validator } from '@aomex/common';

export const userSchema = schema({
  id: rule.int(),
  name: rule.string().trim().length({ min: 1 }),
  email: rule.email(),
  password: rule.string().length({ min: 8 }),
}).asName('User');

export type User = Validator.Infer<typeof userSchema>;

// 注册：body(userSchema.omit('id'))
// 登录：body(userSchema.pick('email', 'password'))
// PATCH：body(userSchema.pick('name', 'email').partial())
```

### 文件上传

`rule.file()` 走 multipart；过关后 `ctx.body.avatar` 有 `filepath` / `hash` / `mimetype` 等。**本轮响应结束前**务必搬走或上传完，临时文件会被清掉。

```ts
body({
  name: rule.string(),
  avatar: rule.file().maxSize('2mb').mimeTypes('image/*'),
  // 多文件：photos: rule.array(rule.file()).length({ max: 5 }),
}),
```

### Prisma 字段收紧

生成器偏宽松；业务契约用 `definePrismaSchema` 的 `input` / `output` **omit / extend**（藏密码、收紧 Json、Int→业务 enum）：

```ts
import { rule, Validator } from '@aomex/common';
import { definePrismaSchema } from '@aomex/prisma';
import { generated } from '@/generated/aomex/prisma';

const articleTags = rule.array(rule.string());

export const { prismaInput, prismaOutput, prismaEnum } = definePrismaSchema(generated, {
  article: {
    input: (s) => s.omit('id', 'created_at', 'updated_at').extend({ tags: articleTags }),
    output: (s) => s.extend({ tags: articleTags }),
  },
});

declare global {
  namespace PrismaJson {
    type ArticleTags = Validator.Infer<typeof articleTags>;
  }
}
```

- Json：`rule` + `Validator.Infer` → `PrismaJson`；schema.prisma 用 `/// [TypeName]`。不要手写与 validator 脱节的 interface。
- 路由：`body(prismaInput.article.pick(...))` / `response({ content: prismaOutput.article })`；改表后先 `prisma generate`。
- 可空 Json 写入：进 Service 前把 JS `null` 转成 `DbNull`/`JsonNull`（或接口不收 null）。

### Mongoose（若项目用了）

`defineMongooseModel` 与路由共用同一套 `rule`；`import '@aomex/mongoose'` 后才有 `rule.mongoObjectId()` 等。对外 DTO 用 `response` / schema pick，别把文档原样 `ctx.send`（易泄露仅 DB 字段）。

## 服务

```ts
import { Service } from '@aomex/common';

export default class ArticleService extends Service {
  // 可选：protected override async onInit() / onDestroy()
  async findById(id: number) {
    // 查库 / 调第三方…
  }
}
```

在 `services/index.ts` 注册（**必须**动态 import；测试注入才用 `async () => Fake`）：

```ts
combineServices({
  article: () => import('./article.service.js'),
  // 可选 eager: ['xxx'] —— 进程起来就要 onInit 的放这里
});
```

`services.xxx` 是**懒加载代理**：从路由 / 其它 Service / commander 调用时**一律 `await`**（类型已是 `Promise`），即使 Class 里写的是同步方法。Service **内部** `this.bar()` 仍同步。互调：`import { services } from '@/services'` → `await services.other....`。`onInit` / `onDestroy` / private **不会**出现在 `services.xxx` 类型上。

Prisma/Mongoose 连接跟现有 `*.service.ts` + `registerLifecycle`；连接串读 `configs.database`（各环境写入 `DATABASE_URL`）。**不要**再塞进 `combineServices`。

## 鉴权

`auth.md.ts` **始终生成**。未勾选任何 Auth 策略时 `strategies: {}`；有勾选则对应策略启用，其余以注释保留，解开即可用。

- 整组私有 API：`new Router({ mount: [auth.authenticate('<策略名>')] })`；策略名看 `auth.md.ts` 的 `strategies` key（`bearer` / `jwt` / `apiKey` / `session`）。
- 单接口更严：`auth.authenticate(name).authorize(...)` 或 `auth.authorize(name, ...)`。先认证再授权；未登录 **401**，已登录权限不够 **403**。
- 通过后读身份：`ctx.auth.bearer`（或 jwt / apiKey / session）——名字与策略 key 一致；Session 为 `ctx.auth.session.data`。
- **Bearer / JWT**：登录路由不要挂 authenticate；签发用 `auth.strategy(name).signature(...)`，Bearer 会话写入 `services.passport`（见 `passport.service.ts`）。
- **Session**（Cookie 会话）：`store: cache`（共享 `cache.service.ts`）；登录 `await auth.strategy('session').login(ctx, stored)`；登出 `logout(ctx)`；登录后建议 `regenerateSessionId(ctx)` 防 fixation。启用 Session 时**必须**同时：
  1. 安装并挂载 `@aomex/csrf`：`pnpm add @aomex/csrf`，在 `web.ts` 的 `mount` 里加 `csrf()`（脚手架可选 Web 中间件；与 `cors` 同开时放在 `cors` 之后）。
  2. 配置 `cors`：解开 `credentials: true`，并**显式**配置 `origin` 为前端域名白名单（开启凭证时禁止 `*` / 盲反射 Origin，见 `web.ts` 注释）。
- **OAuth2 / GIS / 微信登录**：**不是** `auth.authenticate` 策略。脚手架首屏提供 `oauth2-client` / Google GIS / 微信系；选 `oauth2-client` 后再多选厂商（**可不选**则只装 `@aomex/oauth2-client`，不生成厂商文件）。选了厂商后，未启用的以注释写入。GIS / 微信为首屏直选。凭证经 `configs.oauth.*`；厂商 `store` 传共享 `cache`。详见 [aomex-contrib](https://github.com/aomex/aomex-contrib)。
- CSRF：双提交 Cookie；前端读 Cookie `csrfToken`，写入请求头 `x-csrf-token`；服务端可用 `ctx.csrfToken`。GET/HEAD/OPTIONS 默认跳过。跨域时浏览器会预检该头，不写 `allowHeaders` 时 cors 默认镜像预检头即可。
- 少数路径免鉴权优先拆公开 Router；临时绕过可用 `.skip(ctx => ...)`（**不改类型**，action 里仍要处理未登录）。

## 缓存与日志

共享 `cache` / `logger`（`src/services/cache.service.ts` / `logger.service.ts`）。**业务缓存写在各自领域 Service**（如 passport），不要往 `cache.service.ts` 堆方法。

- 读写：`import { cache } from '@/services/cache.service'`；键用 `cache.key('前缀', 'v1').key(id)` / `.keyHash(...)`，发版改版本号即可整批失效。
- 方法级缓存：`@remember(ms|'1 minute')` / `@remember({ duration, key, defaultValue })`——**只挂读多写少**；写库/发短信/扣库存别挂。返回 `null` 默认不写缓存。
- 幂等 / 抢锁：`cache.setNX`；计数窗口：`cache.increment` + `cache.expire`；短时单飞：`cache.singleFlight`。
- 插件复用：session / abuse / cron / oauth2 等 `store: cache`，不要再 `new Caching(...)`。
- 业务日志：`import { logger } from '@/services/logger.service'` 或 `ctx.logger`（info/warn/error/fatal）；别 `console.log` 打生产。密钥走 `configs.logger.*`。

## SSE（服务端推送）

进度、通知、行情等单向推送用 `ctx.sse()`，**不要**同一路由再 `ctx.send` JSON。优先 `stream`（客户端断开 `signal` 会 abort）：

```ts
router.get('/events', {
  mount: [
    response({
      statusCode: 200,
      contentType: 'text/event-stream',
      content: rule.string(),
      skipEnvelope: true, // 若开了 envelope
    }),
  ],
  action: async (ctx) => {
    const sse = ctx.sse({ retry: 3_000, heartbeat: 10_000 }); // 经反代建议开 heartbeat
    await sse.stream(async (emit, signal) => {
      for await (const item of watchEvents({ after: sse.lastEventId, signal })) {
        emit({ id: String(item.id), event: 'item', data: item });
      }
    });
  },
});
```

## 场景 → 用什么

| 场景                           | 做法                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 缺资源 / 无权限 / 业务拒绝     | `ctx.throw(404\|403\|400, …)` + 对应 `response({ statusCode })`                                                              |
| 需要登录                       | `auth.authenticate('<策略>')`（Router 或方法级 `mount`）                                                                     |
| 读写缓存 / 方法级缓存          | 领域 Service 调 `cache`；`@remember`（只挂查询）                                                                             |
| 业务日志                       | `logger` / `ctx.logger`（info/warn/error/fatal）；别 `console.log` 打生产                                                    |
| 入参复用 / PATCH               | `schema` + `pick`/`omit`/`extend`/`partial`                                                                                  |
| 上传文件                       | `rule.file()` + 响应结束前搬走                                                                                               |
| 互斥 JSON / 根级数组体         | `rule.oneOf([...])` / `body(rule.array(...))`                                                                                |
| Prisma 模型校验                | `body(prismaInput.x…)` / `response({ content: prismaOutput.x })`                                                             |
| 新业务 Service                 | 新文件 + `combineServices` 动态 import；需启动初始化的进 `eager`                                                             |
| OpenAPI 分组 / 摘要            | `docs.tags` / `docs.summary`；隐藏用 `showInOpenapi: false`                                                                  |
| 服务端推送                     | `ctx.sse()` + `stream`（见上节）                                                                                             |
| 控制台指令 / 定时              | 见下节                                                                                                                       |
| 改错误 JSON 形态               | 仅改 `format-error.md.ts`（或 Router 内再挂一层）                                                                            |
| 改全局中间件 / envelope / 语言 | 仅改 `web.ts`（先看注释；compress / rate-limit 未启用时以注释保留并优先 nginx；compress 须在 etag 前，文档 UI 在 helmet 前） |

## 指令与定时任务

定时建立在指令上：先写 `Commander`，要自动跑再 `mount: [cron(...)]`。`cli.ts` 已有 `crons` 收集调度，**不要**自己 `setInterval`。

```ts
// src/commanders/report.cmd.ts
import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/common';
import { cron } from '@aomex/cron'; // 需要定时时再引

export const commander = new Commander({ prefix: 'report:' });

commander.create('daily', {
  docs: { summary: '日报' },
  mount: [
    options({ verbose: rule.boolean().default(false) }, { verbose: ['v'] }),
    cron({ hour: '9', minute: '0' }), // 或 cron('0 9 * * *')；可挂多个 + args
  ],
  action: async (ctx) => {
    await services.report.runDaily(ctx.options);
  },
});

// 旧名并存：commander.create(['flush', 'clear'], { ... })
// 特性开关：disabled: process.env['FEATURE_X'] !== '1'
```

- 文件 `*.cmd.ts`，`export const commander`。手动跑：`pnpm aomex report:daily`（或项目包管理器等价命令）；`pnpm aomex -h` 看列表。
- 长循环听停：`while (ctx.cron.isAlive()) { … }`（`aomex cron:stop` 后变 false）。本轮窗内做完就收：查 `ctx.cron.isCurrentEpoch()` 再 break。
- 默认 `concurrent: 1` 防重叠；长任务跨点可加大 `concurrent` / `waitingTimeout`。定时参数走同一套 `options()`，用 `cron({ ..., args: ['--verbose'] })` 传入。

## 中间件（自写业务中间件时）

```ts
import { middleware } from '@aomex/common';

export const withUser = middleware.web<{ userId: number }>(async (ctx, next) => {
  ctx.userId = 1;
  await next(); // 必须 await，截断可不调
});
```

- 仅 Web：`middleware.web`；Web+Console 共用：`middleware.mixin`。往 ctx 挂字段务必写泛型，下游才有类型。
- 假定上游已挂某中间件、只借类型：`middleware.dependsOn(上游).web(...)`（运行时不会替你执行上游；挂载时仍要把上游放前面）。
- 按条件跳过：`.skip(boolean \| (ctx) => boolean)`（如测试环境关某层）；skip **不改** Props 类型。
- 全局顺序在 `web.ts`，一般不用动。

## 不要做

- 在路由里堆 SQL / 事务 / 第三方 SDK
- 自己 `new Service()`，或不走 `combineServices` 动态 import（正式代码写成 `async () => Class` 也等于没懒加载）
- 用 `send(4xx)` 代替 `throw`；或再造一套错误/鉴权/缓存/cron/logger
- 往 `cache.service.ts` 堆业务方法，或再 `new Caching`
- 官方仓已有能力却去装无关第三方（先查 [aomex](https://github.com/aomex/aomex) / [aomex-contrib](https://github.com/aomex/aomex-contrib)）
- 改完 Service 忘了注册；破坏现有 `declare module '@aomex/web'` 的 Infer 扩展
- 登录接口挂 `authenticate`（会永远 401）
- SSE / 文件下载开了 envelope 却忘了 `skipEnvelope`
- `@remember` 挂有副作用的方法
- 只升级部分 `@aomex/*`，导致版本不一致

## 动手前检查

- [ ] 新能力是否已有 `@aomex/*` / `@aomex-contrib/*`（先查两仓再装别的）
- [ ] 新文件目录与命名符合扫描约定（`*.router.ts` / `*.cmd.ts` / `export default class`）
- [ ] 有入参则挂 `body`/`query`/`params`；有出参则挂 `response`（含会 throw 的状态码）
- [ ] OpenAPI：`tags` + `summary`（或有意 `showInOpenapi: false`）
- [ ] 业务在 Service；路由只编排；`await services.xxx`
- [ ] 业务缓存写在领域 Service；新 Service 已注册；需启动即连的进 `eager`
- [ ] 鉴权 / 缓存 / 日志 / 错误格式复用现有文件，不另起炉灶
