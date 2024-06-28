import { Router } from '@aomex/router';
import { services } from '../services';
import { body, params } from '@aomex/web';
import { rule } from '@aomex/core';

export const router = new Router({
  prefix: '/users',
});

router.get('/', {
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
  ],
  action: async (ctx) => {
    const { id } = ctx.params;
    const user = await services.user.findById(id);
    if (!user) {
      ctx.throw(404, 'user not found');
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
  ],
  action: async (ctx) => {
    const { name, age } = ctx.body;
    await services.user.createUser(name, age);
    ctx.send(201);
  },
});
