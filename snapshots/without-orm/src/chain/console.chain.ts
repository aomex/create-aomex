import { chain } from '@aomex/core';
import { openapiMiddleware } from '../middleware/openapi.middleware';

export const appChain = chain.console.mount(openapiMiddleware);

export const commanderChain = appChain.mount(null);
