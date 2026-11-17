import type { RedisOptions } from '@aomex/cache-redis-adapter';
import type { Config } from './production';
import { shared, type SecretConfig } from './shared';

const secrets = process.env as unknown as SecretConfig;

// 线上集成环境，用于功能、交互测试。对应 develop 分支
export const integration: Config = {
  ...shared,
  redis: <RedisOptions>{
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
};
