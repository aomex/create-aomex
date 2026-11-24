import { baseConfig, type AppConfig, type EnvSecrets } from './shared';

/**
 * 密钥配置请放 .env.production，需在生产服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as EnvSecrets;

export const production: AppConfig = {
  ...baseConfig,
  redis: {
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
};
