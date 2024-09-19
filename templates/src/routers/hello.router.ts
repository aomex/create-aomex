import { rule } from '@aomex/core';
import { response, Router } from '@aomex/web';
import { hello } from '@middleware/hello.middleware';

export const router = new Router();

router.get('/', {
  mount: [
    hello,
    response({
      statusCode: 200,
      content: rule.string(),
    }),
  ],
  action: (ctx) => {
    ctx.send(`hello world, ${ctx.visitCount}`);
  },
});
