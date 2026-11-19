import { shared, type SecretConfig, type FullConfig } from './shared';

/**
 * 密钥配置请放 .env
 */
const secrets = process.env as unknown as SecretConfig;

export const development: FullConfig = {
  ...shared,
  redis: {
    host: 'localhost',
    port: 6379,
    password: secrets.REDIS_PASSWORD || 'abcde',
    db: 0,
  },
};
