import { combineServices } from '@aomex/core';
import { UserService } from './user.service';

export const services = await combineServices({
  user: UserService,
});

declare module '@aomex/core' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}
