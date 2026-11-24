import { rule } from '@aomex/common';
import { Channel, emit, payload } from '@aomex/websocket';

export const channel = new Channel();

channel.on('ping', {
  mount: [
    payload({
      at: rule.int().optional(),
    }),
    emit({
      event: 'pong',
      description: '心跳响应',
      data: {
        at: rule.int(),
      },
    }),
  ],
  action: async (ctx) => {
    await ctx.send('pong', { at: ctx.payload.at ?? Date.now() });
  },
});
