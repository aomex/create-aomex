import { mdchain } from '@aomex/core';
import { openapiGenerator } from './openapi.md';
import { commanders } from '@aomex/commander';

export const appChain = mdchain.console
  .mount(openapiGenerator)
  .mount(commanders('./src/commanders'));

export const commanderChain = appChain.mount(null);
