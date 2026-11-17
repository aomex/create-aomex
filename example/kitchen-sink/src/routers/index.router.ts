import { Router } from '@aomex/web';

export const router = new Router();

router.get('/', {
  docs: { showInOpenapi: false },
  action: (ctx) => {
    ctx.send('Hello World');
  },
});
