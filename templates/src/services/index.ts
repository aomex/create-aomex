import { combineServices } from '@aomex/common';
import { CacheService } from './cache.service';

export const services = await combineServices({
  cache: CacheService,
});

declare module '@aomex/common' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}
