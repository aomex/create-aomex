import { BaseLoggerService, ConsoleTransport, FileTransport } from '@aomex/logger';

export default class LoggerService extends BaseLoggerService {
  protected createTransports(): BaseLoggerService.TransportEntry[] {
    return [
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
    ];
  }
}
