import { httpAccessLog as createHttpAccessLog } from '@aomex/access-log';
import { websocketAccessLog as createWebsocketAccessLog } from '@aomex/access-log/websocket';
import { ConsoleTransport, FileTransport } from '@aomex/logger';

export const accessLog = createHttpAccessLog({
  transports: [
    new ConsoleTransport(),
    new FileTransport({ file: 'logs/http/{year}-{month}-{day}/{level}.log' }),
  ],
});

export const wsAccessLog = createWebsocketAccessLog({
  transports: [
    new ConsoleTransport(),
    new FileTransport({ file: 'logs/ws/{year}-{month}-{day}/{level}.log' }),
  ],
});
