import { production, type Config } from './production';
import { integration } from './integration';
import { development } from './development';

const configs = {
  production,
  integration,
  development,
};

export const config: Config =
  configs[(process.env['NODE_ENV'] || 'development') as keyof typeof configs];
