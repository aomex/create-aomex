import { Commander } from '@aomex/commander';
import { commanderChain } from '../middleware/console.chain';

export const commander = new Commander({
  mount: commanderChain,
});

commander.create('hello', {
  async action(_ctx) {
    console.log('Hello World');
  },
});
