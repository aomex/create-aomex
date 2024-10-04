import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/core';
import { cron } from '@aomex/cron';
import timers from 'node:timers/promises';

export const commander = new Commander();

/**
 * 指令示例
 *
 * npx aomex hello
 * npx aomex hello --user World
 * npx aomex hello -u aomex.js
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
    console.log(`Hello ${user}`);
  },
});

/**
 * 定时任务示例
 *
 * npx aomex cron:start 启动
 * npx aomex cron:stop 结束
 * npx aomex cron:stats 运行状态
 * npx aomex cron:eject 查看列表
 */
commander.create('hello:cron', {
  docs: {
    summary: '执行 npx aomex -h 可以看到我',
    description: '执行 npx aomex hello:cron -h 可以看到我',
  },
  mount: [
    // cron({ second: '*/15' }),
    cron({ minute: '*', args: ['--user', 'Boss'] }),
    options({
      user: rule.string().default('World'),
    }),
  ],
  action: async (ctx) => {
    const { user } = ctx.options;
    console.log(`Hello ${user}`);
    await timers.setTimeout(5_000);
  },
});
