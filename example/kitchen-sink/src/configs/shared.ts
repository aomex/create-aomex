import type { RedisOptions } from '@aomex/cache-redis-adapter';

/**
 * 多环境共用的基底配置。
 * 各环境文件通过 `...baseConfig` 展开后，再覆盖本环境特有项。
 */
export const baseConfig = {
  // timeout: 30_000,
};

type BaseConfig = typeof baseConfig;

/**
 * 各环境密钥配置，来自.env*、Aws Secret Manager、Vault 等。
 */
export interface EnvSecrets {
  REDIS_PASSWORD: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  //   MICROSOFT_CLIENT_ID: string;
  //   MICROSOFT_CLIENT_SECRET: string;
  //   APPLE_CLIENT_ID: string;
  //   APPLE_TEAM_ID: string;
  //   APPLE_KEY_ID: string;
  //   APPLE_PRIVATE_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  //   DISCORD_CLIENT_ID: string;
  //   DISCORD_CLIENT_SECRET: string;
  //   GITLAB_CLIENT_ID: string;
  //   GITLAB_CLIENT_SECRET: string;
  //   LINKEDIN_CLIENT_ID: string;
  //   LINKEDIN_CLIENT_SECRET: string;
  //   FACEBOOK_CLIENT_ID: string;
  //   FACEBOOK_CLIENT_SECRET: string;
  //   TWITTER_CLIENT_ID: string;
  //   TWITTER_CLIENT_SECRET: string;
  //   SPOTIFY_CLIENT_ID: string;
  //   SPOTIFY_CLIENT_SECRET: string;
}

/**
 * 应用运行时配置
 */
export interface AppConfig extends BaseConfig {
  redis: RedisOptions;
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    //   microsoft: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   apple: {
    //     clientId: string;
    //     teamId: string;
    //     keyId: string;
    //     privateKey: string;
    //   };
    github: {
      clientId: string;
      clientSecret: string;
    };
    //   discord: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   gitlab: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   linkedin: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   facebook: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   twitter: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
    //   spotify: {
    //     clientId: string;
    //     clientSecret: string;
    //   };
  };
}
