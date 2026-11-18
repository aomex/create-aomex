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
          description: `
# snapshot-demo

> Type-safe API powered by aomex：路由、中间件、校验、文档一站式可观测。

## Capabilities

| 模块 | 说明 |
| --- | --- |
| **Routers** | 声明式路由与参数校验 |
| **Middleware** | 链式组合，可观测可复用 |
| **OpenAPI** | 由源码自动生成，与实现同步 |

## Quick Start

\`\`\`bash
pnpm dev
# 打开本页即可调试接口
\`\`\`

---

*Built with [aomex](https://aomex.js.org) · Type-safe · Production-ready*
`.trim(),
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    });
  },
});
