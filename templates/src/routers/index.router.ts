import { Router } from '@aomex/web';
import { hello } from '@middleware/hello.middleware';

export const router = new Router();

router.get('/', {
  mount: [hello],
  action: (ctx) => {
    ctx.send(`hello world, ${ctx.visitCount}`);
  },
});
