import type { production } from './production';
/**
 * 多环境共用的通用配置。
 * 各环境文件通过 `...shared` 展开后，再覆盖本环境特有项。
 */
export const shared = {};

export interface SecretConfig {
  REDIS_PASSWORD?: string;
}

export type FullConfig = typeof production;
