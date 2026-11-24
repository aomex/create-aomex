import { combineServices } from '@aomex/common';

export const services = await combineServices(
  {
    logger: () => import('./logger.service.js'),
    cache: () => import('./cache.service.js'),
    article: () => import('./article.service.js'),
    github: () => import('./github.service.js'),
    google: () => import('./google.service.js'),
  },
  { eager: ['cache'] },
);
