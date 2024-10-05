import { traceMiddleware } from '@aomex/async-trace';

export const trace = traceMiddleware('生命周期', async (_record) => {
  // 根据 record.delta 上报慢日志
  // console.log(record);
});
