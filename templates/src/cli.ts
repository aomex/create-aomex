import { commanders, ConsoleApp } from '@aomex/console';
import { crons } from '@aomex/cron';
import { redisCache } from '@services/cache.service';
import { openapi } from '@aomex/openapi';
import { logger } from '@services/logger';

const app = new ConsoleApp({
  language: 'zh_CN',
  mount: [
    crons({
      commanders: './src/commanders',
      cache: redisCache,
      port: {{cronPort}},
    }),
    openapi({ routers: './src/routers' }),
    commanders('./src/commanders'),
  ],
});

app.on('error', (err) => {
  logger.error(err.stack || '');
});

const code = await app.run();
await logger.complete();
process.exit(code);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
