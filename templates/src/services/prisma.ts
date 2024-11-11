import { PrismaClient } from '@prisma/client';
import * as runtime from '@prisma/client/runtime/library';

export const prisma = new PrismaClient({
  log: ['warn'],
});

export type PrismaTX = Omit<PrismaClient, runtime.ITXClientDenyList>;
