# snapshot-demo

基于 [aomex](https://aomex.js.org) 的 Node.js 服务端项目。开发前请先阅读官方文档。

## 技术选型

| 项       | 值              |
| -------- | --------------- |
| 包管理器 | pnpm            |
| ORM      | Prisma（mysql） |
| 认证     | Bearer Token    |
| 文档 UI  | Swagger UI      |
| 部署方式 | Docker          |
| 时区     | UTC             |
| 定时任务 | 已启用          |

## 环境准备

1. Node.js 版本见 `package.json` → `engines.node`
2. 安装 [Docker](https://www.docker.com/) 或 [OrbStack](https://orbstack.dev/)（本地 `docker-compose.yml` 用于数据库 / Redis）
3. 复制环境变量：`cp .env.example .env`（按需修改）
4. 安装依赖：

```bash
pnpm install
```

## 本地启动

```bash
pnpm start
```

默认会：

- `docker compose up` 拉起本地依赖
- 执行 `prisma generate` / migrate 或 db push
- 启动 HTTP 服务（`src/web.ts`）
- 启动 cron（`aomex cron:start`）

## API 文档

启动后访问 `src/middleware/docs.md.ts` 中配置的 `uriPrefix`（**生产环境默认关闭**）。

## 常用脚本

| 命令                      | 说明                               |
| ------------------------- | ---------------------------------- |
| `pnpm start`              | 拉起本地依赖并启动 HTTP（及 cron） |
| `pnpm deploy:integration` | 部署到集成环境                     |
| `pnpm deploy:production`  | 部署到生产环境                     |
| `pnpm deploy:api`         | 仅重建并重启 api 容器              |
| `pnpm deploy:cron`        | 仅重建并重启 cron 容器             |
| `pnpm cron:stats`         | 查看定时任务状态                   |
| `pnpm cron:stop`          | 停止定时任务                       |

## 部署

集成环境：

```bash
pnpm deploy:integration
```

生产环境：

```bash
pnpm deploy:production
```

镜像构建与容器编排见 `Dockerfile.*`、`docker-compose-*.yml`。

## 目录结构

```
.
├─ .husky/                            Git hooks
├─ .vscode/                           编辑器推荐与设置
├─ AGENTS.md                          AI 常驻入口（指向 aomex.md）
├─ aomex.md                           aomex 最佳实践（给 AI）
├─ prisma/                            数据表结构与 migrations
├─ scripts/                           启动与部署脚本
├─ src/
   ├─ commanders/                   控制台指令
   ├─ configs/                      多环境配置
   ├─ constants/                    常量
   ├─ middleware/                   中间件
   ├─ routers/                      HTTP 路由
   ├─ schemas/                      Prisma 验证器入口
   ├─ generated/                    Prisma / aomex 生成代码
   ├─ services/                     业务服务
   ├─ cli.ts                        Console 入口
   └─ web.ts                        HTTP 入口
├─ .env.example                       环境变量示例
├─ docker-compose.yml                 本地依赖（数据库 / Redis）
├─ docker-compose-*.yml               集成 / 生产部署编排
├─ Dockerfile.*                       集成 / 生产镜像
├─ prisma.config.ts                   Prisma 配置
├─ package.json                       依赖与脚本
└─ tsconfig.json                      TypeScript 配置
```
