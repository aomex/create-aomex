import { rule } from '@aomex/common';
import { query, response, Router } from '@aomex/web';

export const router = new Router();

router.get('/', {
  mount: [
    query({
      user: rule.string().optional(),
    }),
    response({
      statusCode: 200,
      content: rule.string(),
    }),
  ],
  action: (ctx) => {
    const { user = 'World' } = ctx.query;
    ctx.send(`Hello ${user}`);
  },
});
