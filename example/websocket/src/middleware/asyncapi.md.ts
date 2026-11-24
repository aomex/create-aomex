import { asyncapiUI } from '@aomex/asyncapi-ui';
import { generateAsyncapi } from '@aomex/asyncapi-generator';
import { readFileSync } from 'node:fs';

// 随机路径：降低被扫到后滥用文档接口的风险；生产环境会 skip
export const asyncapiDocs = asyncapiUI({
  uriPrefix: '/asyncapi-7c3e9a1f02b48d6e',
  asyncapi: () => {
    return generateAsyncapi({
      channels: './src/channels',
      docs: {
        asyncapi: '3.1.0',
        info: {
          title: 'snapshot-demo',
          // 支持 Markdown（内容见项目根目录 asyncapi.md）
          description: readFileSync('./asyncapi.md', 'utf8'),
        },
        servers: {
          local: {
            host: 'localhost:3000',
            protocol: 'ws',
            pathname: '/ws',
          },
        },
      },
    });
  },
});
