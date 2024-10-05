import { rule } from '@aomex/core';
import { response, Router } from '@aomex/web';
import { counter } from '@middleware/counter.md';
import { i18n } from '../i18n';

export const router = new Router();

router.get('/', {
  mount: [
    counter,
    response({
      statusCode: 200,
      content: rule.string(),
    }),
  ],
  action: (ctx) => {
    ctx.send(`${i18n.t('hello', { count: ctx.visitCount })}`);
  },
});
