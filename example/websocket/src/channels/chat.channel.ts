import { rule } from '@aomex/common';
import { Channel, emit, payload } from '@aomex/websocket';

export const channel = new Channel();

channel.on('room.join', {
  mount: [
    payload({
      roomId: rule.string(),
    }),
    emit({
      event: 'room.joined',
      description: '进房成功',
      data: {
        roomId: rule.string(),
        clientId: rule.string(),
      },
    }),
  ],
  action: async (ctx) => {
    const { roomId } = ctx.payload;
    await ctx.client.join(roomId);
    await ctx.send('room.joined', { roomId, clientId: ctx.client.id });
  },
});

channel.on('chat.send', {
  mount: [
    payload({
      roomId: rule.string(),
      text: rule.string().max(2000),
    }),
    emit({
      event: 'chat.message',
      description: '房间内聊天消息',
      data: {
        from: rule.string(),
        text: rule.string(),
      },
    }),
  ],
  action: async (ctx) => {
    const { roomId, text } = ctx.payload;
    await ctx
      .room(roomId)
      .send('chat.message', { from: ctx.client.id, text }, { except: ctx.client });
  },
});
