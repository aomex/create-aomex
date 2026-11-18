# snapshot-demo

Node.js server scaffolded with [aomex](https://aomex.js.org). Read the docs before coding.

## Stack

| Item            | Value   |
| --------------- | ------- |
| Package manager | pnpm    |
| ORM             | None    |
| Auth            | None    |
| Docs UI         | None    |
| Deploy          | Docker  |
| Timezone        | UTC     |
| Cron            | Enabled |

## Prerequisites

1. Node.js version: `package.json` → `engines.node`
2. Install [Docker](https://www.docker.com/) or [OrbStack](https://orbstack.dev/) (local `docker-compose.yml` for DB / Redis)
3. Copy env: `cp .env.example .env` (edit as needed)
4. Install deps:

```bash
pnpm install
```

## Start locally

```bash
pnpm start
```

This will:

- `docker compose up` local dependencies
- start HTTP (`src/web.ts`)
- start cron (`aomex cron:start`)

## Scripts

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `pnpm start`              | Start local deps + HTTP (and cron) |
| `pnpm deploy:integration` | Deploy to integration              |
| `pnpm deploy:production`  | Deploy to production               |
| `pnpm deploy:api`         | Rebuild/restart api only           |
| `pnpm deploy:cron`        | Rebuild/restart cron only          |
| `pnpm cron:stats`         | Show cron job stats                |
| `pnpm cron:stop`          | Stop cron jobs                     |

## Deploy

Integration:

```bash
pnpm deploy:integration
```

Production:

```bash
pnpm deploy:production
```

See `Dockerfile.*` and `docker-compose-*.yml` for images and orchestration.

## Structure

```
.
├─ .husky/                            Git hooks
├─ .vscode/                           Editor recommendations
├─ AGENTS.md                          AI entry → aomex-skill.md
├─ aomex-skill.md                     aomex best practices for AI
├─ scripts/                           Start / deploy scripts
├─ src/
   ├─ commanders/                   Console commands
   ├─ configs/                      Environment configs
   ├─ middleware/                   Middleware
   ├─ routers/                      HTTP routers
   ├─ services/                     Business services
   ├─ cli.ts                        Console entry
   └─ web.ts                        HTTP entry
├─ .env.example                       Env example
├─ docker-compose.yml                 Local deps (DB / Redis)
├─ docker-compose-*.yml               Integration / production compose
├─ Dockerfile.*                       Integration / production images
├─ package.json                       Dependencies and scripts
└─ tsconfig.json                      TypeScript config
```
