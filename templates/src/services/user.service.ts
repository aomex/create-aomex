import { Service } from '@aomex/core';
import { db } from './db';
import { Prisma } from '@prisma/client';

export class UserService extends Service {
  findAll() {
    return db.user.findMany({
      orderBy: [
        {
          id: Prisma.SortOrder.desc,
        },
      ],
    });
  }

  findById(userId: number) {
    return db.user.findUnique({ where: { id: userId } });
  }

  async createUser(name: string, age: number) {
    await db.user.create({
      data: {
        name,
        age,
      },
    });
  }
}
