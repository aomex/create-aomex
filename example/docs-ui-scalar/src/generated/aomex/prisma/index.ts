// @ts-nocheck
/**
 * 由 aomex-prisma 自动生成，请勿修改。
 *
 * 请在业务侧创建 src/schemas/prisma.schema.ts，通过 definePrismaSchema() 解包后再使用：
 *
 * ```ts
 * // src/schemas/prisma.schema.ts
 * import { definePrismaSchema } from '@aomex/prisma';
 * import { generated } from '../generated/aomex/prisma';
 *
 * export const { prismaInput, prismaOutput, prismaEnum } = definePrismaSchema(
 *   generated,
 *   {
 *     user: {
 *       input: (s) => s.extend({ password: rule.string() }),
 *       output: (s) => s.omit('password'),
 *     },
 *   },
 * );
 * ```
 *
 * 本文件仅导出 generated；不要直接当路由 schema / enum 使用。
 */
import { rule, schema, type ValidatorSchema } from '@aomex/common';
import type { PrismaGeneratedSchemas } from '@aomex/prisma';

const prismaEnum = {};

const articleInputColumns = {
  /**
   * Prisma类型：`Int`
   *
   * 数据库默认值：`autoincrement()`
   */
  id: rule.int().optional(),

  /**
   * Prisma类型：`String`
   *
   * 数据库默认值：
   */
  title: rule.string(),

  /**
   * Prisma类型：`String`
   *
   * 数据库默认值：
   */
  content: rule.string(),

  /**
   * Prisma类型：`String?`
   *
   * 数据库默认值：
   */
  summary: rule.string().optional().nullable(),

  /**
   * Prisma类型：`Boolean`
   *
   * 数据库默认值：`false`
   */
  published: rule.boolean().optional(),

  /**
   * Prisma类型：`Json?`
   *
   * 数据库默认值：
   *
   * [ArticleTags]
   */
  tags: rule
    .anyOf([rule.object(), rule.array()])
    .optional()
    .nullable()
    .docs({ description: '[ArticleTags]' }),

  /**
   * Prisma类型：`DateTime`
   *
   * 数据库默认值：`now()`
   */
  created_at: rule.date().optional(),

  /**
   * Prisma类型：`DateTime`
   *
   * 数据库默认值：`now()`
   */
  updated_at: rule.date().optional(),
};
const articleInputSchema: ValidatorSchema<typeof articleInputColumns> =
  schema(articleInputColumns).asName('articleInput');

const articleOutputColumns = {
  /**
   * Prisma类型：`Int`
   *
   * 数据库默认值：`autoincrement()`
   */
  id: rule.int(),

  /**
   * Prisma类型：`String`
   *
   * 数据库默认值：
   */
  title: rule.string(),

  /**
   * Prisma类型：`String`
   *
   * 数据库默认值：
   */
  content: rule.string(),

  /**
   * Prisma类型：`String?`
   *
   * 数据库默认值：
   */
  summary: rule.string().nullable(),

  /**
   * Prisma类型：`Boolean`
   *
   * 数据库默认值：`false`
   */
  published: rule.boolean(),

  /**
   * Prisma类型：`Json?`
   *
   * 数据库默认值：
   *
   * [ArticleTags]
   */
  tags: rule.anyOf([rule.object(), rule.array()]).nullable().docs({ description: '[ArticleTags]' }),

  /**
   * Prisma类型：`DateTime`
   *
   * 数据库默认值：`now()`
   */
  created_at: rule.date(),

  /**
   * Prisma类型：`DateTime`
   *
   * 数据库默认值：`now()`
   */
  updated_at: rule.date(),
};
const articleOutputSchema: ValidatorSchema<typeof articleOutputColumns> =
  schema(articleOutputColumns).asName('articleOutput');

const prismaInput = {
  article: articleInputSchema,
};

const prismaOutput = {
  article: articleOutputSchema,
};

export const generated = {
  prismaInput,
  prismaOutput,
  prismaEnum,
} as unknown as PrismaGeneratedSchemas<typeof prismaInput, typeof prismaOutput, typeof prismaEnum>;
