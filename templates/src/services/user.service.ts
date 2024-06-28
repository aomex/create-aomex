import { Service } from '@aomex/core';
import { db } from './db';
import { Prisma } from '@prisma/client';
import { traceMethod } from '@aomex/async-trace';

export class UserService extends Service {
  @traceMethod('User.findAll')
  async findAll() {
    return db.user.findMany({
      orderBy: [
        {
          id: Prisma.SortOrder.desc,
        },
      ],
    });
  }

  @traceMethod((userId) => `User.find(${userId})`)
  async findById(userId: number) {
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
