import 'dotenv/config';
import { commanders, ConsoleApp } from '@aomex/console';
import { services } from '@/services';
import { crons } from '@aomex/cron';
import { cache } from '@/services/cache.service';
import { logger } from '@/services/logger.service';

const app = new ConsoleApp({
  services,
  logger,
  language: 'zh-CN',
  mount: [
    crons({
      commanders: './src/commanders',
      // 随机高位端口，降低与本机服务冲突、被扫到的概率
      port: 23456,
      store: cache,
    }),
    commanders('./src/commanders'),
  ],
});

process.on('uncaughtException', (err) => {
  void logger.fatal(err);
});

const code = await app.run();
process.exit(code);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
