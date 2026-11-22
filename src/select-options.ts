import { checkbox, select } from '@inquirer/prompts';
import {
  I18N_LANGUAGES,
  detectLocalLanguage,
  type DefaultLanguage,
} from './i18n-languages';
import { buildTimezoneChoices, isValidTimezone } from './timezones';
import { OAUTH2_PRESET_META, OAUTH_ENTRY_LABELS } from './oauth2-presets';
import {
  CLUSTER_STRATEGIES,
  OAUTH2_VENDOR_PRESETS,
  OAUTH_ENTRIES,
  normalizeOAuth2VendorPresets,
  parseAuthSelection,
  withBaseWebPlugins,
  type AuthStrategy,
  type ClusterStrategy,
  type ConsoleMiddleware,
  type DocsUI,
  type LoggerTransport,
  type OAuth2Preset,
  type OAuth2VendorPreset,
  type OAuthEntry,
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

const localLanguage = detectLocalLanguage();

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

  // 可多选；Auth + 首屏 OAuth/微信入口。选 oauth2-client 后再选厂商（可空＝仅注释模板）。选「无」清空。
  type AuthChoice = AuthStrategy | OAuthEntry | 'none';
  const authArg = parseList(argv['auth']);
  const presetsArg = parseList(
    argv['oauth2-presets'] ?? argv['oauth2Presets'] ?? argv['oauth2'],
  );
  let auth: AuthStrategy[];
  let oauth2Presets: OAuth2Preset[];
  let oauth2Client: boolean;
  if (authArg.length > 0 || presetsArg.length > 0) {
    const parsed = parseAuthSelection([...authArg, ...presetsArg]);
    auth = parsed.auth;
    oauth2Presets = parsed.oauth2Presets;
    oauth2Client = parsed.oauth2Client;
  } else {
    const selected = await checkbox<AuthChoice>({
      message: '身份认证（可多选；选「无」将清空其他项）',
      choices: [
        {
          name: 'Bearer Token（不透明令牌，可吊销）',
          value: 'bearer' as const,
          checked: true,
        },
        {
          name: 'JWT（无状态令牌）',
          value: 'jwt' as const,
          checked: false,
        },
        {
          name: 'API Key（x-api-key）',
          value: 'api-key' as const,
          checked: false,
        },
        {
          name: 'Session（Cookie 会话；需配合 csrf + cors.credentials/origin）',
          value: 'session' as const,
          checked: false,
        },
        ...OAUTH_ENTRIES.map((id) => ({
          name: OAUTH_ENTRY_LABELS[id],
          value: id as AuthChoice,
          checked: false,
        })),
        { name: '无', value: 'none' as const, checked: false },
      ],
      loop: false,
      pageSize: 16,
    });
    let parsed = parseAuthSelection(selected);
    if (parsed.oauth2Client) {
      const vendors = normalizeOAuth2VendorPresets(
        await checkbox<OAuth2VendorPreset>({
          message:
            'OAuth2 厂商预设（可多选；可不选＝仅安装 @aomex/oauth2-client）',
          choices: OAUTH2_VENDOR_PRESETS.map((id) => ({
            name: OAUTH2_PRESET_META[id].label,
            value: id,
            checked: false,
          })),
          loop: false,
          pageSize: 12,
          required: false,
        }),
      );
      if (vendors.length > 0) {
        parsed = parseAuthSelection([
          ...selected.filter((s) => s !== 'oauth2-client' && s !== 'oauth2'),
          'oauth2-client',
          ...vendors,
        ]);
      }
    }
    auth = parsed.auth;
    oauth2Presets = parsed.oauth2Presets;
    oauth2Client = parsed.oauth2Client;
  }

  // Web 中间件不询问：默认 http-access-log + async-trace；可用 --web-plugins 覆盖
  const webPluginsArg = parseList(argv['web-plugins'] ?? argv['webPlugins']);
  const selectedWebPlugins: WebPlugin[] =
    webPluginsArg.length > 0
      ? (webPluginsArg as WebPlugin[])
      : ['http-access-log', 'async-trace'];
  // Session 鉴权必须配合 csrf：CLI 漏传时也自动补上
  const webPlugins = withBaseWebPlugins(
    auth.includes('session') && !selectedWebPlugins.includes('csrf')
      ? [...selectedWebPlugins, 'csrf']
      : selectedWebPlugins,
  );

  // 文档 UI 不询问：默认 scalar（@aomex/scalar-ui）；可用 --docs 覆盖
  const docsArg = argv['docs'] as string | undefined;
  const docsUI: DocsUI =
    docsArg === 'swagger' ||
    docsArg === 'redoc' ||
    docsArg === 'scalar' ||
    docsArg === 'none'
      ? docsArg
      : 'scalar';

  // 日志出口不询问：默认 console + file；可用 --logger 覆盖
  const loggerArg = parseList(argv['logger']);
  const loggerTransports: LoggerTransport[] =
    loggerArg.length > 0
      ? (loggerArg as LoggerTransport[])
      : ['console', 'file'];

  // Console 中间件不询问：统一安装 cron；可用 --console-middlewares 追加 openapi 等
  const consoleArg = parseList(
    argv['console-middlewares'] ?? argv['consoleMiddlewares'],
  ) as ConsoleMiddleware[];
  const consoleMiddlewares = [
    ...new Set<ConsoleMiddleware>([
      'cron',
      ...consoleArg.filter((m) => m === 'cron' || m === 'openapi'),
    ]),
  ];

  // 语言不询问：默认本机 locale；可用 --lang 覆盖
  const argvLang = argv['lang'] as string | undefined;
  const language: DefaultLanguage =
    argvLang && (I18N_LANGUAGES as readonly string[]).includes(argvLang)
      ? (argvLang as DefaultLanguage)
      : localLanguage;

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

  // 集群不询问：默认单进程；可用 --cluster 覆盖
  const cluster = parseClusterArg(argv['cluster']) ?? 'none';

  return {
    packageManager,
    orm,
    prismaDatabase,
    auth,
    oauth2Client,
    oauth2Presets,
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
