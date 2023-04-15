import { openapi } from '@aomex/openapi';

export const openapiMiddleware = openapi({
  routers: ['./src/routers'],
  docs: {
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local',
      },
    ],
  },
});
