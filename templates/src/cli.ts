import { commanders, ConsoleApp } from '@aomex/console';
import { cron } from '@aomex/cron';
import { traceMiddleware } from '@aomex/async-trace';
import { cache } from './services/cache.service';

const app = new ConsoleApp({
  language: 'zh_CN',
  mount: [
    cron({
      commanders: './src/commanders',
      cache: cache,
    }),
    traceMiddleware('生命周期', async (_record) => {
      // 根据 record.delta 上报慢日志
      // console.log(record);
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
