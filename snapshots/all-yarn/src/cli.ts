import { ConsoleApp } from '@aomex/console';
import { commanders } from '@aomex/commander';
import { appChain } from './chain/console.chain';

const app = new ConsoleApp();
app.mount(appChain);
app.mount(commanders('./src/commanders'));

await app.run();
process.exit(0);
