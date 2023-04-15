import { combineModels } from '@aomex/prisma-model';
import { PrismaClient } from '@prisma/client';
import { UserModel } from './user.model';

const db = new PrismaClient();

export const prisma = {
  I_HAVE_TO_USE_IT_OUTSIDE: db,
};

export const models = combineModels(db, {
  user: UserModel,
});
