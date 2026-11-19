import { checkbox, select } from '@inquirer/prompts';
import { I18N_LANGUAGES, type DefaultLanguage } from './i18n-languages';
import { buildTimezoneChoices, isValidTimezone } from './timezones';
import {
  CLUSTER_STRATEGIES,
  normalizeAuthStrategies,
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

/** 从 `pnpm/yarn/npm create` 注入的 user-agent 推断包管理器 */
export const packageManagerFromUserAgent = (
  userAgent = process.env['npm_config_user_agent'],
): PackageManager | undefined => {
  if (!userAgent) return undefined;
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('npm')) return 'npm';
  return undefined;
};

export const selectOptions = async (
  argv: Record<string, any>,
): Promise<ScaffoldOptions> => {
  const packageManager =
    (argv['pm'] as PackageManager | undefined) ??
    packageManagerFromUserAgent() ??
    (await select<PackageManager>({
      message: '使用哪种包管理器',
      choices: [
        { name: 'pnpm', value: 'pnpm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'npm', value: 'npm' },
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

  // 可多选；若勾选「无」则清空其他策略
  const authArg = parseList(argv['auth']);
  const auth =
    authArg.length > 0
      ? normalizeAuthStrategies(authArg)
      : normalizeAuthStrategies(
          await checkbox<AuthStrategy | 'none'>({
            message: '身份认证策略（可多选；选「无」将清空其他项）',
            choices: [
              {
                name: 'Bearer Token（不透明令牌，可吊销）',
                value: 'bearer',
                checked: true,
              },
              {
                name: 'JWT（无状态令牌）',
                value: 'jwt',
                checked: false,
              },
              {
                name: 'API Key（x-api-key）',
                value: 'api-key',
                checked: false,
              },
              { name: '无', value: 'none', checked: false },
            ],
            loop: false,
          }),
        );

  // response-time / cors / etag / helmet 为基础插件，不询问，始终安装
  const webPluginsArg = parseList(argv['web-plugins'] ?? argv['webPlugins']);
  const selectedWebPlugins =
    webPluginsArg.length > 0
      ? (webPluginsArg as WebPlugin[])
      : await checkbox<WebPlugin>({
          message: '需要用到的Web中间件',
          choices: [
            {
              name: 'http-access-log（HTTP 访问日志）',
              value: 'http-access-log',
              checked: true,
            },
            {
              name: 'async-trace（慢请求追踪）',
              value: 'async-trace',
              checked: true,
            },
            {
              name: 'compress（Gzip/Brotli 响应压缩）',
              value: 'compress',
              checked: false,
            },
            {
              name: 'pretty-json（开发时美化 JSON 响应）',
              value: 'pretty-json',
              checked: false,
            },
            {
              name: 'rate-limit（接口限流防刷）',
              value: 'rate-limit',
              checked: false,
            },
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
        { name: 'Scalar UI', value: 'scalar' },
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
            { name: 'Console（终端输出）', value: 'console', checked: true },
            { name: 'File（写入本地日志文件）', value: 'file', checked: true },
            {
              name: 'Stream（自定义可写流）',
              value: 'stream',
              checked: false,
            },
            {
              name: 'Webhook（HTTP 回调上报）',
              value: 'webhook',
              checked: false,
            },
            {
              name: 'Sentry（错误监控上报）',
              value: 'sentry',
              checked: false,
            },
            {
              name: 'Telegram（机器人消息通知）',
              value: 'telegram',
              checked: false,
            },
          ],
          required: true,
          loop: false,
          validate: (items) =>
            items.length > 0 ? true : '至少选择一个日志出口',
        });

  // Console 中间件不再询问：统一安装 cron；可用 argv 追加 openapi 等
  const consoleArg = parseList(
    argv['console-middlewares'] ?? argv['consoleMiddlewares'],
  ) as ConsoleMiddleware[];
  const consoleMiddlewares = [
    ...new Set<ConsoleMiddleware>([
      'cron',
      ...consoleArg.filter((m) => m === 'cron' || m === 'openapi'),
    ]),
  ];

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

  // 未传 --docker 时默认 Docker 部署；仅 CLI 可显式关闭（--docker=false）
  const docker = parseBoolArg(argv['docker']) ?? true;

  const argvTz = (argv['tz'] ?? argv['timezone']) as string | undefined;
  let timezone: string;
  if (argvTz && isValidTimezone(argvTz)) {
    timezone = argvTz;
  } else {
    const { choices, defaultValue } = await buildTimezoneChoices();
    timezone = await select<string>({
      message: '时区（进程 ENV TZ）',
      choices,
      default: defaultValue,
      loop: false,
    });
  }

  const cluster =
    parseClusterArg(argv['cluster']) ??
    (await select<ClusterStrategy>({
      message: '集群方案（勿叠用）',
      choices: [
        { name: '单进程', value: 'none' },
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
    docker,
    timezone,
    cluster,
  };
};
