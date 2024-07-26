import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/core';
import { schedule } from '@aomex/cron';

export const commander = new Commander();

// npx aomex cron:start
commander.create('schedule', {
  mount: [
    schedule({
      second: '*/5',
    }),
    schedule({
      second: '*/8',
      args: ['--user', 'aomex.js'],
    }),
    options({
      user: rule.string().default('World'),
    }),
  ],
  action: async (ctx) => {
    const { user } = ctx.options;
    console.log(`Hello ${user}`);
    await new Promise((resolve) => {
      setTimeout(resolve, 2_000);
    });
  },
});

commander.create('long:schedule', {
  mount: [
    schedule({
      second: '*/10',
      overlap: true,
    }),
  ],
  action: async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 15_000);
    });
  },
});
