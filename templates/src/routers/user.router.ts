import { rule } from '@aomex/common';
import { body, response, Router } from '@aomex/web';
import { services } from '@services';
import { prismaInput, prismaOutput } from '../generated/aomex/prisma';

export const router = new Router({
  prefix: '/users',
});

router.get('/', {
  mount: [
    response({
      statusCode: 200,
      content: rule.array(prismaOutput.user.columns),
    }),
  ],
  action: async (ctx) => {
    const users = await services.user.findUsers();
    ctx.send(users);
  },
});

router.post('/', {
  mount: [
    body({
      ...prismaInput.user.pick('name', 'age'),
    }),
    response({
      statusCode: 201,
      content: prismaOutput.user.columns,
    }),
  ],
  action: async (ctx) => {
    const user = await services.user.createUser(ctx.body);
    ctx.send(201, user);
  },
});
