import { combineServices } from '@aomex/common';

export const services = await combineServices({
  passport: () => import('./passport.service.js'),
  article: () => import('./article.service.js'),
  github: () => import('./github.service.js'),
  google: () => import('./google.service.js'),
});
