import { rule } from '@aomex/common';
import { body, params, response, Router } from '@aomex/web';
import { services } from '@/services';
import { prismaInput } from '@/schemas/prisma.schema';
import { articleSchema } from '@/schemas/article.schema';
import { nullableJsonFields } from '@/utils/prisma-json';

export const router = new Router({
  prefix: '/articles',
  docs: {
    tags: ['Article'],
    deprecated: false,
  },
});

router.get('/', {
  docs: {
    tags: ['Article'],
    summary: '文章列表',
    description: '获取全部文章，按创建时间倒序。',
    operationId: 'listArticles',
    deprecated: false,
    externalDocs: {
      description: 'aomex 文档',
      url: 'https://aomex.js.org',
    },
    showInOpenapi: true,
  },
  mount: [
    response({
      statusCode: 200,
      description: '文章列表',
      content: rule.array(articleSchema),
    }),
  ],
  action: async (ctx) => {
    const articles = await services.article.findArticles();
    ctx.send(articles);
  },
});

router.get('/:id', {
  docs: {
    tags: ['Article'],
    summary: '文章详情',
    description: '按 ID 查询单篇文章；不存在时返回 404。',
    operationId: 'getArticle',
    deprecated: false,
    showInOpenapi: true,
  },
  mount: [
    params({ id: rule.int().docs({ description: '文章 ID', example: 1 }) }),
    response({
      statusCode: 200,
      description: '文章详情',
      content: articleSchema,
    }),
    response({
      statusCode: 404,
      description: '文章不存在',
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.findArticleById(ctx.params.id);
    if (!article) return ctx.throw(404);
    ctx.send(article);
  },
});

router.post('/', {
  docs: {
    tags: ['Article'],
    summary: '创建文章',
    description: '创建一篇新文章并返回完整记录。',
    operationId: 'createArticle',
    deprecated: false,
    showInOpenapi: true,
  },
  mount: [
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags')),
    response({
      statusCode: 201,
      description: '创建成功',
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(nullableJsonFields(ctx.body, ['tags']));
    ctx.send(201, article);
  },
});

router.patch('/:id', {
  docs: {
    tags: ['Article'],
    summary: '更新文章',
    description: '按 ID 部分更新文章字段。',
    operationId: 'updateArticle',
    deprecated: false,
    showInOpenapi: true,
  },
  mount: [
    params({ id: rule.int().docs({ description: '文章 ID', example: 1 }) }),
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags').partial()),
    response({
      statusCode: 200,
      description: '更新后的文章',
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.updateArticle(
      ctx.params.id,
      nullableJsonFields(ctx.body, ['tags']),
    );
    ctx.send(article);
  },
});

router.delete('/:id', {
  docs: {
    tags: ['Article'],
    summary: '删除文章',
    description: '按 ID 删除文章；成功无响应体。',
    operationId: 'deleteArticle',
    deprecated: false,
    showInOpenapi: true,
  },
  mount: [
    params({ id: rule.int().docs({ description: '文章 ID', example: 1 }) }),
    response({
      statusCode: 204,
      description: '删除成功',
    }),
  ],
  action: async (ctx) => {
    await services.article.deleteArticle(ctx.params.id);
    ctx.send(204);
  },
});
