import 'dotenv/config';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { commanders, ConsoleApp } from '@aomex/console';
import { services } from '@/services';
import { crons } from '@aomex/cron';
import { configs } from '@/configs';

const app = new ConsoleApp({
  services,
  logger: services.logger,
  language: 'zh-CN',
  mount: [
    crons({
      commanders: './src/commanders',
      // 随机高位端口，降低与本机服务冲突、被扫到的概率
      port: 23456,
      store: new CacheRedisAdapter(configs.redis),
    }),
    commanders('./src/commanders'),
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});

const code = await app.run();
process.exit(code);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
