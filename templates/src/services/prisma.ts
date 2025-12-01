import { PrismaClient } from '../generated/prisma/client';
import * as runtime from '@prisma/client/runtime/client';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const config = new URL(process.env['DATABASE_URL']!);
const adapter = new PrismaMariaDb({
  host: config.hostname,
  port: parseInt(config.port),
  user: config.username,
  password: config.password,
  database: config.pathname.slice(1),
});

export const prisma = new PrismaClient({
  adapter,
});

export type PrismaTX = Omit<PrismaClient, runtime.ITXClientDenyList>;
