import type { DefaultLanguage } from './i18n-languages';

export type { DefaultLanguage };

export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export type Orm = 'prisma' | 'mongoose' | 'none';

/** Prisma 官方 datasource.provider */
export type PrismaDatabase =
  'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb';

/** 可选认证策略（空数组表示均不启用，但仍生成 auth 中间件） */
export type AuthStrategy = 'bearer' | 'jwt' | 'api-key' | 'session' | 'oauth2';

export const AUTH_STRATEGIES: readonly AuthStrategy[] = [
  'bearer',
  'jwt',
  'api-key',
  'session',
  'oauth2',
] as const;

/**
 * 首屏与 Auth 同列的 OAuth / 微信入口（选 `oauth2-client` 后再选厂商预设）。
 * @see https://github.com/aomex/aomex-contrib
 */
export type OAuthEntry =
  'oauth2-client' | 'google-identity' | 'wechat' | 'wechat-mini' | 'wecom';

export const OAUTH_ENTRIES: readonly OAuthEntry[] = [
  'oauth2-client',
  'google-identity',
  'wechat',
  'wechat-mini',
  'wecom',
] as const;

/**
 * `oauth2-client` 二级厂商预设（标准 OIDC/OAuth2，不含微信系）。
 */
export type OAuth2VendorPreset =
  | 'google'
  | 'microsoft'
  | 'apple'
  | 'github'
  | 'discord'
  | 'gitlab'
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'spotify';

export const OAUTH2_VENDOR_PRESETS: readonly OAuth2VendorPreset[] = [
  'google',
  'microsoft',
  'apple',
  'github',
  'discord',
  'gitlab',
  'linkedin',
  'facebook',
  'twitter',
  'spotify',
] as const;

/** 实际生成的登录集成（厂商预设 + 首屏直选：GIS / 微信系） */
export type OAuth2Preset =
  OAuth2VendorPreset | 'google-identity' | 'wechat' | 'wechat-mini' | 'wecom';

export const OAUTH2_PRESETS: readonly OAuth2Preset[] = [
  ...OAUTH2_VENDOR_PRESETS,
  'google-identity',
  'wechat',
  'wechat-mini',
  'wecom',
] as const;

/** 规范化认证选项：含 `none` 或空 → []；否则去重并去掉 none */
export const normalizeAuthStrategies = (
  raw: readonly string[],
): AuthStrategy[] => {
  if (raw.length === 0 || raw.includes('none')) return [];
  return [
    ...new Set(
      raw.filter((s): s is AuthStrategy =>
        (AUTH_STRATEGIES as readonly string[]).includes(s),
      ),
    ),
  ];
};

/** 规范化 OAuth2 厂商预设：去重并丢弃未知值 */
export const normalizeOAuth2Presets = (
  raw: readonly string[],
): OAuth2Preset[] => [
  ...new Set(
    raw.filter((s): s is OAuth2Preset =>
      (OAUTH2_PRESETS as readonly string[]).includes(s),
    ),
  ),
];

export const normalizeOAuth2VendorPresets = (
  raw: readonly string[],
): OAuth2VendorPreset[] => [
  ...new Set(
    raw.filter((s): s is OAuth2VendorPreset =>
      (OAUTH2_VENDOR_PRESETS as readonly string[]).includes(s),
    ),
  ),
];

/**
 * 解析认证勾选 / `--auth` 列表。
 * 可含 Auth 策略、首屏入口（`oauth2-client` / `wechat` / …）与厂商预设（`github`…，CLI 可显式启用）。
 * 勾选任一登录集成或 `oauth2-client` / `oauth2` 即视为启用 `oauth2`。
 * 交互勾选 `oauth2-client` 后再选厂商（可空）；未选中的厂商以注释模板写入源码。
 */
export const parseAuthSelection = (
  raw: readonly string[],
): {
  auth: AuthStrategy[];
  oauth2Presets: OAuth2Preset[];
  /** 是否勾了 oauth2-client（未选厂商时仍写注释模板） */
  oauth2Client: boolean;
} => {
  if (raw.length === 0 || raw.includes('none')) {
    return { auth: [], oauth2Presets: [], oauth2Client: false };
  }
  const oauth2Client = raw.includes('oauth2-client') || raw.includes('oauth2');
  const oauth2Presets = normalizeOAuth2Presets(raw);
  const classic = normalizeAuthStrategies(raw).filter((s) => s !== 'oauth2');
  const wantOAuth2 = oauth2Presets.length > 0 || oauth2Client;
  return {
    auth: wantOAuth2 ? [...classic, 'oauth2'] : classic,
    oauth2Presets,
    oauth2Client,
  };
};

export type DocsUI = 'swagger' | 'redoc' | 'scalar' | 'none';

/** 运行时平台（可多选；Websocket 会自动带上 Web，因 upgrade 挂在 HTTP Server） */
export type Platform = 'web' | 'console' | 'websocket';

export const PLATFORMS: readonly Platform[] = [
  'web',
  'console',
  'websocket',
] as const;

export const normalizePlatforms = (raw: readonly string[]): Platform[] => {
  const set = new Set<Platform>();
  for (const item of raw) {
    if ((PLATFORMS as readonly string[]).includes(item)) {
      set.add(item as Platform);
    }
  }
  if (set.has('websocket')) set.add('web');
  return PLATFORMS.filter((p) => set.has(p));
};

export const hasPlatform = (
  platforms: readonly Platform[],
  platform: Platform,
): boolean => platforms.includes(platform);

export type WebPlugin =
  | 'cors'
  | 'etag'
  | 'helmet'
  | 'compress'
  | 'response-time'
  | 'pretty-json'
  | 'rate-limit'
  | 'http-access-log'
  | 'async-trace'
  | 'csrf';

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
  /** 启用的平台：Web / Console / Websocket（默认 Web+Console） */
  platforms: Platform[];
  orm: Orm;
  prismaDatabase?: PrismaDatabase;
  /** 启用的认证策略，可多选；空数组仍生成 auth.md.ts（策略注释保留） */
  auth: AuthStrategy[];
  /**
   * 勾选了 `oauth2-client`：安装 `@aomex/oauth2-client`。
   * 若同时选了厂商预设，未启用的厂商以注释模板写入；仅勾 client 不落预设文件。
   */
  oauth2Client: boolean;
  /**
   * 已启用的登录集成：二级勾选的厂商 / 首屏直选（微信 / GIS）/ CLI `--oauth2-presets`。
   */
  oauth2Presets: OAuth2Preset[];
  webPlugins: WebPlugin[];
  docsUI: DocsUI;
  loggerTransports: LoggerTransport[];
  consoleMiddlewares: ConsoleMiddleware[];
  language: DefaultLanguage;
  /** 是否生成 Docker 部署产物（Dockerfile / deploy compose / deploy 脚本） */
  docker: boolean;
  /** IANA 时区：只写入 .env*（Docker compose env_file / dotenv / 本地 start 共用） */
  timezone: string;
  /** 集群方案（勿叠用多种） */
  cluster: ClusterStrategy;
}
