import { Service } from '@aomex/core';
import { db } from './db';

export class UserService extends Service {
  findAll() {
    return db.user.findAll();
  }

  findById(userId: number) {
    return db.user.findUnique({ where: { id: userId } });
  }
}
