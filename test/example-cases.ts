import {
  BASE_WEB_PLUGINS,
  type ScaffoldOptions,
  type WebPlugin,
} from '../src/types';

export type ExampleCase = {
  /** example/<name>/ 目录名 */
  name: string;
  options: ScaffoldOptions;
};

const allWebPlugins: WebPlugin[] = [
  ...BASE_WEB_PLUGINS,
  'compress',
  'pretty-json',
  'rate-limit',
  'http-access-log',
  'async-trace',
];

/** 推荐组合：基础插件 + 常用可选 */
const recommendedPlugins: WebPlugin[] = [
  ...BASE_WEB_PLUGINS,
  'http-access-log',
  'async-trace',
];

/** 精简底版：变体以此为基底（含基础 Web 插件） */
const bareMinimum: ScaffoldOptions = {
  packageManager: 'pnpm',
  orm: 'none',
  prismaDatabase: undefined,
  auth: 'none',
  webPlugins: [...BASE_WEB_PLUGINS],
  docsUI: 'none',
  loggerTransports: ['console'],
  consoleMiddlewares: [],
  language: 'zh-CN',
  dynamicLanguage: false,
  responseEnvelope: false,
  docker: true,
  timezone: 'UTC',
  cluster: 'none',
};

/** 全家桶：尽量全开 */
const kitchenSink: ScaffoldOptions = {
  packageManager: 'pnpm',
  orm: 'prisma',
  prismaDatabase: 'mysql',
  auth: 'bearer',
  webPlugins: [...allWebPlugins],
  docsUI: 'swagger',
  loggerTransports: [
    'console',
    'file',
    'stream',
    'webhook',
    'sentry',
    'telegram',
  ],
  consoleMiddlewares: ['cron', 'openapi'],
  language: 'zh-CN',
  dynamicLanguage: true,
  responseEnvelope: true,
  docker: true,
  timezone: 'UTC',
  cluster: 'cluster-listen',
};

/** 推荐默认：Prisma + Bearer + 常用插件 + cron */
const recommended: ScaffoldOptions = {
  packageManager: 'pnpm',
  orm: 'prisma',
  prismaDatabase: 'mysql',
  auth: 'bearer',
  webPlugins: [...recommendedPlugins],
  docsUI: 'swagger',
  loggerTransports: ['console', 'file'],
  consoleMiddlewares: ['cron'],
  language: 'zh-CN',
  dynamicLanguage: false,
  responseEnvelope: false,
  docker: true,
  timezone: 'UTC',
  cluster: 'none',
};

const fromBare = (
  name: string,
  patch: Partial<ScaffoldOptions>,
): ExampleCase => ({
  name,
  options: { ...bareMinimum, ...patch },
});

/**
 * 示例策略（不做全笛卡尔积）：
 * 1. bare-minimum / kitchen-sink / recommended
 * 2. ORM：prisma-mysql / mongoose
 * 3. 时区：timezone-shanghai
 * 4. 包管理器：package-manager-*
 * 5. 语言：language-*
 * 6. 集群：cluster-node / cluster-pm2
 * 7. 部署：deploy-without-docker / cluster-pm2-without-docker
 */
export const exampleCases: ExampleCase[] = [
  // 精简示例：无 Docker 部署、无 PM2（变体基底 bareMinimum 仍默认 docker，便于对照）
  {
    name: 'bare-minimum',
    options: { ...bareMinimum, docker: false, cluster: 'none' },
  },
  { name: 'kitchen-sink', options: kitchenSink },
  { name: 'recommended', options: recommended },

  fromBare('prisma-mysql', {
    orm: 'prisma',
    prismaDatabase: 'mysql',
    consoleMiddlewares: ['cron'],
  }),
  fromBare('mongoose', {
    orm: 'mongoose',
  }),

  fromBare('timezone-shanghai', { timezone: 'Asia/Shanghai' }),

  fromBare('package-manager-pnpm', { packageManager: 'pnpm' }),
  fromBare('package-manager-npm', { packageManager: 'npm' }),
  fromBare('package-manager-yarn', { packageManager: 'yarn' }),

  fromBare('language-english', { language: 'en-US' }),
  fromBare('language-japanese', { language: 'ja-JP' }),
  fromBare('language-from-header', { dynamicLanguage: true }),

  fromBare('cluster-node', { cluster: 'cluster-listen' }),
  fromBare('cluster-pm2', { cluster: 'pm2' }),

  fromBare('deploy-without-docker', { docker: false }),
  fromBare('cluster-pm2-without-docker', {
    docker: false,
    cluster: 'pm2',
  }),
];
