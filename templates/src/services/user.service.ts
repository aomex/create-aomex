import { Service } from '@aomex/common';
import { prisma } from './prisma';
import type { Prisma } from '../generated/prisma/client';

export class UserService extends Service {
  async findUsers() {
    return await prisma.user.findMany();
  }

  async findUserById(id: number) {
    return await prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async createUser(data: Prisma.userCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  async updateUser(id: number, data: Prisma.userUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }
}
