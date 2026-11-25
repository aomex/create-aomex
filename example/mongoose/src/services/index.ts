import { combineServices } from '@aomex/common';
import './mongoose.service.js';

export const services = await combineServices({
  passport: () => import('./passport.service.js'),
  article: () => import('./article.service.js'),
});
