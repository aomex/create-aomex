import { rule } from '@aomex/common';
import { defineMongooseModel } from '@aomex/mongoose';

export const ArticleModel = defineMongooseModel('article', {
  schemas: {
    title: rule.string(),
    content: rule.string(),
    summary: rule.string().optional().nullable(),
    published: rule.boolean().default(false),
    tags: rule.array(rule.string()).optional().nullable(),
  },
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  indexes: [{ fields: { title: 1 } }],
});
