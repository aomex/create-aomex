import type { RedisOptions } from '@aomex/cache-redis-adapter';
import { shared, type SecretConfig, type FullConfig } from './shared';

/**
 * 密钥配置请放 .env.integration，需在集成服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as SecretConfig;

export const integration: FullConfig = {
  ...shared,
  redis: <RedisOptions>{
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
};
