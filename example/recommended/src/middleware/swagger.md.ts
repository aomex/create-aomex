import { swaggerUI } from '@aomex/swagger-ui';
import { generateOpenapi } from '@aomex/openapi';
import { app } from '@/web';

// 随机路径：降低被扫到后滥用文档接口的风险；生产环境会 skip
export const swagger = swaggerUI({
  uriPrefix: '/swagger-7c3e9a1f02b48d6e',
  openapi: () => {
    return generateOpenapi({
      routers: './src/routers',
      app,
      docs: {
        info: {
          title: 'snapshot-demo',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    });
  },
});
