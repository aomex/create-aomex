import type { OAuth2Preset, OAuthEntry, OAuth2VendorPreset } from './types';

export type OAuth2ConfigField = {
  /** AppConfig.oauth.<provider> 上的字段名 */
  key: string;
  /** EnvSecrets / .env 键名 */
  env: string;
};

export type OAuth2PresetKind = 'oauth2' | 'google-identity' | 'wechat-mini';

/** 与 https://github.com/aomex/aomex-contrib 登录相关包对齐 */
export type OAuth2PresetMeta = {
  id: OAuth2Preset;
  /** 交互勾选文案 */
  label: string;
  npmPackage: string;
  className: string;
  kind: OAuth2PresetKind;
  /** URL 路径段 / serviceKey */
  pathSegment: string;
  /** combineServices 键名，如 github / wechatMini */
  serviceKey: string;
  /** Service 类名，如 GithubService */
  serviceClassName: string;
  /** 文件名，如 github.service.ts */
  serviceFile: string;
  /** Apple 默认 form_post → POST；其余多为 GET；小程序无此路由 */
  callbackMethod: 'get' | 'post' | 'none';
  ctor:
    | 'standard'
    | 'apple'
    | 'google-identity'
    | 'wechat-open'
    | 'wecom'
    | 'wechat-mini';
  /** configs.oauth.<pathSegment> 字段 ↔ env */
  configFields: readonly OAuth2ConfigField[];
  /** 由 configFields 推导，供 .env 生成 */
  envKeys: readonly string[];
};

const meta = (
  partial: Omit<
    OAuth2PresetMeta,
    | 'serviceKey'
    | 'serviceClassName'
    | 'serviceFile'
    | 'pathSegment'
    | 'envKeys'
  > & { pathSegment?: string; serviceKey?: string },
): OAuth2PresetMeta => {
  const pathSegment = partial.pathSegment ?? partial.id;
  const serviceKey =
    partial.serviceKey ??
    pathSegment.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const pascal = serviceKey[0]!.toUpperCase() + serviceKey.slice(1);
  return {
    ...partial,
    pathSegment,
    serviceKey,
    serviceClassName: `${pascal}Service`,
    serviceFile: `${pathSegment}.service.ts`,
    envKeys: partial.configFields.map((f) => f.env),
  };
};

export const OAUTH_ENTRY_LABELS: Record<OAuthEntry, string> = {
  'oauth2-client': 'OAuth2 / OIDC（@aomex/oauth2-client；可选厂商预设）',
  'google-identity': 'Google Sign-In / GIS（credential / One Tap）',
  'wechat': '微信（公众号 / 开放平台）',
  'wechat-mini': '微信小程序 / 小游戏登录',
  'wecom': '企业微信（自建应用网页授权）',
};

export const OAUTH2_PRESET_META: Record<OAuth2Preset, OAuth2PresetMeta> = {
  'google': meta({
    id: 'google',
    label: 'Google（OIDC 整页 redirect）',
    npmPackage: '@aomex-contrib/oauth2-google',
    className: 'GoogleOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'GOOGLE_CLIENT_ID' },
      { key: 'clientSecret', env: 'GOOGLE_CLIENT_SECRET' },
    ],
  }),
  'google-identity': meta({
    id: 'google-identity',
    label: 'Google Sign-In / GIS（credential / One Tap）',
    npmPackage: '@aomex-contrib/google-identity-login',
    className: 'GoogleIdentityLoginClient',
    kind: 'google-identity',
    pathSegment: 'google-identity',
    serviceKey: 'googleIdentity',
    callbackMethod: 'none',
    ctor: 'google-identity',
    configFields: [
      { key: 'clientId', env: 'GOOGLE_CLIENT_ID' },
      { key: 'clientSecret', env: 'GOOGLE_CLIENT_SECRET' },
    ],
  }),
  'microsoft': meta({
    id: 'microsoft',
    label: 'Microsoft / Entra ID（OIDC）',
    npmPackage: '@aomex-contrib/oauth2-microsoft',
    className: 'MicrosoftOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'MICROSOFT_CLIENT_ID' },
      { key: 'clientSecret', env: 'MICROSOFT_CLIENT_SECRET' },
    ],
  }),
  'apple': meta({
    id: 'apple',
    label: 'Apple（Sign in with Apple）',
    npmPackage: '@aomex-contrib/oauth2-apple',
    className: 'AppleOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'post',
    ctor: 'apple',
    configFields: [
      { key: 'clientId', env: 'APPLE_CLIENT_ID' },
      { key: 'teamId', env: 'APPLE_TEAM_ID' },
      { key: 'keyId', env: 'APPLE_KEY_ID' },
      { key: 'privateKey', env: 'APPLE_PRIVATE_KEY' },
    ],
  }),
  'github': meta({
    id: 'github',
    label: 'GitHub',
    npmPackage: '@aomex-contrib/oauth2-github',
    className: 'GitHubOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'GITHUB_CLIENT_ID' },
      { key: 'clientSecret', env: 'GITHUB_CLIENT_SECRET' },
    ],
  }),
  'discord': meta({
    id: 'discord',
    label: 'Discord',
    npmPackage: '@aomex-contrib/oauth2-discord',
    className: 'DiscordOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'DISCORD_CLIENT_ID' },
      { key: 'clientSecret', env: 'DISCORD_CLIENT_SECRET' },
    ],
  }),
  'gitlab': meta({
    id: 'gitlab',
    label: 'GitLab.com',
    npmPackage: '@aomex-contrib/oauth2-gitlab',
    className: 'GitLabOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'GITLAB_CLIENT_ID' },
      { key: 'clientSecret', env: 'GITLAB_CLIENT_SECRET' },
    ],
  }),
  'linkedin': meta({
    id: 'linkedin',
    label: 'LinkedIn',
    npmPackage: '@aomex-contrib/oauth2-linkedin',
    className: 'LinkedInOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'LINKEDIN_CLIENT_ID' },
      { key: 'clientSecret', env: 'LINKEDIN_CLIENT_SECRET' },
    ],
  }),
  'facebook': meta({
    id: 'facebook',
    label: 'Facebook',
    npmPackage: '@aomex-contrib/oauth2-facebook',
    className: 'FacebookOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'FACEBOOK_CLIENT_ID' },
      { key: 'clientSecret', env: 'FACEBOOK_CLIENT_SECRET' },
    ],
  }),
  'twitter': meta({
    id: 'twitter',
    label: 'Twitter / X',
    npmPackage: '@aomex-contrib/oauth2-twitter',
    className: 'TwitterOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'TWITTER_CLIENT_ID' },
      { key: 'clientSecret', env: 'TWITTER_CLIENT_SECRET' },
    ],
  }),
  'spotify': meta({
    id: 'spotify',
    label: 'Spotify',
    npmPackage: '@aomex-contrib/oauth2-spotify',
    className: 'SpotifyOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'standard',
    configFields: [
      { key: 'clientId', env: 'SPOTIFY_CLIENT_ID' },
      { key: 'clientSecret', env: 'SPOTIFY_CLIENT_SECRET' },
    ],
  }),
  'wechat': meta({
    id: 'wechat',
    label: '微信（公众号 / 开放平台）',
    npmPackage: '@aomex-contrib/oauth2-wechat',
    className: 'WechatOpenOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'wechat-open',
    configFields: [
      { key: 'appId', env: 'WX_OPEN_APP_ID' },
      { key: 'appSecret', env: 'WX_OPEN_APP_SECRET' },
    ],
  }),
  'wechat-mini': meta({
    id: 'wechat-mini',
    label: '微信小程序 / 小游戏登录',
    npmPackage: '@aomex-contrib/wechat-mini-program-login',
    className: 'WechatMiniProgramLoginClient',
    kind: 'wechat-mini',
    pathSegment: 'wechat-mini',
    serviceKey: 'wechatMini',
    callbackMethod: 'none',
    ctor: 'wechat-mini',
    configFields: [
      { key: 'appId', env: 'WX_MINI_APP_ID' },
      { key: 'appSecret', env: 'WX_MINI_APP_SECRET' },
    ],
  }),
  'wecom': meta({
    id: 'wecom',
    label: '企业微信（自建应用网页授权）',
    npmPackage: '@aomex-contrib/oauth2-wecom',
    className: 'WecomOAuth2Client',
    kind: 'oauth2',
    callbackMethod: 'get',
    ctor: 'wecom',
    configFields: [
      { key: 'corpId', env: 'WECOM_CORP_ID' },
      { key: 'corpSecret', env: 'WECOM_CORP_SECRET' },
      { key: 'agentId', env: 'WECOM_AGENT_ID' },
    ],
  }),
};

export const oauth2PresetMetas = (
  presets: readonly OAuth2Preset[],
): OAuth2PresetMeta[] => presets.map((id) => OAUTH2_PRESET_META[id]);

export const oauth2VendorPresetMetas = (
  presets: readonly OAuth2VendorPreset[],
): OAuth2PresetMeta[] => presets.map((id) => OAUTH2_PRESET_META[id]);
