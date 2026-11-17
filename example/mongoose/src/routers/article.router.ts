import { rule } from '@aomex/common';
import { body, params, response, Router } from '@aomex/web';
import { services } from '@/services';

const articleSchema = rule.object({
  _id: rule.string(),
  title: rule.string(),
  content: rule.string(),
  summary: rule.string().nullable(),
  published: rule.boolean(),
  tags: rule.array(rule.string()).nullable(),
});

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
    params({ id: rule.string() }),
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
    body({
      title: rule.string(),
      content: rule.string(),
      summary: rule.string().optional().nullable(),
      published: rule.boolean().optional(),
      tags: rule.array(rule.string()).optional().nullable(),
    }),
    response({
      statusCode: 201,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(ctx.body);
    ctx.send(201, article);
  },
});

router.patch('/:id', {
  mount: [
    params({ id: rule.string() }),
    body({
      title: rule.string().optional(),
      content: rule.string().optional(),
      summary: rule.string().optional().nullable(),
      published: rule.boolean().optional(),
      tags: rule.array(rule.string()).optional().nullable(),
    }),
    response({
      statusCode: 200,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.updateArticle(ctx.params.id, ctx.body);
    ctx.send(article);
  },
});

router.delete('/:id', {
  mount: [
    params({ id: rule.string() }),
    response({
      statusCode: 204,
    }),
  ],
  action: async (ctx) => {
    await services.article.deleteArticle(ctx.params.id);
    ctx.send(204);
  },
});
