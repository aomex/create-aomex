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
}

/**
 * 应用运行时配置
 */
export interface AppConfig extends BaseConfig {
  redis: RedisOptions;
}
