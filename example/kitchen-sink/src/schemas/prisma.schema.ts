import { rule, Validator } from '@aomex/common';
import { definePrismaSchema } from '@aomex/prisma';
import { generated } from '@/generated/aomex/prisma';

const articleTags = rule.array(rule.string());

/**
 * Prisma 生成结果的业务入口。需要改字段规则时在第二个参数覆盖。
 */
export const { prismaInput, prismaOutput, prismaEnum } = definePrismaSchema(generated, {
  article: {
    input: (s) => s.extend({ tags: articleTags.nullable() }),
    output: (s) => s.extend({ tags: articleTags.nullable() }),
  },
});

/**
 * Prisma Json 字段类型（prisma-json-types-generator）。
 * schema 里用 `/// [ArticleTags]` 引用。
 */
declare global {
  namespace PrismaJson {
    type ArticleTags = Validator.Infer<typeof articleTags>;
  }
}
