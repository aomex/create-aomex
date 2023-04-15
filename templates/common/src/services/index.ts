import { combineServices } from '@aomex/service';
import { ExampleService } from './example.service';

declare module '@aomex/service' {
  type T = typeof services;
  export interface CombinedServices extends T {}
}

export const services = combineServices({
  example: ExampleService,
});
