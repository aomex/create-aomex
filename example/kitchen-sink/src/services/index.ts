import { combineServices } from '@aomex/common';

export const services = await combineServices(
  {
    logger: () => import('./logger.service.js'),
    cache: () => import('./cache.service.js'),
    article: () => import('./article.service.js'),
    google: () => import('./google.service.js'),
    //     microsoft: () => import('./microsoft.service.js'),
    //     apple: () => import('./apple.service.js'),
    github: () => import('./github.service.js'),
    //     discord: () => import('./discord.service.js'),
    //     gitlab: () => import('./gitlab.service.js'),
    //     linkedin: () => import('./linkedin.service.js'),
    //     facebook: () => import('./facebook.service.js'),
    //     twitter: () => import('./twitter.service.js'),
    //     spotify: () => import('./spotify.service.js'),
  },
  { eager: ['cache'] },
);
