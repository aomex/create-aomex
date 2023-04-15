import { Service } from '@aomex/service';
import { Prisma } from '@prisma/client';
import { models } from '../models';

export class UserService extends Service {
  getById(id: number) {
    // console.log(this.services.user);
    return models.user.getById(id);
  }

  getAll(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    return models.user.getAll(offset, limit);
  }

  save(user: Pick<Prisma.user, 'name' | 'age'>) {
    return models.user.insert(user);
  }
}
