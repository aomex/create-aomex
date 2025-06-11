import { rule } from '@aomex/common';
import { response, Router } from '@aomex/web';

export const router = new Router();

router.get('/', {
  docs: { showInOpenapi: false },
  mount: [
    response({
      statusCode: 200,
      content: rule.string(),
    }),
  ],
  action: (ctx) => {
    ctx.send('Hello World');
  },
});
