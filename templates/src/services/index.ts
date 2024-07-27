import { combineServices } from '@aomex/core';
import { UserService } from './user.service';
import { CacheService } from './cache.service';

export const services = await combineServices({
  user: UserService,
  cache: CacheService,
});

declare module '@aomex/core' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}
