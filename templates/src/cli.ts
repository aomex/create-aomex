import { ConsoleApp } from '@aomex/console';
import { appChain } from './middleware/console.chain';

const app = new ConsoleApp({
  locale: 'zh_CN',
  mount: appChain,
});

await app.run();
process.exit(0);
