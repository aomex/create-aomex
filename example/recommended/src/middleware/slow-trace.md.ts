import { asyncTrace, traceMiddleware } from '@aomex/async-trace';
import type { WebContext } from '@aomex/web';
import { logger } from '@/services/logger.service';

export const slowTrace = traceMiddleware('链路追踪', async (record, ctx: WebContext) => {
  if (record.duration > 1_000) {
    const stack = asyncTrace.toStack(record.children);
    void logger.warn(
      `${ctx.request.method} ${ctx.request.pathname} ${record.duration}ms\n\n${stack}`,
    );
  }
});
