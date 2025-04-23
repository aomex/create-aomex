import { traceMiddleware } from '@aomex/async-trace';
import type { WebContext } from '@aomex/web';

export const slowTrace = traceMiddleware('生命周期', async (record, _ctx: WebContext) => {
  if (record.delta > 2_000) {
    // 上报慢日志
  }
});
