import { Prisma } from '@/generated/prisma/client';

/**
 * 把指定字段上的 JS `null` 转成 `Prisma.DbNull`，供可空 Json 写入。
 * 新增 Json 字段时把键名加入 `fields` 即可。
 */
export const nullableJsonFields = <T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  fields: readonly K[],
) => {
  const next = { ...data };
  for (const key of fields) {
    if (next[key] === null) {
      (next as Record<string, unknown>)[key as string] = Prisma.DbNull;
    }
  }
  return next as {
    [P in keyof T]: P extends K ? Exclude<T[P], null> | typeof Prisma.DbNull : T[P];
  };
};
