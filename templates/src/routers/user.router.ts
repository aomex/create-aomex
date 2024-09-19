import { services } from '@services';
import { body, params, response, Router } from '@aomex/web';
import { rule } from '@aomex/core';

export const router = new Router({
  prefix: '/users',
});

router.get('/', {
  mount: [
    response({
      statusCode: 200,
      content: rule.array({
        id: rule.int(),
        name: rule.string(),
        age: rule.int(),
      }),
    }),
  ],
  action: async (ctx) => {
    const users = await services.user.findAll();
    ctx.send(200, users);
  },
});

router.get('/:id', {
  mount: [
    params({
      id: rule.int().min(1),
    }),
    response({
      statusCode: 200,
      content: {
        id: rule.int(),
        name: rule.string(),
        age: rule.int(),
      },
    }),
    response({
      statusCode: 404,
      description: '用户不存在',
    }),
  ],
  action: async (ctx) => {
    const { id } = ctx.params;
    const user = await services.user.findById(id);
    if (!user) {
      return ctx.throw(404, '用户不存在');
    }
    ctx.send(user);
  },
});

router.post('/', {
  mount: [
    body({
      name: rule.string(),
      age: rule.number(),
    }),
    response({
      statusCode: 201,
    }),
  ],
  action: async (ctx) => {
    const { name, age } = ctx.body;
    await services.user.createUser(name, age);
    ctx.send(201, null);
  },
});
