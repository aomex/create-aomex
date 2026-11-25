import {
  Logger,
  ConsoleTransport,
  FileTransport,
  StreamTransport,
  WebhookTransport,
} from '@aomex/logger';
import { configs } from '@/configs';
import { SentryTransport } from '@aomex/logger-sentry';
import { TelegramTransport } from '@aomex/logger-telegram';

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
    {
      transport: new StreamTransport({
        stream: process.stdout,
        format: 'text',
      }),
      level: 'info',
    },
    {
      transport: new WebhookTransport({
        url: configs.logger.webhookUrl || 'https://example.com/hook',
      }),
      level: 'error',
      disabled: !configs.logger.webhookUrl,
    },
    {
      transport: new SentryTransport({
        dsn: configs.logger.sentryDsn,
      }),
      level: 'error',
      disabled: !configs.logger.sentryDsn,
    },
    {
      transport: new TelegramTransport({
        botToken: configs.logger.telegram.botToken,
        chatId: configs.logger.telegram.chatId,
      }),
      level: 'error',
      disabled: !configs.logger.telegram.botToken,
    },
  ],
});
