import { Router } from '@aomex/router';
import { routerChain } from '../middleware/web.chain';

export const router = new Router({
  mount: routerChain,
});

router.get('/', {
  async action(ctx) {
    ctx.send('hello world');
  },
});

router.post('/', {
  async action(ctx) {
    ctx.send(201, { id: 1 });
  },
});
