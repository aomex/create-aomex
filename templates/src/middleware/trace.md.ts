import { traceMiddleware } from '@aomex/async-trace';
import type { WebContext } from '@aomex/web';

export const trace = traceMiddleware('生命周期', async (_record, _ctx: WebContext) => {
  // 根据 record.delta 上报慢日志
  // console.log(record);
});
