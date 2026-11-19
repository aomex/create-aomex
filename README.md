# create-aomex

交互式脚手架，用于生成基于 [aomex](https://aomex.js.org) 的 TypeScript 项目（Web + Console / Cron、可选 Prisma / Mongoose、Docker / 裸机部署等）。

脚手架要求 **Node.js `^22.22.2 || ^24.15.0 || >=26`**。

## 快速开始

用哪条命令启动，就会自动选用对应包管理器（也可用 `--pm` 覆盖）

```bash
pnpm create aomex
yarn create aomex
npm create aomex
```

按提示选择 ORM、认证、中间件等；生成后进入目录启动：

```bash
cd <project>
pnpm start   # 或 yarn start / npm start
```

生成项目根目录含 `AGENTS.md` → `aomex.md`，供 AI 按约定扩展代码。

## 非交互参数

所有可选项都可用 CLI 参数跳过询问（适合脚本 / CI）。未传的项仍会交互询问。

| 参数                    | 说明                                                                     | 示例                                              |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `--project`             | 项目目录名                                                               | `--project=my-api`                                |
| `--node`                | Node 版本（不传则交互选择 LTS，≥24）                                     | `--node=24.22.0`                                  |
| `--pm`                  | 包管理器（默认跟 create 命令走）                                         | `--pm=pnpm` \| `yarn` \| `npm`                    |
| `--orm`                 | ORM                                                                      | `--orm=prisma` \| `mongoose` \| `none`            |
| `--db`                  | Prisma 数据库（仅 `--orm=prisma`）                                       | `--db=mysql` \| `postgresql` \| …                 |
| `--auth`                | 认证策略，逗号多选；`none` 表示无                                        | `--auth=bearer,jwt` \| `--auth=none`              |
| `--web-plugins`         | 可选 Web 中间件（`cors` / `etag` / `helmet` / `response-time` 始终安装） | `--web-plugins=http-access-log,async-trace`       |
| `--docs`                | 文档 UI                                                                  | `--docs=swagger` \| `redoc` \| `scalar` \| `none` |
| `--logger`              | 日志出口，逗号多选                                                       | `--logger=console,file`                           |
| `--console-middlewares` | Console 插件；`cron` 始终安装，可追加                                    | `--console-middlewares=openapi`                   |
| `--lang`                | 默认语言（BCP 47）                                                       | `--lang=zh-CN`                                    |
| `--docker`              | 是否生成 Docker 生产部署产物（默认 `true`，不询问）                      | `--docker=true` \| `false`                        |
| `--tz` / `--timezone`   | 进程时区                                                                 | `--tz=Asia/Shanghai`                              |
| `--cluster`             | 集群方案（勿叠用）                                                       | `--cluster=none` \| `cluster-listen` \| `pm2`     |

示例：

```bash
pnpm create aomex@latest -- \
  --project=HelloAomex \
  --pm=pnpm \
  --orm=prisma \
  --db=mysql \
  --auth=bearer \
  --docs=swagger \
  --lang=zh-CN \
  --docker=true \
  --tz=Asia/Shanghai \
  --web-plugins=http-access-log,async-trace \
  --logger=console,file \
  --cluster=none
```

## 本地开发本仓库

```bash
pnpm install
pnpm tsx src/index.ts                  # 交互创建
pnpm cli                               # 一键非交互示例（见 package.json scripts.cli）
pnpm test                              # 快照测试
pnpm test:update                       # 更新 example/* 快照
pnpm build                             # 产出 dist（发布用）
```

也可直接进入 `example/` 下某个快照目录安装并启动（与真实生成项目相同）。`.env*` 未入库，需先从示例复制：

```bash
cd example/docs-ui-scalar   # 或 recommended / kitchen-sink / …
cp .env.example .env
pnpm install
pnpm start
```

- 生成逻辑：`src/select-options.ts`、`src/generators.ts`、`src/project-files.ts`
- 写入用户项目的 AI 指引：只改 [`src/skills/aomex-skill.ts`](./src/skills/aomex-skill.ts)
- 示例快照：`example/`（由测试生成，勿手改当源）

## 相关链接

- aomex 文档：https://aomex.js.org
- 仓库：https://github.com/aomex/create-aomex

## License

MIT
