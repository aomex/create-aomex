import 'dotenv/config';
import { commanders, ConsoleApp } from '@aomex/console';
import { services } from '@/services';

const app = new ConsoleApp({
  services,
  logger: services.logger,
  language: 'zh-CN',
  mount: [commanders('./src/commanders')],
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
