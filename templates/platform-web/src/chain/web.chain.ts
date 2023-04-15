import { chain } from '@aomex/core';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';

export const appChain = chain.web.mount(cors()).mount(compress());

export const routerChain = appChain;
