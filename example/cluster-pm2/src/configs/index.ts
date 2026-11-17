import 'dotenv/config';
import type { Config } from './production';

const env = (process.env['NODE_ENV'] || 'development') as
  'development' | 'production' | 'integration';

const configList = await import(`./${env}.js`);

export const configs = configList[env] as Config;
