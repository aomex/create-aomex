import { ConsoleApp } from '@aomex/console';
import { commanders } from '@aomex/commander';
import { openapi } from '@aomex/openapi';
import { cron } from '@aomex/cron';
import { traceMiddleware } from '@aomex/async-trace';

const app = new ConsoleApp({
  locale: 'zh_CN',
  mount: [
    cron({
      path: './src/commanders',
      // store: RedisCache,
    }),
    traceMiddleware('生命周期', async (record) => {
      // 根据 record.delta 上报慢日志
      // console.log(record);
    }),
    openapi({
      routers: './src/routers',
      docs: {
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    }),
    commanders('./src/commanders'),
  ],
});

app.on('error', (err) => {
  // 上报错误日志
  app.log(err);
});

const code = await app.run();
process.exit(code);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
function traceMiddleware(arg0: string, arg1: (record: any) => Promise<void>): any {
  throw new Error('Function not implemented.');
}
