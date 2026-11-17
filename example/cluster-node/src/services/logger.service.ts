import { BaseLoggerService, ConsoleTransport } from '@aomex/logger';

export default class LoggerService extends BaseLoggerService {
  protected createTransports(): BaseLoggerService.TransportEntry[] {
    return [
      {
        transport: new ConsoleTransport(),
        level: 'debug',
      },
    ];
  }
}
