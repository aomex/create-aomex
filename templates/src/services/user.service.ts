import { Service } from '@aomex/core';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { traceMethod } from '@aomex/async-trace';

export class UserService extends Service {
  @traceMethod('User.findAll')
  async findAll() {
    return prisma.user.findMany({
      orderBy: [
        {
          id: Prisma.SortOrder.desc,
        },
      ],
    });
  }

  @traceMethod((userId) => `User.find(${userId})`)
  async findById(userId: number) {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async createUser(name: string, age: number) {
    await prisma.user.create({
      data: {
        name,
        age,
      },
    });
  }
}
