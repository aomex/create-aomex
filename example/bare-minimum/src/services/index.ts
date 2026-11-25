import { combineServices } from '@aomex/common';

export const services = await combineServices({
  passport: () => import('./passport.service.js'),
});
