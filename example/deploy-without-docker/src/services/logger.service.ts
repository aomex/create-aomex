import { Logger, ConsoleTransport } from '@aomex/logger';

export const logger = new Logger({
  transports: [
    {
      transport: new ConsoleTransport(),
      level: 'debug',
    },
  ],
});
