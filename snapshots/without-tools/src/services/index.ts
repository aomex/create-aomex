import { combineServices } from '@aomex/service';
import { UserService } from './user.service';

declare module '@aomex/service' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}

export const services = combineServices({
  user: UserService,
});
