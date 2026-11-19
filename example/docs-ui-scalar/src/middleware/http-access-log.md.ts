import { httpAccessLog as aomexHttpAccessLog } from '@aomex/http-access-log';
import { ConsoleTransport, FileTransport } from '@aomex/logger';

export const httpAccessLog = aomexHttpAccessLog({
  transports: [
    new ConsoleTransport(),
    new FileTransport({ file: 'logs/http/{year}-{month}-{day}/{level}.log' }),
  ],
});
