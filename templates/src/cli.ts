import { ConsoleApp } from '@aomex/console';
import { commanders } from '@aomex/commander';
import { openapi } from '@aomex/openapi';
import { cron } from '@aomex/cron';

const app = new ConsoleApp({
  locale: 'zh_CN',
  mount: [
    openapi({
      routers: './src/routers',
      docs: {
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    }),
    cron({
      path: './src/commanders',
      // store: RedisCache,
    }),
    commanders('./src/commanders'),
  ],
});

app.on('error', (err) => {
  // 上报错误日志
  app.log(err);
});

await app.run();
process.exit(0);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
