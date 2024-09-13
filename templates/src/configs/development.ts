import type { Config } from './production';
import { integration } from './integration';
import type { RedisOptions } from 'ioredis';

// 本地开发环境，对应随意git分支
export const development: Config = {
  ...integration,
  redis: <RedisOptions>{
    host: 'localhost',
    port: 3306,
    password: undefined,
    db: 0,
  },
};
