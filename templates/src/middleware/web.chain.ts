import { mdchain } from '@aomex/core';
import { cors } from '@aomex/cors';
import { compress } from '@aomex/compress';
import { routers } from '@aomex/router';
import { httpLogger } from '@aomex/http-logger';
import { helmet } from '@aomex/helmet';
import { etag } from '@aomex/etag';

export const appChain = mdchain.web
  .mount(cors())
  .mount(compress())
  .mount(httpLogger())
  .mount(etag())
  .mount(helmet())
  .mount(routers('./src/routers'));

export const routerChain = appChain;
