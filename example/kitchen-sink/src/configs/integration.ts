import { baseConfig, type EnvSecrets, type AppConfig } from './shared';

/**
 * 密钥配置请放 .env.integration，需在集成服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as EnvSecrets;

export const integration: AppConfig = {
  ...baseConfig,
  database: secrets.DATABASE_URL || '',
  redis: {
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
  oauth: {
    github: {
      clientId: secrets.GITHUB_CLIENT_ID || '',
      clientSecret: secrets.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: secrets.GOOGLE_CLIENT_ID || '',
      clientSecret: secrets.GOOGLE_CLIENT_SECRET || '',
    },
  },
  logger: {
    webhookUrl: secrets.LOG_WEBHOOK_URL || '',
    sentryDsn: secrets.SENTRY_DSN || '',
    telegram: {
      botToken: secrets.TELEGRAM_BOT_TOKEN || '',
      chatId: secrets.TELEGRAM_CHAT_ID || '',
    },
  },
};
