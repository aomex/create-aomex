import { registerLifecycle } from '@aomex/common';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const parsed = new URL(process.env['DATABASE_URL']!);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: parseInt(parsed.port || '3306', 10),
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.slice(1),
  connectionLimit: process.env['AOMEX_CLI_MODE'] === '1' ? 15 : 80,
  acquireTimeout: 10_000,
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

/**
 * 管理 Prisma 连接生命周期；业务代码仍可 `import { prisma } from '@/services/prisma.service'`。
 */
await registerLifecycle({
  onInit: () => prisma.$connect(),
  onDestroy: () => prisma.$disconnect(),
});
