import { combineServices } from '@aomex/common';
import { CacheService } from './cache.service';
import { UserService } from './user.service';

export const services = await combineServices({
  cache: CacheService,
  user: UserService,
});

declare module '@aomex/common' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}
