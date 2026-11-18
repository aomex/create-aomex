import 'dotenv/config';
import type { FullConfig } from './shared';

const env = (process.env['NODE_ENV'] || 'development') as
  'development' | 'production' | 'integration';

const configList = await import(`./${env}.js`);

export const configs = configList[env] as FullConfig;
