import { swaggerUI } from '@aomex/swagger-ui';
import { generateOpenapi } from '@aomex/openapi';
import { readFileSync } from 'node:fs';
import { app } from '@/web';

// 随机路径：降低被扫到后滥用文档接口的风险；生产环境会 skip
export const docs = swaggerUI({
  uriPrefix: '/swagger-7c3e9a1f02b48d6e',
  openapi: () => {
    return generateOpenapi({
      routers: './src/routers',
      app,
      docs: {
        info: {
          title: 'snapshot-demo',
          // 支持 Markdown（内容见项目根目录 openapi.md）
          description: readFileSync('./openapi.md', 'utf8'),
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    });
  },
});
