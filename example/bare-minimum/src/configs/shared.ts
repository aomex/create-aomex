import type { RedisOptions } from '@aomex/cache-redis-adapter';

/**
 * 多环境共用的通用配置。
 * 各环境文件通过 `...shared` 展开后，再覆盖本环境特有项。
 */
export const shared = {
  // timeout: 30_000,
};

/**
 * 各环境密钥配置，来自.env*、Aws Secret Manager、Vault 等。
 */
export interface SecretConfig {
  REDIS_PASSWORD: string;
}

type SharedConfig = typeof shared;

/**
 * 各环境完整配置
 */
export interface FullConfig extends SharedConfig {
  redis: RedisOptions;
}
