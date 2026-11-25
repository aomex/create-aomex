import { baseConfig, type EnvSecrets, type AppConfig } from './shared';

/**
 * 密钥配置请放 .env
 */
const secrets = process.env as unknown as EnvSecrets;

export const development: AppConfig = {
  ...baseConfig,
  database: secrets.DATABASE_URL || '',
  redis: {
    host: 'localhost',
    port: 6379,
    password: secrets.REDIS_PASSWORD || 'abcde',
    db: 0,
  },
  oauth: {
    github: {
      clientId: secrets.GITHUB_CLIENT_ID || 'change-me',
      clientSecret: secrets.GITHUB_CLIENT_SECRET || 'change-me',
    },
    google: {
      clientId: secrets.GOOGLE_CLIENT_ID || 'change-me',
      clientSecret: secrets.GOOGLE_CLIENT_SECRET || 'change-me',
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
