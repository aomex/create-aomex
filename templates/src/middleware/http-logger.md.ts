import { Logger } from '@aomex/common';
import { httpLogger as aomexHttpLogger } from '@aomex/http-logger';

export const httpLogger = aomexHttpLogger({
  transports: [
    new Logger.transport.Console(),
    new Logger.transport.File({ file: 'logs/http/%year%-%month%-%day%/%hour%.log' }),
  ],
});
