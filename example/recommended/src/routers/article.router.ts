import { rule } from '@aomex/common';
import { body, params, response, Router } from '@aomex/web';
import { services } from '@/services';
import { prismaInput } from '@/schemas/prisma.schema';
import { articleSchema } from '@/schemas/article.schema';
import { nullableJsonFields } from '@/utils/prisma-json';

export const router = new Router({
  prefix: '/articles',
});

router.get('/', {
  mount: [
    response({
      statusCode: 200,
      content: rule.array(articleSchema),
    }),
  ],
  action: async (ctx) => {
    const articles = await services.article.findArticles();
    ctx.send(articles);
  },
});

router.get('/:id', {
  mount: [
    params({ id: rule.int() }),
    response({
      statusCode: 200,
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
  mount: [
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags')),
    response({
      statusCode: 201,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(nullableJsonFields(ctx.body, ['tags']));
    ctx.send(201, article);
  },
});

router.patch('/:id', {
  mount: [
    params({ id: rule.int() }),
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags').partial()),
    response({
      statusCode: 200,
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
  mount: [
    params({ id: rule.int() }),
    response({
      statusCode: 204,
    }),
  ],
  action: async (ctx) => {
    await services.article.deleteArticle(ctx.params.id);
    ctx.send(204);
  },
});
