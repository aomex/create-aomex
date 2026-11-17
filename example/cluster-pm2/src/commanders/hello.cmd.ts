import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/common';

export const commander = new Commander();

/**
 * 指令示例
 *
 * pnpm exec aomex hello
 * pnpm exec aomex hello --user World
 * pnpm exec aomex hello -u aomex.js
 */
commander.create('hello', {
  mount: [
    options(
      {
        user: rule.string().default('World'),
      },
      {
        user: ['u'],
      },
    ),
  ],
  action: async (ctx) => {
    const { user } = ctx.options;
    await ctx.logger.info(`Hello ${user}`);
  },
});
