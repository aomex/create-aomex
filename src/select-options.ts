import { checkbox, confirm, select } from '@inquirer/prompts';
import { I18N_LANGUAGES, type DefaultLanguage } from './i18n-languages';
import { DEFAULT_TIMEZONE, isValidTimezone, listTimezones } from './timezones';
import {
  CLUSTER_STRATEGIES,
  withBaseWebPlugins,
  type AuthStrategy,
  type ClusterStrategy,
  type ConsoleMiddleware,
  type DocsUI,
  type LoggerTransport,
  type Orm,
  type PackageManager,
  type PrismaDatabase,
  type ScaffoldOptions,
  type WebPlugin,
} from './types';

const parseClusterArg = (value: unknown): ClusterStrategy | undefined => {
  if (value === undefined) return undefined;
  // 兼容旧布尔：true → cluster-listen，false → none
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return 'cluster-listen';
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return 'none';
  }
  if (
    typeof value === 'string' &&
    (CLUSTER_STRATEGIES as readonly string[]).includes(value)
  ) {
    return value as ClusterStrategy;
  }
  return undefined;
};

const languageLabels = new Intl.DisplayNames(['zh-CN'], { type: 'language' });

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const selectOptions = async (
  argv: Record<string, any>,
): Promise<ScaffoldOptions> => {
  const packageManager =
    (argv['pm'] as PackageManager | undefined) ??
    (await select<PackageManager>({
      message: '使用哪种包管理器',
      choices: [
        { name: 'pnpm', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: 'pnpm',
    }));

  const orm =
    (argv['orm'] as Orm | undefined) ??
    (await select<Orm>({
      message: '使用哪种 ORM',
      choices: [
        { name: 'Prisma', value: 'prisma' },
        { name: 'Mongoose', value: 'mongoose' },
        { name: '无', value: 'none' },
      ],
      default: 'prisma',
    }));

  let prismaDatabase: PrismaDatabase | undefined;
  if (orm === 'prisma') {
    prismaDatabase =
      (argv['db'] as PrismaDatabase | undefined) ??
      (await select<PrismaDatabase>({
        message: 'Prisma 数据库',
        choices: [
          { name: 'MySQL / MariaDB', value: 'mysql' },
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'SQLite', value: 'sqlite' },
          { name: 'SQL Server', value: 'sqlserver' },
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'CockroachDB', value: 'cockroachdb' },
        ],
        default: 'mysql',
        loop: false,
      }));
  }

  const auth =
    (argv['auth'] as AuthStrategy | undefined) ??
    (await select<AuthStrategy>({
      message: '身份认证策略',
      choices: [
        { name: 'Bearer Token', value: 'bearer' },
        { name: 'JWT', value: 'jwt' },
        { name: 'API Key', value: 'api-key' },
        { name: '无', value: 'none' },
      ],
      default: 'bearer',
    }));

  // response-time / cors / etag / helmet 为基础插件，不询问，始终安装
  const webPluginsArg = parseList(argv['web-plugins'] ?? argv['webPlugins']);
  const selectedWebPlugins =
    webPluginsArg.length > 0
      ? (webPluginsArg as WebPlugin[])
      : await checkbox<WebPlugin>({
          message:
            '需要用到的 Web 插件（已默认 cors / etag / helmet / response-time）',
          choices: [
            {
              name: 'http-access-log',
              value: 'http-access-log',
              checked: true,
            },
            {
              name: 'async-trace（慢请求追踪）',
              value: 'async-trace',
              checked: true,
            },
            { name: 'compress', value: 'compress', checked: false },
            { name: 'pretty-json', value: 'pretty-json', checked: false },
            { name: 'rate-limit', value: 'rate-limit', checked: false },
          ],
          loop: false,
        });
  const webPlugins = withBaseWebPlugins(selectedWebPlugins);

  const docsUI =
    (argv['docs'] as DocsUI | undefined) ??
    (await select<DocsUI>({
      message: '文档 UI',
      choices: [
        { name: 'Swagger UI', value: 'swagger' },
        { name: 'Redoc UI', value: 'redoc' },
        { name: '无', value: 'none' },
      ],
      default: 'swagger',
    }));

  const loggerArg = parseList(argv['logger']);
  const loggerTransports =
    loggerArg.length > 0
      ? (loggerArg as LoggerTransport[])
      : await checkbox<LoggerTransport>({
          message: '日志出口',
          choices: [
            { name: 'Console', value: 'console', checked: true },
            { name: 'File', value: 'file', checked: true },
            { name: 'Stream', value: 'stream', checked: false },
            { name: 'Webhook', value: 'webhook', checked: false },
            {
              name: 'Sentry（@aomex/logger-sentry）',
              value: 'sentry',
              checked: false,
            },
            {
              name: 'Telegram（@aomex/logger-telegram）',
              value: 'telegram',
              checked: false,
            },
          ],
          required: true,
          loop: false,
          validate: (items) =>
            items.length > 0 ? true : '至少选择一个日志出口',
        });

  const consoleArg = parseList(
    argv['console-middlewares'] ?? argv['consoleMiddlewares'],
  );
  const consoleMiddlewares =
    consoleArg.length > 0
      ? (consoleArg as ConsoleMiddleware[])
      : await checkbox<ConsoleMiddleware>({
          message: 'Console 中间件',
          choices: [
            { name: 'cron（定时任务）', value: 'cron', checked: true },
            {
              name: 'openapi（生成文档文件）',
              value: 'openapi',
              checked: false,
            },
          ],
          loop: false,
        });

  const argvLang = argv['lang'] as string | undefined;
  const language =
    argvLang && (I18N_LANGUAGES as readonly string[]).includes(argvLang)
      ? (argvLang as DefaultLanguage)
      : await select<DefaultLanguage>({
          message: '默认语言',
          choices: I18N_LANGUAGES.map((code) => ({
            name: `${code}（${languageLabels.of(code) ?? code}）`,
            value: code,
          })),
          default: 'zh-CN',
          loop: false,
          pageSize: 15,
        });

  const parseBoolArg = (value: unknown): boolean | undefined => {
    if (value === undefined) return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return undefined;
  };

  const argvDynamicLang = argv['dynamic-language'] ?? argv['dynamicLanguage'];
  const dynamicLanguage =
    parseBoolArg(argvDynamicLang) ??
    (await confirm({
      message: '是否根据请求自动切换语言（Accept-Language）',
      default: false,
    }));

  const responseEnvelope =
    parseBoolArg(
      argv['envelope'] ?? argv['response-envelope'] ?? argv['responseEnvelope'],
    ) ??
    (await confirm({
      message: '是否统一响应体套壳为 HTTP 200（WebApp.envelope）',
      default: false,
    }));

  const docker =
    parseBoolArg(argv['docker']) ??
    (await confirm({
      message: '是否使用 Docker 部署',
      default: true,
    }));

  const argvTz = (argv['tz'] ?? argv['timezone']) as string | undefined;
  const timezone =
    argvTz && isValidTimezone(argvTz)
      ? argvTz
      : await select<string>({
          message: '时区（进程 ENV TZ）',
          choices: listTimezones().map((tz) => ({ name: tz, value: tz })),
          default: DEFAULT_TIMEZONE,
          loop: false,
          pageSize: 15,
        });

  const cluster =
    parseClusterArg(argv['cluster']) ??
    (await select<ClusterStrategy>({
      message: '集群方案（勿叠用）',
      choices: [
        { name: '无（单进程）', value: 'none' },
        { name: '内置 clusterListen', value: 'cluster-listen' },
        { name: 'PM2', value: 'pm2' },
      ],
      default: 'none',
      loop: false,
    }));

  return {
    packageManager,
    orm,
    prismaDatabase,
    auth,
    webPlugins,
    docsUI,
    loggerTransports,
    consoleMiddlewares,
    language,
    dynamicLanguage,
    responseEnvelope,
    docker,
    timezone,
    cluster,
  };
};
