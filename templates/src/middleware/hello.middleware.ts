import { middleware } from '@aomex/core';

let counter = 0;

export const hello = middleware.web<{ visitCount: number }>(async (ctx, next) => {
  ctx.visitCount = ++counter;
  await next();
});
