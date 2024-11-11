import { middleware } from '@aomex/common';

let _counter = 0;

export const counter = middleware.mixin<{ readonly visitCount: number }>(async (ctx, next) => {
  ctx.visitCount = ++_counter;
  await next();
});
