import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/core';
import { cron } from '@aomex/cron';

export const commander = new Commander();

commander.create('schedule', {
  docs: {
    summary: '执行 npx aomex -h 可以看到我',
    description: '执行 npx aomex schedule -h 可以看到我',
  },
  mount: [
    // cron({
    //   second: '*/15',
    // }),
    cron({
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
