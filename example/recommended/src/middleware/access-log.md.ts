import { httpAccessLog as createHttpAccessLog } from '@aomex/access-log';
import { ConsoleTransport, FileTransport } from '@aomex/logger';

export const accessLog = createHttpAccessLog({
  transports: [
    new ConsoleTransport(),
    new FileTransport({ file: 'logs/http/{year}-{month}-{day}/{level}.log' }),
  ],
});
