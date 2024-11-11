import { Logger } from '@aomex/common';

export const logger = Logger.create({
  levels: ['debug', 'info', 'warn', 'error'],
  transports: [
    {
      transport: new Logger.transport.Console(),
      level: { from: 'debug' },
    },
    {
      transport: new Logger.transport.File({
        file: `logs/error-%year%-%month%-%day%.log`,
      }),
      level: ['error'],
    },
  ],
});
