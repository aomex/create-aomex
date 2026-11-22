import { Router } from '@aomex/web';

export const router = new Router({
  docs: {
    tags: ['System'],
    deprecated: false,
  },
});

router.get('/', {
  docs: {
    tags: ['System'],
    summary: '健康检查 / 欢迎页',
    description: '简易探活接口，默认不出现在 OpenAPI 文档中。',
    operationId: 'getWelcome',
    deprecated: false,
    externalDocs: {
      description: 'aomex 文档',
      url: 'https://aomex.js.org',
    },
    showInOpenapi: false,
  },
  action: (ctx) => {
    ctx.send('Hello World');
  },
});
