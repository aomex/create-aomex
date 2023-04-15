import { Router } from '@aomex/router';
import { body, query, response } from '@aomex/web';
import { rule } from '@aomex/core';
import { routerChain } from '../chain/web.chain';
import { services } from '../services';
import { models } from '../models';

export const router = new Router({
  mount: routerChain,
  prefix: '/users',
});

router.get('/', {
  mount: [
    query({
      page: rule.int().default(1).docs({ description: 'Current Page' }),
      pageSize: rule.int().default(10).min(5),
    }),
    response({
      statusCode: 200,
      contentType: 'json',
      schema: rule.array(models.user.fields),
    }),
  ],
  async action(ctx) {
    const { page, pageSize } = ctx.query;
    const users = await services.user.getAll(page, pageSize);
    ctx.send(users);
  },
});

router.post('/', {
  mount: [
    body({
      name: models.user.fields.name,
      age: models.user.fields.age,
    }),
    response({
      statusCode: 201,
      contentType: 'json',
      schema: {
        id: models.user.fields.id,
      },
    }),
  ],
  async action(ctx) {
    const { id } = await services.user.save(ctx.body);
    ctx.send(201, { id });
  },
});
