import type { Config } from './production';
import { integration } from './integration';

// 本地开发环境，对应随意git分支
export const development: Config = {
  ...integration,
};
