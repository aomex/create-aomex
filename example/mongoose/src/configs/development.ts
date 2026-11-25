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
};
