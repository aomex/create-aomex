# snapshot-demo

基于 [aomex](https://aomex.js.org) 的 Node.js 服务端项目。开发前请先阅读官方文档。

## 技术选型

| 项       | 值     |
| -------- | ------ |
| 包管理器 | pnpm   |
| ORM      | 无 ORM |
| 认证     | 无     |
| 文档 UI  | 无     |
| 部署方式 | PM2    |
| 时区     | UTC    |
| 定时任务 | 已启用 |

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
- 启动 HTTP 服务（`src/web.ts`）
- 启动 cron（`aomex cron:start`）

## 常用脚本

| 命令                      | 说明                               |
| ------------------------- | ---------------------------------- |
| `pnpm start`              | 拉起本地依赖并启动 HTTP（及 cron） |
| `pnpm deploy:integration` | 同步环境变量并用 tsx 启动（集成）  |
| `pnpm deploy:production`  | 同步环境变量并用 tsx 启动（生产）  |
| `pnpm pm2:start`          | PM2 启动（tsx 直接跑 src/web.ts）  |
| `pnpm pm2:reload`         | PM2 零停机重载                     |
| `pnpm pm2:stop`           | PM2 停止                           |

## 部署

集成环境：

```bash
pnpm deploy:integration
```

生产环境：

```bash
pnpm deploy:production
```

会同步 `.env.*`，并用 PM2 + tsx 直接跑 `src/web.ts`（与本地一致，不编译）。

## 目录结构

```
.
├─ .husky/                            Git hooks
├─ .vscode/                           编辑器推荐与设置
├─ AGENTS.md                          AI 常驻入口（指向 aomex.md）
├─ aomex.md                           aomex 最佳实践（给 AI）
├─ scripts/                           启动与部署脚本
├─ src/
   ├─ commanders/                   控制台指令
   ├─ configs/                      多环境配置
   ├─ middleware/                   中间件
   ├─ routers/                      HTTP 路由
   ├─ services/                     业务服务
   ├─ cli.ts                        Console 入口
   └─ web.ts                        HTTP 入口
├─ .env.example                       环境变量示例
├─ docker-compose.yml                 本地依赖（数据库 / Redis）
├─ ecosystem.config.cjs               PM2 进程配置
├─ package.json                       依赖与脚本
└─ tsconfig.json                      TypeScript 配置
```
