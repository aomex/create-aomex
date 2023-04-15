import { BaseUserModel } from '@aomex/prisma-model';
import { Prisma } from '@prisma/client';

export class UserModel extends BaseUserModel {
  getById(id: number) {
    return this.table.findFirst({
      where: { id },
    });
  }

  getAll(offset: number, limit: number) {
    return this.table.findMany({
      take: limit,
      skip: offset,
    });
  }

  insert(user: Pick<Prisma.user, 'name' | 'age'>) {
    return this.table.create({
      data: user,
    });
  }
}
