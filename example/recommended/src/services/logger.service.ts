import { Logger, ConsoleTransport, FileTransport } from '@aomex/logger';

export const logger = new Logger({
  transports: [
    {
      transport: new ConsoleTransport(),
      level: 'debug',
    },
    {
      transport: new FileTransport({
        file: 'logs/error-{year}-{month}-{day}.log',
      }),
      level: 'error',
    },
  ],
});
