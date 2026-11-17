import { type RedisOptions } from '@aomex/cache-redis-adapter';
import { shared, type SecretConfig } from './shared';

const secrets = process.env as unknown as SecretConfig;

// 正式环境。对应 main 分支
export const production = {
  ...shared,
  redis: <RedisOptions>{
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
};

export type Config = typeof production;
