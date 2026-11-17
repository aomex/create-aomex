import {
  BaseLoggerService,
  ConsoleTransport,
  FileTransport,
  StreamTransport,
  WebhookTransport,
} from '@aomex/logger';
import { SentryTransport } from '@aomex/logger-sentry';
import { TelegramTransport } from '@aomex/logger-telegram';

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
      {
        transport: new StreamTransport({
          stream: process.stdout,
          format: 'text',
        }),
        level: 'info',
      },
      {
        transport: new WebhookTransport({
          url: process.env['LOG_WEBHOOK_URL'] || 'https://example.com/hook',
        }),
        level: 'error',
        disabled: !process.env['LOG_WEBHOOK_URL'],
      },
      {
        transport: new SentryTransport({
          dsn: process.env['SENTRY_DSN'] || '',
        }),
        level: 'error',
        disabled: !process.env['SENTRY_DSN'],
      },
      {
        transport: new TelegramTransport({
          botToken: process.env['TELEGRAM_BOT_TOKEN'] || '',
          chatId: process.env['TELEGRAM_CHAT_ID'] || '',
        }),
        level: 'error',
        disabled: !process.env['TELEGRAM_BOT_TOKEN'],
      },
    ];
  }
}
