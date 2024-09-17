import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/core';
import { schedule } from '@aomex/cron';

export const commander = new Commander();

commander.create('schedule', {
  mount: [
    // schedule({
    //   second: '*/15',
    // }),
    schedule({
      minute: '*/2',
      args: ['--user', 'Boss'],
    }),
    options({
      user: rule.string().default('World'),
    }),
  ],
  action: async (ctx) => {
    const { user } = ctx.options;
    console.log(`Hello ${user}`);
    await new Promise((resolve) => {
      setTimeout(resolve, 5_000);
    });
  },
});
