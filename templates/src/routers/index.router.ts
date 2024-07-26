import { Router } from '@aomex/web';

export const router = new Router();

router.get('/', {
  action: (ctx) => {
    ctx.send('hello world');
  },
});
