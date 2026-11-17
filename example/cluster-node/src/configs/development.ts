import type { Config, SecretConfig } from './production';
import type { RedisOptions } from '@aomex/cache-redis-adapter';
import { shared } from './shared';

const secrets = process.env as unknown as SecretConfig;

// 本地开发环境，对应随意 git 分支
export const development: Config = {
  ...shared,
  redis: <RedisOptions>{
    host: 'localhost',
    port: 6379,
    password: secrets.REDIS_PASSWORD || 'abcde',
    db: 0,
  },
};
