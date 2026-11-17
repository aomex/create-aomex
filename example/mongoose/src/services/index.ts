import { combineServices } from '@aomex/common';
import './mongoose.service.js';

export const services = await combineServices(
  {
    logger: () => import('./logger.service.js'),
    cache: () => import('./cache.service.js'),
    article: () => import('./article.service.js'),
  },
  { eager: ['logger', 'cache'] },
);
