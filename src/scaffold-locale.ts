import type { DefaultLanguage } from './i18n-languages';
import type {
  AuthStrategy,
  ClusterStrategy,
  DocsUI,
  Orm,
  PackageManager,
  PrismaDatabase,
  ScaffoldOptions,
} from './types';

export const isChineseLanguage = (language: DefaultLanguage) =>
  language.startsWith('zh');

/** 脚手架写入模板的文案：zh-* 用中文，其余用英文 */
export const scaffoldText = (language: DefaultLanguage) => {
  if (isChineseLanguage(language)) {
    return {
      slowTrace: '链路追踪',
      articleNotFound: '文章不存在',
    } as const;
  }

  return {
    slowTrace: 'Slow request',
    articleNotFound: 'Article not found',
  } as const;
};

type ReadmeOpts = {
  projectName: string;
  language: DefaultLanguage;
  packageManager: PackageManager;
  docsUI: DocsUI;
  hasCron: boolean;
  orm: Orm;
  prismaDatabase?: PrismaDatabase;
  auth: AuthStrategy;
  hasCookie: boolean;
  docker: boolean;
  timezone: string;
  cluster: ClusterStrategy;
};

const ormLabel = (orm: Orm, db?: PrismaDatabase, zh?: boolean): string => {
  if (orm === 'prisma') {
    return zh ? `Prisma（${db ?? 'mysql'}）` : `Prisma (${db ?? 'mysql'})`;
  }
  if (orm === 'mongoose') return 'Mongoose';
  return zh ? '无 ORM' : 'None';
};

const authLabel = (auth: AuthStrategy, zh?: boolean): string => {
  switch (auth) {
    case 'bearer':
      return 'Bearer Token';
    case 'jwt':
      return 'JWT';
    case 'api-key':
      return 'API Key';
    case 'none':
      return zh ? '无' : 'None';
  }
};

const docsLabel = (docs: DocsUI): string => {
  if (docs === 'swagger') return 'Swagger UI';
  if (docs === 'redoc') return 'Redoc';
  return '';
};

const buildTree = (opts: ReadmeOpts, zh: boolean): string => {
  const lines: string[] = ['.'];
  const note = (path: string, desc: string) => `├─ ${path.padEnd(34)} ${desc}`;

  lines.push(
    note('.husky/', zh ? 'Git hooks' : 'Git hooks'),
    note('.vscode/', zh ? '编辑器推荐与设置' : 'Editor recommendations'),
    note(
      'AGENTS.md',
      zh ? 'AI 常驻入口（指向 aomex-skill.md）' : 'AI entry → aomex-skill.md',
    ),
    note(
      'aomex-skill.md',
      zh ? 'aomex 最佳实践（给 AI）' : 'aomex best practices for AI',
    ),
  );

  if (opts.orm === 'prisma') {
    lines.push(
      note('prisma/', zh ? '数据表结构与 migrations' : 'Schema and migrations'),
    );
  }

  lines.push(
    note('scripts/', zh ? '启动与部署脚本' : 'Start / deploy scripts'),
  );
  lines.push(zh ? '├─ src/' : '├─ src/');
  lines.push(
    `   ├─ commanders/                   ${zh ? '控制台指令' : 'Console commands'}`,
  );
  lines.push(
    `   ├─ configs/                      ${zh ? '多环境配置' : 'Environment configs'}`,
  );
  if (opts.hasCookie) {
    lines.push(
      `   ├─ constants/                    ${zh ? '常量' : 'Constants'}`,
    );
  }
  lines.push(
    `   ├─ middleware/                   ${zh ? '中间件' : 'Middleware'}`,
  );
  if (opts.orm === 'mongoose') {
    lines.push(
      `   ├─ models/                       ${zh ? 'Mongoose 模型' : 'Mongoose models'}`,
    );
  }
  lines.push(
    `   ├─ routers/                      ${zh ? 'HTTP 路由' : 'HTTP routers'}`,
  );
  if (opts.orm === 'prisma') {
    lines.push(
      `   ├─ schemas/                      ${zh ? 'Prisma 验证器入口' : 'Prisma validator entry'}`,
    );
    lines.push(
      `   ├─ generated/                    ${zh ? 'Prisma / aomex 生成代码' : 'Generated Prisma / aomex code'}`,
    );
  }
  lines.push(
    `   ├─ services/                     ${zh ? '业务服务' : 'Business services'}`,
  );
  lines.push(
    `   ├─ cli.ts                        ${zh ? 'Console 入口' : 'Console entry'}`,
  );
  lines.push(
    `   └─ web.ts                        ${zh ? 'HTTP 入口' : 'HTTP entry'}`,
  );

  lines.push(
    note('.env.example', zh ? '环境变量示例' : 'Env example'),
    note(
      'docker-compose.yml',
      zh ? '本地依赖（数据库 / Redis）' : 'Local deps (DB / Redis)',
    ),
  );

  if (opts.docker) {
    lines.push(
      note(
        'docker-compose-*.yml',
        zh ? '集成 / 生产部署编排' : 'Integration / production compose',
      ),
      note(
        'Dockerfile.*',
        zh ? '集成 / 生产镜像' : 'Integration / production images',
      ),
    );
  }

  if (opts.cluster === 'pm2') {
    lines.push(
      note('ecosystem.config.cjs', zh ? 'PM2 进程配置' : 'PM2 process file'),
    );
  }

  if (opts.orm === 'prisma') {
    lines.push(note('prisma.config.ts', zh ? 'Prisma 配置' : 'Prisma config'));
  }

  lines.push(
    note('package.json', zh ? '依赖与脚本' : 'Dependencies and scripts'),
    '└─ tsconfig.json'.padEnd(37) +
      (zh ? ' TypeScript 配置' : ' TypeScript config'),
  );

  return lines.join('\n');
};

const buildScriptsTable = (opts: ReadmeOpts, zh: boolean): string => {
  const pm = opts.packageManager;
  const rows: [string, string][] = [
    [
      `${pm} start`,
      zh
        ? '拉起本地依赖并启动 HTTP（及 cron）'
        : 'Start local deps + HTTP (and cron)',
    ],
  ];

  if (opts.docker) {
    rows.push(
      [
        `${pm} deploy:integration`,
        zh ? '部署到集成环境' : 'Deploy to integration',
      ],
      [
        `${pm} deploy:production`,
        zh ? '部署到生产环境' : 'Deploy to production',
      ],
      [
        `${pm} deploy:api`,
        zh ? '仅重建并重启 api 容器' : 'Rebuild/restart api only',
      ],
    );
    if (opts.hasCron) {
      rows.push([
        `${pm} deploy:cron`,
        zh ? '仅重建并重启 cron 容器' : 'Rebuild/restart cron only',
      ]);
      rows.push(
        [`${pm} cron:stats`, zh ? '查看定时任务状态' : 'Show cron job stats'],
        [`${pm} cron:stop`, zh ? '停止定时任务' : 'Stop cron jobs'],
      );
    }
  } else {
    rows.push(
      [
        `${pm} deploy:integration`,
        zh
          ? '同步环境变量并用 tsx 启动（集成）'
          : 'Sync env and start with tsx (integration)',
      ],
      [
        `${pm} deploy:production`,
        zh
          ? '同步环境变量并用 tsx 启动（生产）'
          : 'Sync env and start with tsx (production)',
      ],
    );
  }

  if (opts.cluster === 'pm2') {
    rows.push(
      [
        `${pm} pm2:start`,
        zh
          ? opts.docker
            ? 'PM2 启动（编译后的 src/web.js）'
            : 'PM2 启动（tsx 直接跑 src/web.ts）'
          : opts.docker
            ? 'PM2 start (built src/web.js)'
            : 'PM2 start (tsx src/web.ts)',
      ],
      [`${pm} pm2:reload`, zh ? 'PM2 零停机重载' : 'PM2 zero-downtime reload'],
      [`${pm} pm2:stop`, zh ? 'PM2 停止' : 'PM2 stop'],
    );
  }

  const head = zh
    ? `| 命令 | 说明 |\n| --- | --- |`
    : `| Command | Description |\n| --- | --- |`;
  return `${head}\n${rows.map(([c, d]) => `| \`${c}\` | ${d} |`).join('\n')}`;
};

export const generateReadme = (opts: {
  projectName: string;
  language: DefaultLanguage;
  packageManager: PackageManager | string;
  docsUI: DocsUI;
  /** @deprecated 使用 orm */
  hasPrisma?: boolean;
  hasCron: boolean;
  orm?: Orm;
  prismaDatabase?: PrismaDatabase;
  auth?: AuthStrategy;
  docker?: boolean;
  timezone: string;
  cluster?: ClusterStrategy;
}): string => {
  const zh = isChineseLanguage(opts.language);
  const pm = opts.packageManager as PackageManager;
  const orm: Orm = opts.orm ?? (opts.hasPrisma ? 'prisma' : 'none');
  const docker = opts.docker ?? true;
  const cluster = opts.cluster ?? 'none';
  const readme: ReadmeOpts = {
    projectName: opts.projectName,
    language: opts.language,
    packageManager: pm,
    docsUI: opts.docsUI,
    hasCron: opts.hasCron,
    orm,
    prismaDatabase: opts.prismaDatabase,
    auth: opts.auth ?? 'none',
    hasCookie: opts.auth === 'bearer' || opts.auth === 'jwt',
    docker,
    timezone: opts.timezone,
    cluster,
  };

  const docsName = docsLabel(opts.docsUI);
  const docsFile = opts.docsUI === 'redoc' ? 'redoc.md.ts' : 'swagger.md.ts';

  const bareDeployHintZh =
    cluster === 'pm2'
      ? '会同步 `.env.*`，并用 PM2 + tsx 直接跑 `src/web.ts`（与本地一致，不编译）。'
      : '会同步 `.env.*`，并用 tsx 直接跑 `src/web.ts`（与本地一致，不编译）。';
  const bareDeployHintEn =
    cluster === 'pm2'
      ? 'Syncs `.env.*`, then PM2 + tsx runs `src/web.ts` (same as local, no compile).'
      : 'Syncs `.env.*`, then tsx runs `src/web.ts` (same as local, no compile).';

  const deploySectionZh = docker
    ? `## 部署

集成环境：

\`\`\`bash
${pm} deploy:integration
\`\`\`

生产环境：

\`\`\`bash
${pm} deploy:production
\`\`\`

镜像构建与容器编排见 \`Dockerfile.*\`、\`docker-compose-*.yml\`。
`
    : `## 部署

集成环境：

\`\`\`bash
${pm} deploy:integration
\`\`\`

生产环境：

\`\`\`bash
${pm} deploy:production
\`\`\`

${bareDeployHintZh}
`;

  const deploySectionEn = docker
    ? `## Deploy

Integration:

\`\`\`bash
${pm} deploy:integration
\`\`\`

Production:

\`\`\`bash
${pm} deploy:production
\`\`\`

See \`Dockerfile.*\` and \`docker-compose-*.yml\` for images and orchestration.
`
    : `## Deploy

Integration:

\`\`\`bash
${pm} deploy:integration
\`\`\`

Production:

\`\`\`bash
${pm} deploy:production
\`\`\`

${bareDeployHintEn}
`;

  if (zh) {
    const docsSection =
      opts.docsUI === 'none'
        ? ''
        : `## API 文档

启动后访问 \`src/middleware/${docsFile}\` 中配置的 \`uriPrefix\`（**生产环境默认关闭**）。

`;

    return `# ${opts.projectName}

基于 [aomex](https://aomex.js.org) 的 Node.js 服务端项目。开发前请先阅读官方文档。

## 技术选型

| 项 | 值 |
| --- | --- |
| 包管理器 | ${pm} |
| ORM | ${ormLabel(orm, opts.prismaDatabase, true)} |
| 认证 | ${authLabel(readme.auth, true)} |
| 文档 UI | ${docsName || '无'} |
| 部署方式 | ${docker ? 'Docker' : cluster === 'pm2' ? 'PM2' : '裸机 / 进程'} |
| 时区 | ${readme.timezone} |
| 定时任务 | ${opts.hasCron ? '已启用' : '未启用'} |

## 环境准备

1. Node.js 版本见 \`package.json\` → \`engines.node\`
2. 安装 [Docker](https://www.docker.com/) 或 [OrbStack](https://orbstack.dev/)（本地 \`docker-compose.yml\` 用于数据库 / Redis）
3. 复制环境变量：\`cp .env.example .env\`（按需修改）
4. 安装依赖：

\`\`\`bash
${pm} install
\`\`\`

## 本地启动

\`\`\`bash
${pm} start
\`\`\`

默认会：

- \`docker compose up\` 拉起本地依赖
${orm === 'prisma' ? '- 执行 \`prisma generate\` / migrate 或 db push\n' : ''}- 启动 HTTP 服务（\`src/web.ts\`）
${opts.hasCron ? '- 启动 cron（\`aomex cron:start\`）\n' : ''}
${docsSection}## 常用脚本

${buildScriptsTable(readme, true)}

${deploySectionZh}## 目录结构

\`\`\`
${buildTree(readme, true)}
\`\`\`
`;
  }

  const docsSection =
    opts.docsUI === 'none'
      ? ''
      : `## API docs

After start, open the \`uriPrefix\` in \`src/middleware/${docsFile}\` (**disabled** in production by default).

`;

  return `# ${opts.projectName}

Node.js server scaffolded with [aomex](https://aomex.js.org). Read the docs before coding.

## Stack

| Item | Value |
| --- | --- |
| Package manager | ${pm} |
| ORM | ${ormLabel(orm, opts.prismaDatabase)} |
| Auth | ${authLabel(readme.auth)} |
| Docs UI | ${docsName || 'None'} |
| Deploy | ${docker ? 'Docker' : cluster === 'pm2' ? 'PM2' : 'Bare metal'} |
| Timezone | ${readme.timezone} |
| Cron | ${opts.hasCron ? 'Enabled' : 'Disabled'} |

## Prerequisites

1. Node.js version: \`package.json\` → \`engines.node\`
2. Install [Docker](https://www.docker.com/) or [OrbStack](https://orbstack.dev/) (local \`docker-compose.yml\` for DB / Redis)
3. Copy env: \`cp .env.example .env\` (edit as needed)
4. Install deps:

\`\`\`bash
${pm} install
\`\`\`

## Start locally

\`\`\`bash
${pm} start
\`\`\`

This will:

- \`docker compose up\` local dependencies
${orm === 'prisma' ? '- run \`prisma generate\` / migrate or db push\n' : ''}- start HTTP (\`src/web.ts\`)
${opts.hasCron ? '- start cron (\`aomex cron:start\`)\n' : ''}
${docsSection}## Scripts

${buildScriptsTable(readme, false)}

${deploySectionEn}## Structure

\`\`\`
${buildTree(readme, false)}
\`\`\`
`;
};

/** 供 project-files 传入完整选项 */
export const generateReadmeFromOptions = (
  projectName: string,
  options: ScaffoldOptions,
): string =>
  generateReadme({
    projectName,
    language: options.language,
    packageManager: options.packageManager,
    docsUI: options.docsUI,
    hasCron: options.consoleMiddlewares.includes('cron'),
    orm: options.orm,
    prismaDatabase: options.prismaDatabase,
    auth: options.auth,
    docker: options.docker,
    timezone: options.timezone,
    cluster: options.cluster,
  });
