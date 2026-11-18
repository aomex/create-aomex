import type { DefaultLanguage } from './i18n-languages';

export type { DefaultLanguage };

export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export type Orm = 'prisma' | 'mongoose' | 'none';

/** Prisma 官方 datasource.provider */
export type PrismaDatabase =
  'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';

export type AuthStrategy = 'bearer' | 'jwt' | 'api-key' | 'none';

export type DocsUI = 'swagger' | 'redoc' | 'none';

export type WebPlugin =
  | 'cors'
  | 'etag'
  | 'helmet'
  | 'compress'
  | 'response-time'
  | 'pretty-json'
  | 'rate-limit'
  | 'http-access-log'
  | 'async-trace';

/** 所有项目默认安装、不询问的 Web 插件 */
export const BASE_WEB_PLUGINS: readonly WebPlugin[] = [
  'response-time',
  'cors',
  'etag',
  'helmet',
];

export const withBaseWebPlugins = (plugins: WebPlugin[]): WebPlugin[] => [
  ...new Set<WebPlugin>([...BASE_WEB_PLUGINS, ...plugins]),
];

export type LoggerTransport =
  'console' | 'file' | 'stream' | 'webhook' | 'sentry' | 'telegram';

export type ConsoleMiddleware = 'cron' | 'openapi';

/**
 * 集群方案（勿叠用）：
 * - none：单进程
 * - cluster-listen：内置 clusterListen
 * - pm2：PM2 cluster + pm2-runtime
 */
export type ClusterStrategy = 'none' | 'cluster-listen' | 'pm2';

export const CLUSTER_STRATEGIES: readonly ClusterStrategy[] = [
  'none',
  'cluster-listen',
  'pm2',
] as const;

export interface ScaffoldOptions {
  packageManager: PackageManager;
  orm: Orm;
  prismaDatabase?: PrismaDatabase;
  auth: AuthStrategy;
  webPlugins: WebPlugin[];
  docsUI: DocsUI;
  loggerTransports: LoggerTransport[];
  consoleMiddlewares: ConsoleMiddleware[];
  language: DefaultLanguage;
  /** WebApp language mode: dynamic（按 Accept-Language） */
  dynamicLanguage: boolean;
  /**
   * 统一响应体套壳：`WebApp.envelope`，写出前包进声明结构并固定 HTTP 200。
   * @see https://aomex.js.org （envelope / formatError）
   */
  responseEnvelope: boolean;
  /** 是否生成 Docker 部署产物（Dockerfile / deploy compose / deploy 脚本） */
  docker: boolean;
  /** IANA 时区：只写入 .env*（Docker compose env_file / dotenv / 本地 start 共用） */
  timezone: string;
  /** 集群方案（勿叠用多种） */
  cluster: ClusterStrategy;
}
