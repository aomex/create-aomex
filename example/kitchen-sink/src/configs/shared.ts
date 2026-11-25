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
  DATABASE_URL: string;
  REDIS_PASSWORD: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  LOG_WEBHOOK_URL: string;
  SENTRY_DSN: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

/**
 * 应用运行时配置
 */
export interface AppConfig extends BaseConfig {
  database: string;
  redis: RedisOptions;
  oauth: {
    github: {
      clientId: string;
      clientSecret: string;
    };
    google: {
      clientId: string;
      clientSecret: string;
    };
  };
  logger: {
    webhookUrl: string;
    sentryDsn: string;
    telegram: {
      botToken: string;
      chatId: string;
    };
  };
}
