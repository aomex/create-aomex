import { randomBytes } from 'node:crypto';
import type {
  AuthStrategy,
  ClusterStrategy,
  ConsoleMiddleware,
  DefaultLanguage,
  DocsUI,
  LoggerTransport,
  Orm,
  PackageManager,
  PrismaDatabase,
  ScaffoldOptions,
  WebPlugin,
} from './types';
import { scaffoldText } from './scaffold-locale';

/** 本地执行依赖二进制：pnpm/yarn → `* exec`，npm → `npm exec --`（避免 npx） */
export const packageManagerExec = (pm: PackageManager): string => {
  if (pm === 'pnpm') return 'pnpm exec';
  if (pm === 'yarn') return 'yarn exec';
  return 'npm exec --';
};

export const prismaAdapterMeta = (
  db: PrismaDatabase,
): {
  adapterPkg?: string;
  driverPkgs: string[];
  importLines: string[];
  createAdapter: string;
  useAdapter: boolean;
} => {
  switch (db) {
    case 'mysql':
      return {
        adapterPkg: '@prisma/adapter-mariadb',
        driverPkgs: [],
        importLines: [
          `import { PrismaMariaDb } from '@prisma/adapter-mariadb';`,
        ],
        createAdapter: `const parsed = new URL(process.env['DATABASE_URL']!);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: parseInt(parsed.port || '3306', 10),
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.slice(1),
  connectionLimit: process.env['AOMEX_CLI_MODE'] === '1' ? 15 : 80,
  acquireTimeout: 10_000,
  allowPublicKeyRetrieval: true,
});`,
        useAdapter: true,
      };
    case 'postgresql':
    case 'cockroachdb':
      return {
        adapterPkg: '@prisma/adapter-pg',
        driverPkgs: ['pg@^8.23.1'],
        importLines: [
          `import { PrismaPg } from '@prisma/adapter-pg';`,
          `import pg from 'pg';`,
        ],
        createAdapter: `const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL']! });
const adapter = new PrismaPg(pool);`,
        useAdapter: true,
      };
    case 'sqlite':
      return {
        adapterPkg: '@prisma/adapter-better-sqlite3',
        driverPkgs: ['better-sqlite3@^13.2.0'],
        importLines: [
          `import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';`,
          `import Database from 'better-sqlite3';`,
        ],
        createAdapter: `const url = process.env['DATABASE_URL']!.replace(/^file:/, '');
const adapter = new PrismaBetterSqlite3(new Database(url));`,
        useAdapter: true,
      };
    case 'sqlserver':
      return {
        adapterPkg: '@prisma/adapter-mssql',
        driverPkgs: ['mssql@^12.7.14'],
        importLines: [`import { PrismaMssql } from '@prisma/adapter-mssql';`],
        createAdapter: `const adapter = new PrismaMssql(process.env['DATABASE_URL']!);`,
        useAdapter: true,
      };
    case 'mongodb':
      return {
        driverPkgs: [],
        importLines: [],
        createAdapter: '',
        useAdapter: false,
      };
  }
};

export const databaseUrl = (
  db: PrismaDatabase,
  projectName: string,
  password = 'abcde',
): string => {
  switch (db) {
    case 'mysql':
      return `mysql://root:${password}@localhost:3306/${projectName}`;
    case 'postgresql':
      return `postgresql://postgres:${password}@localhost:5432/${projectName}`;
    case 'cockroachdb':
      return `postgresql://root@localhost:26257/${projectName}?sslmode=disable`;
    case 'sqlite':
      return `file:./dev.db`;
    case 'sqlserver':
      return `sqlserver://localhost:1433;database=${projectName};user=sa;password=${password};encrypt=true;trustServerCertificate=true`;
    case 'mongodb':
      return `mongodb://root:${password}@localhost:27017/${projectName}?authSource=admin`;
  }
};

export const generatePrismaSchema = (db: PrismaDatabase): string => {
  if (db === 'mongodb') {
    return `datasource db {
  provider = "mongodb"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}

generator aomex {
  provider = "aomex-prisma"
  output   = "../src/generated/aomex/prisma"
}

model article {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  title      String
  content    String
  summary    String?
  published  Boolean  @default(false)
  /// [ArticleTags]
  tags       Json?
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt()
}
`;
  }

  const idField =
    db === 'cockroachdb'
      ? 'id         Int      @id @default(sequence())'
      : 'id         Int      @id @default(autoincrement())';

  // SQL Server 不支持 Json；用 String 存序列化后的 tags
  const tagsField =
    db === 'sqlserver'
      ? 'tags       String?'
      : '/// [ArticleTags]\n  tags       Json?';

  // mysql / postgresql 用 Text；其余库普通 String
  const contentField =
    db === 'mysql' || db === 'postgresql'
      ? 'content    String   @db.Text'
      : 'content    String';

  const generators =
    db === 'sqlserver'
      ? `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

generator aomex {
  provider = "aomex-prisma"
  output   = "../src/generated/aomex/prisma"
}`
      : `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}

generator aomex {
  provider = "aomex-prisma"
  output   = "../src/generated/aomex/prisma"
}`;

  return `datasource db {
  provider     = "${db}"
  relationMode = "prisma"
}

${generators}

model article {
  ${idField}
  title      String
  ${contentField}
  summary    String?
  published  Boolean  @default(false)
  ${tagsField}
  created_at DateTime @default(now())
  updated_at DateTime @default(now()) @updatedAt()
}
`;
};

export const generatePrismaClient = (db: PrismaDatabase): string => {
  const meta = prismaAdapterMeta(db);
  const clientBlock = meta.useAdapter
    ? `${meta.importLines.join('\n')}

${meta.createAdapter}

export const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});`
    : `export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});`;

  return `import { registerLifecycle } from '@aomex/common';
import { PrismaClient } from '@/generated/prisma/client';
${meta.useAdapter ? '' : '\n'}${clientBlock}

/**
 * 管理 Prisma 连接生命周期；业务代码仍可 \`import { prisma } from '@/services/prisma.service'\`。
 */
await registerLifecycle({
  onInit: () => prisma.$connect(),
  onDestroy: () => prisma.$disconnect(),
});
`;
};

export const generateAuth = (auth: AuthStrategy): string | null => {
  if (auth === 'none') return null;

  if (auth === 'bearer') {
    return `import { Auth, AuthError } from '@aomex/auth';
import { AuthBearerStrategy } from '@aomex/auth/bearer';
import { CookieKey } from '@/constants/cookie-key';
import { services } from '@/services';

/**
 * 不透明 Bearer token（可随时吊销）。
 * 参考：https://aomex.js.org/plugins/auth-bearer-strategy
 */
export const auth = new Auth({
  strategies: {
    user: new AuthBearerStrategy({
      async onLoaded(token) {
        const userId = await services.cache.getUserIdByToken(token, true);
        if (!userId) return false;
        return { id: userId };
      },
      onAuthorize() {
        return true;
      },
      tokenLoaders: [
        { type: 'header', key: 'authorization' },
        { type: 'cookie', key: CookieKey.ACCESS_TOKEN },
        { type: 'query', key: 'access_token' },
      ],
    }),
  },
});

export { AuthError };
`;
  }

  if (auth === 'jwt') {
    return `import { Auth, AuthError } from '@aomex/auth';
import { AuthJwtStrategy } from '@aomex/auth-jwt-strategy';
import { CookieKey } from '@/constants/cookie-key';

/**
 * JWT 无状态令牌。
 * 参考：https://aomex.js.org/plugins/auth-jwt-strategy
 */
export const auth = new Auth({
  strategies: {
    user: new AuthJwtStrategy({
      secret: process.env['JWT_SECRET'] || 'change-me-in-production',
      async onVerified(payload: { userId: number }) {
        return { id: payload.userId };
      },
      onAuthorize() {
        return true;
      },
      tokenLoaders: [
        { type: 'header', key: 'authorization' },
        { type: 'cookie', key: CookieKey.ACCESS_TOKEN },
        { type: 'query', key: 'access_token' },
      ],
    }),
  },
});

export { AuthError };
`;
  }

  return `import { Auth, AuthError } from '@aomex/auth';
import { AuthApiKeyStrategy } from '@aomex/auth/api-key';

/**
 * API Key（默认从 x-api-key 读取裸值）。
 */
export const auth = new Auth({
  strategies: {
    app: new AuthApiKeyStrategy({
      async onLoaded(apiKey) {
        // TODO: 按 apiKey 查询应用身份
        if (!apiKey) return false;
        return { apiKey };
      },
      onAuthorize() {
        return true;
      },
      keyLoaders: [{ type: 'header', key: 'x-api-key' }],
    }),
  },
});

export { AuthError };
`;
};

export const generateLogger = (transports: LoggerTransport[]): string => {
  const imports = new Set<string>(['BaseLoggerService']);
  const entries: string[] = [];

  if (transports.includes('console')) {
    imports.add('ConsoleTransport');
    entries.push(`      {
        transport: new ConsoleTransport(),
        level: 'debug',
      },`);
  }

  if (transports.includes('file')) {
    imports.add('FileTransport');
    entries.push(`      {
        transport: new FileTransport({
          file: 'logs/error-{year}-{month}-{day}.log',
        }),
        level: 'error',
      },`);
  }

  if (transports.includes('stream')) {
    imports.add('StreamTransport');
    entries.push(`      {
        transport: new StreamTransport({
          stream: process.stdout,
          format: 'text',
        }),
        level: 'info',
      },`);
  }

  if (transports.includes('webhook')) {
    imports.add('WebhookTransport');
    entries.push(`      {
        transport: new WebhookTransport({
          url: process.env['LOG_WEBHOOK_URL'] || 'https://example.com/hook',
        }),
        level: 'error',
        disabled: !process.env['LOG_WEBHOOK_URL'],
      },`);
  }

  const extraImports: string[] = [];

  if (transports.includes('sentry')) {
    extraImports.push(
      `import { SentryTransport } from '@aomex/logger-sentry';`,
    );
    entries.push(`      {
        transport: new SentryTransport({
          dsn: process.env['SENTRY_DSN'] || '',
        }),
        level: 'error',
        disabled: !process.env['SENTRY_DSN'],
      },`);
  }

  if (transports.includes('telegram')) {
    extraImports.push(
      `import { TelegramTransport } from '@aomex/logger-telegram';`,
    );
    entries.push(`      {
        transport: new TelegramTransport({
          botToken: process.env['TELEGRAM_BOT_TOKEN'] || '',
          chatId: process.env['TELEGRAM_CHAT_ID'] || '',
        }),
        level: 'error',
        disabled: !process.env['TELEGRAM_BOT_TOKEN'],
      },`);
  }

  const importLine = `import {\n  ${[...imports].join(',\n  ')},\n} from '@aomex/logger';`;

  return `${importLine}
${extraImports.join('\n')}

export default class LoggerService extends BaseLoggerService {
  protected createTransports(): BaseLoggerService.TransportEntry[] {
    return [
${entries.join('\n')}
    ];
  }
}
`;
};

/** 文档 UI 的随机路径后缀（脚手架写入时固化，非运行时变化） */
export const createDocsPathSecret = (): string =>
  randomBytes(8).toString('hex');

/** cron 监听端口：1024–65535，脚手架写入时固化 */
export const createCronPort = (): number =>
  1024 + (randomBytes(2).readUInt16BE(0) % (65535 - 1024 + 1));

export const generateDocsMiddleware = (
  docsUI: DocsUI,
  projectName: string,
  docsPathSecret: string,
): { filename: string; content: string } | null => {
  if (docsUI === 'none') return null;

  if (docsUI === 'swagger') {
    return {
      filename: 'swagger.md.ts',
      content: `import { swaggerUI } from '@aomex/swagger-ui';
import { generateOpenapi } from '@aomex/openapi';
import { app } from '@/web';

// 随机路径：降低被扫到后滥用文档接口的风险；生产环境会 skip
export const swagger = swaggerUI({
  uriPrefix: '/swagger-${docsPathSecret}',
  openapi: () => {
    return generateOpenapi({
      routers: './src/routers',
      app,
      docs: {
        info: {
          title: '${projectName}',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    });
  },
});
`,
    };
  }

  return {
    filename: 'redoc.md.ts',
    content: `import { redocUI } from '@aomex/redoc-ui';
import { generateOpenapi } from '@aomex/openapi';
import { app } from '@/web';

// 随机路径：降低被扫到后滥用文档接口的风险；生产环境会 skip
export const redoc = redocUI({
  uriPrefix: '/redoc-${docsPathSecret}',
  openapi: () => {
    return generateOpenapi({
      routers: './src/routers',
      app,
      docs: {
        info: {
          title: '${projectName}',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
      },
    });
  },
});
`,
  };
};

const pluginImport = (plugin: WebPlugin): string => {
  switch (plugin) {
    case 'cors':
      return `import { cors } from '@aomex/cors';`;
    case 'etag':
      return `import { etag } from '@aomex/etag';`;
    case 'helmet':
      return `import { helmet } from '@aomex/helmet';`;
    case 'compress':
      return `import { compress } from '@aomex/compress';`;
    case 'response-time':
      return `import { responseTime } from '@aomex/response-time';`;
    case 'pretty-json':
      return `import { prettyJson } from '@aomex/pretty-json';`;
    case 'rate-limit':
      return `import { rateLimit } from '@aomex/rate-limit';`;
    case 'serve-static':
      return `import { serveStatic } from '@aomex/serve-static';`;
    case 'http-access-log':
      return `import { httpAccessLog } from '@/middleware/http-access-log.md';`;
    case 'async-trace':
      return `import { slowTrace } from '@/middleware/slow-trace.md';`;
  }
};

const pluginMount = (plugin: WebPlugin): string => {
  switch (plugin) {
    case 'cors':
      return `    cors({ credentials: true }),`;
    case 'etag':
      return `    etag(),`;
    case 'helmet':
      return `    helmet(),`;
    case 'compress':
      return `    compress(),`;
    case 'response-time':
      return `    responseTime(),`;
    case 'pretty-json':
      return `    prettyJson(),`;
    case 'rate-limit':
      return `    rateLimit(),`;
    case 'serve-static':
      return `    serveStatic('./public'),`;
    case 'http-access-log':
      return `    httpAccessLog.skip(isProduction),`;
    case 'async-trace':
      return `    slowTrace,`;
  }
};

/** 中间件挂载顺序（越靠前越外层） */
const PLUGIN_ORDER: WebPlugin[] = [
  'http-access-log',
  'response-time',
  'async-trace',
  'cors',
  'compress',
  'etag',
  'pretty-json',
  'rate-limit',
  'serve-static',
  'helmet',
];

export const generateWeb = (opts: {
  plugins: WebPlugin[];
  docsUI: DocsUI;
  language: DefaultLanguage;
  /** 按 Accept-Language 动态切换；否则 fixed */
  dynamicLanguage: boolean;
  /** Console 选了 openapi 时：WebApp 与 listen 分开，便于 CLI import { app } 而不起服 */
  separateListen: boolean;
  /** 集群方案 */
  cluster: ClusterStrategy;
}): string => {
  const useClusterListen = opts.cluster === 'cluster-listen';
  const ordered = PLUGIN_ORDER.filter((p) => opts.plugins.includes(p));
  const webImports = useClusterListen
    ? `import { clusterListen, formatError, routers, WebApp } from '@aomex/web';`
    : `import { formatError, routers, WebApp } from '@aomex/web';`;
  const imports = [
    webImports,
    `import { rule } from '@aomex/common';`,
    ...ordered.map(pluginImport),
  ];

  const mounts = ordered.map(pluginMount);

  let docsMount: string | null = null;
  if (opts.docsUI === 'swagger') {
    imports.push(`import { swagger } from '@/middleware/swagger.md';`);
    docsMount = `    swagger.skip(isProduction),`;
  } else if (opts.docsUI === 'redoc') {
    imports.push(`import { redoc } from '@/middleware/redoc.md';`);
    docsMount = `    redoc.skip(isProduction),`;
  }

  // 文档 UI 挂在 helmet 之前（与官方模板一致）
  if (docsMount) {
    const helmetIdx = mounts.findIndex((m) => m.includes('helmet('));
    if (helmetIdx >= 0) {
      mounts.splice(helmetIdx, 0, docsMount);
    } else {
      mounts.push(docsMount);
    }
  }

  const httpChain = `const port = process.env['PORT'] || 3000;
app
  .http({
    // 对应 nginx upstream.keepalive_timeout=60s
    // 注意 nginx upstream.keepalive=N 必须主动配置，否则无法复用连接
    keepAliveTimeout: 61_000,
    headersTimeout: 65_000,
  })
  .listen(port, () => {
    console.log(\`HTTP server is listening, visit http://localhost:\${port}\`);
  });`;

  const startListen = useClusterListen
    ? `clusterListen({
  // 勿与 PM2 -i / 容器多副本叠用；容器 / K8s 优先单进程 + 副本扩缩
  workers: 'max',
  listen: () => {
    ${httpChain.replace(/\n/g, '\n    ')}
  },
});`
    : httpChain;

  const listenBlock = opts.separateListen
    ? `
// 仅直接运行本文件时 listen（Console openapi 会 import { app }，避免副作用起服）
const isMain =
  !!process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
${startListen
  .split('\n')
  .map((line) => (line.length ? `  ${line}` : line))
  .join('\n')}
}`
    : `
${startListen}`;

  const headImports = opts.separateListen
    ? `import path from 'node:path';
import { fileURLToPath } from 'node:url';
`
    : '';

  const needsIsProduction =
    opts.docsUI !== 'none' || opts.plugins.includes('http-access-log');
  const isProductionDecl = needsIsProduction
    ? `\nconst isProduction = process.env['NODE_ENV'] === 'production';\n`
    : '\n';

  return `import 'dotenv/config';
${headImports}${imports.join('\n')}
import { services } from '@/services';
${isProductionDecl}
export const app = new WebApp({
  services,
  logger: services.logger,
  language: ${
    opts.dynamicLanguage
      ? `{ mode: 'dynamic', header: 'accept-language', fallback: '${opts.language}' }`
      : `{ mode: 'fixed', language: '${opts.language}' }`
  },
  proxyIP: { mode: 'detect' },
  mount: [
${mounts.join('\n')}
    formatError({
      content: { code: rule.string(), message: rule.string() },
      handler(err) {
        return { code: err.code || '', message: err.message };
      },
    }),
    routers('./src/routers'),
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});
${listenBlock}

declare module '@aomex/web' {
  namespace WebApp {
    type T = WebApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
`;
};

export const generateCli = (opts: {
  consoleMiddlewares: ConsoleMiddleware[];
  language: DefaultLanguage;
  cronPort: number;
}): string => {
  const hasCron = opts.consoleMiddlewares.includes('cron');
  const hasOpenapi = opts.consoleMiddlewares.includes('openapi');

  const imports = [
    `import { commanders, ConsoleApp } from '@aomex/console';`,
    `import { services } from '@/services';`,
  ];

  if (hasCron) {
    imports.unshift(
      `import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';`,
    );
    imports.push(`import { crons } from '@aomex/cron';`);
    imports.push(`import { configs } from '@/configs';`);
  }
  if (hasOpenapi) {
    imports.push(`import { openapi } from '@aomex/openapi';`);
    imports.push(`import { app as webApp } from '@/web';`);
  }

  const mounts: string[] = [];
  if (hasCron) {
    mounts.push(`    crons({
      commanders: './src/commanders',
      // 随机高位端口，降低与本机服务冲突、被扫到的概率
      port: ${opts.cronPort},
      store: new CacheRedisAdapter(configs.redis),
    }),`);
  }
  if (hasOpenapi) {
    mounts.push(`    openapi({ routers: './src/routers', app: webApp }),`);
  }
  mounts.push(`    commanders('./src/commanders'),`);

  return `import 'dotenv/config';
${imports.join('\n')}

const app = new ConsoleApp({
  services,
  logger: services.logger,
  language: '${opts.language}',
  mount: [
${mounts.join('\n')}
  ],
});

process.on('uncaughtException', (err) => {
  void services.logger.fatal(err);
});

const code = await app.run();
process.exit(code);

declare module '@aomex/console' {
  namespace ConsoleApp {
    type T = ConsoleApp.Infer<typeof app>;
    interface Props extends T {}
  }
}
`;
};

export const generateServicesIndex = (orm: Orm): string => {
  const loaders = [
    `    logger: () => import('./logger.service.js'),`,
    `    cache: () => import('./cache.service.js'),`,
  ];
  const eager = ['logger', 'cache'];
  if (orm !== 'none') {
    loaders.push(`    article: () => import('./article.service.js'),`);
  }

  // mongoose 无 Service 类进 combineServices；侧效导入保证启动即 registerLifecycle
  const mongooseImport =
    orm === 'mongoose' ? `\nimport './mongoose.service.js';` : '';

  return `import { combineServices } from '@aomex/common';${mongooseImport}

export const services = await combineServices(
  {
${loaders.join('\n')}
  },
  { eager: [${eager.map((k) => `'${k}'`).join(', ')}] },
);
`;
};

export const generateArticleService = (
  orm: Orm,
  prismaDatabase?: PrismaDatabase,
): string => {
  if (orm === 'prisma') {
    // mongodb 主键是 String，其余为 Int
    const idType = prismaDatabase === 'mongodb' ? 'string' : 'number';

    return `import { Service } from '@aomex/common';
import { prisma } from '@/services/prisma.service';
import type { Prisma } from '@/generated/prisma/client';

export default class ArticleService extends Service {
  async findArticles() {
    return await prisma.article.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findArticleById(id: ${idType}) {
    return await prisma.article.findUnique({
      where: {
        id,
      },
    });
  }

  async createArticle(data: Prisma.articleCreateInput) {
    return prisma.article.create({
      data,
    });
  }

  async updateArticle(id: ${idType}, data: Prisma.articleUpdateInput) {
    return await prisma.article.update({
      where: { id },
      data,
    });
  }

  async deleteArticle(id: ${idType}) {
    return await prisma.article.delete({
      where: { id },
    });
  }
}
`;
  }

  if (orm === 'mongoose') {
    return `import { Service } from '@aomex/common';
import { ArticleModel } from '@/models/article.model';

export default class ArticleService extends Service {
  async findArticles() {
    return await ArticleModel.find().sort({ created_at: -1 }).lean();
  }

  async findArticleById(id: string | number) {
    return await ArticleModel.findById(String(id)).lean();
  }

  async createArticle(data: {
    title: string;
    content: string;
    summary?: string;
    published?: boolean;
    tags?: string[];
  }) {
    const doc = await ArticleModel.create(data);
    return doc.toObject();
  }

  async updateArticle(
    id: string | number,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      published?: boolean;
      tags?: string[];
    },
  ) {
    return await ArticleModel.findByIdAndUpdate(String(id), data, {
      new: true,
    }).lean();
  }

  async deleteArticle(id: string | number) {
    return await ArticleModel.findByIdAndDelete(String(id)).lean();
  }
}
`;
  }

  throw new Error(
    `article service is only available when orm is prisma or mongoose, got: ${orm}`,
  );
};

export const generateMongooseFiles = (
  language: DefaultLanguage = 'zh-CN',
): {
  mongoose: string;
  articleModel: string;
  articleRouter: string;
} => {
  const { articleNotFound } = scaffoldText(language);
  return {
    mongoose: `import { registerLifecycle } from '@aomex/common';
import mongoose from 'mongoose';

/**
 * 管理 Mongoose 连接生命周期；业务代码仍可 \`import { mongoose } from '@/services/mongoose.service'\`。
 */
await registerLifecycle({
  onInit: async () => {
    const uri = process.env['DATABASE_URL'];
    if (!uri) throw new Error('DATABASE_URL is required');
    await mongoose.connect(uri);
  },
  onDestroy: () => mongoose.disconnect(),
});

export { mongoose };
`,
    articleModel: `import { rule } from '@aomex/common';
import { defineMongooseModel } from '@aomex/mongoose';

export const ArticleModel = defineMongooseModel('article', {
  schemas: {
    title: rule.string(),
    content: rule.string(),
    summary: rule.string().optional().nullable(),
    published: rule.boolean().default(false),
    tags: rule.array(rule.string()).optional().nullable(),
  },
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  indexes: [{ fields: { title: 1 } }],
});
`,
    articleRouter: `import { rule } from '@aomex/common';
import { body, params, response, Router } from '@aomex/web';
import { services } from '@/services';

const articleSchema = rule.object({
  _id: rule.string(),
  title: rule.string(),
  content: rule.string(),
  summary: rule.string().nullable(),
  published: rule.boolean(),
  tags: rule.array(rule.string()).nullable(),
});

export const router = new Router({
  prefix: '/articles',
});

router.get('/', {
  mount: [
    response({
      statusCode: 200,
      content: rule.array(articleSchema),
    }),
  ],
  action: async (ctx) => {
    const articles = await services.article.findArticles();
    ctx.send(articles);
  },
});

router.get('/:id', {
  mount: [
    params({ id: rule.string() }),
    response({
      statusCode: 200,
      content: articleSchema,
    }),
    response({
      statusCode: 404,
      description: '${articleNotFound}',
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.findArticleById(ctx.params.id);
    if (!article) return ctx.throw(404);
    ctx.send(article);
  },
});

router.post('/', {
  mount: [
    body({
      title: rule.string(),
      content: rule.string(),
      summary: rule.string().optional().nullable(),
      published: rule.boolean().optional(),
      tags: rule.array(rule.string()).optional().nullable(),
    }),
    response({
      statusCode: 201,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(ctx.body);
    ctx.send(201, article);
  },
});

router.patch('/:id', {
  mount: [
    params({ id: rule.string() }),
    body({
      title: rule.string().optional(),
      content: rule.string().optional(),
      summary: rule.string().optional().nullable(),
      published: rule.boolean().optional(),
      tags: rule.array(rule.string()).optional().nullable(),
    }),
    response({
      statusCode: 200,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.updateArticle(
      ctx.params.id,
      ctx.body,
    );
    ctx.send(article);
  },
});

router.delete('/:id', {
  mount: [
    params({ id: rule.string() }),
    response({
      statusCode: 204,
    }),
  ],
  action: async (ctx) => {
    await services.article.deleteArticle(ctx.params.id);
    ctx.send(204);
  },
});
`,
  };
};

export const generatePrismaArticleRouter = (
  language: DefaultLanguage,
  prismaDatabase?: PrismaDatabase,
): string => {
  const { articleNotFound } = scaffoldText(language);
  const idRule = prismaDatabase === 'mongodb' ? 'rule.string()' : 'rule.int()';
  // 可空 Json：接口 null 需在进 Service 前转 DbNull；Service 仍用 Prisma.*Input
  const jsonNeedsDbNull =
    prismaDatabase !== 'sqlserver' && prismaDatabase !== 'mongodb';
  const jsonUtilImport = jsonNeedsDbNull
    ? `import { nullableJsonFields } from '@/utils/prisma-json';\n`
    : '';
  const createArg = jsonNeedsDbNull
    ? "nullableJsonFields(ctx.body, ['tags'])"
    : 'ctx.body';
  const updateArg = jsonNeedsDbNull
    ? "nullableJsonFields(ctx.body, ['tags'])"
    : 'ctx.body';

  return `import { rule } from '@aomex/common';
import { body, params, response, Router } from '@aomex/web';
import { services } from '@/services';
import { prismaInput } from '@/schemas/prisma.schema';
import { articleSchema } from '@/schemas/article.schema';
${jsonUtilImport}
export const router = new Router({
  prefix: '/articles',
});

router.get('/', {
  mount: [
    response({
      statusCode: 200,
      content: rule.array(articleSchema),
    }),
  ],
  action: async (ctx) => {
    const articles = await services.article.findArticles();
    ctx.send(articles);
  },
});

router.get('/:id', {
  mount: [
    params({ id: ${idRule} }),
    response({
      statusCode: 200,
      content: articleSchema,
    }),
    response({
      statusCode: 404,
      description: '${articleNotFound}',
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.findArticleById(ctx.params.id);
    if (!article) return ctx.throw(404);
    ctx.send(article);
  },
});

router.post('/', {
  mount: [
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags')),
    response({
      statusCode: 201,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.createArticle(${createArg});
    ctx.send(201, article);
  },
});

router.patch('/:id', {
  mount: [
    params({ id: ${idRule} }),
    body(prismaInput.article.pick('title', 'content', 'summary', 'published', 'tags').partial()),
    response({
      statusCode: 200,
      content: articleSchema,
    }),
  ],
  action: async (ctx) => {
    const article = await services.article.updateArticle(ctx.params.id, ${updateArg});
    ctx.send(article);
  },
});

router.delete('/:id', {
  mount: [
    params({ id: ${idRule} }),
    response({
      statusCode: 204,
    }),
  ],
  action: async (ctx) => {
    await services.article.deleteArticle(ctx.params.id);
    ctx.send(204);
  },
});
`;
};

export const generatePrismaSchemaModule = (): string => {
  return `import { rule, Validator } from '@aomex/common';
import { definePrismaSchema } from '@aomex/prisma';
import { generated } from '@/generated/aomex/prisma';

const articleTags = rule.array(rule.string());

/**
 * Prisma 生成结果的业务入口。需要改字段规则时在第二个参数覆盖。
 */
export const { prismaInput, prismaOutput, prismaEnum } = definePrismaSchema(
  generated,
  {
    article: {
      input: (s) => s.extend({ tags: articleTags.nullable() }),
      output: (s) => s.extend({ tags: articleTags.nullable() }),
    },
  },
);

/**
 * Prisma Json 字段类型（prisma-json-types-generator）。
 * schema 里用 \`/// [ArticleTags]\` 引用。
 */
declare global {
  namespace PrismaJson {
    type ArticleTags = Validator.Infer<typeof articleTags>;
  }
}
`;
};

export const generateArticleSchema = (): string => {
  return `import { prismaOutput } from '@/schemas/prisma.schema';

export const articleSchema = prismaOutput.article;
`;
};

/** 可空 Json 写入：接口 null → Prisma.DbNull（字段变多时只扩 fields 列表） */
export const generatePrismaJsonUtil = (): string => {
  return `import { Prisma } from '@/generated/prisma/client';

/**
 * 把指定字段上的 JS \`null\` 转成 \`Prisma.DbNull\`，供可空 Json 写入。
 * 新增 Json 字段时把键名加入 \`fields\` 即可。
 */
export const nullableJsonFields = <
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  data: T,
  fields: readonly K[],
) => {
  const next = { ...data };
  for (const key of fields) {
    if (next[key] === null) {
      (next as Record<string, unknown>)[key as string] = Prisma.DbNull;
    }
  }
  return next as {
    [P in keyof T]: P extends K
      ? Exclude<T[P], null> | typeof Prisma.DbNull
      : T[P];
  };
};
`;
};

export const generateSlowTrace = (language: DefaultLanguage): string => {
  const text = scaffoldText(language);
  return `import { asyncTrace, traceMiddleware } from '@aomex/async-trace';
import type { WebContext } from '@aomex/web';
import { services } from '@/services';

export const slowTrace = traceMiddleware('${text.slowTrace}', async (record, ctx: WebContext) => {
  if (record.duration > 1_000) {
    const stack = asyncTrace.toStack(record.children);
    void services.logger.warn(
      \`\${ctx.request.method} \${ctx.request.pathname} \${record.duration}ms\\n\\n\${stack}\`,
    );
  }
});
`;
};

export const generateCacheService = (auth: AuthStrategy): string => {
  const rememberExport = `/**
 * 方法装饰器：缓存异步方法返回值（绑定本 CacheService；未命中时并发只跑一次）。
 *
 * \`\`\`ts
 * import { Service } from '@aomex/common';
 * import { remember } from '@/services/cache.service';
 *
 * export default class ArticleService extends Service {
 *   // 简写：过期时间（毫秒）；key 默认按「类名-方法名-参数」生成
 *   \\@remember(60_000)
 *   async findById(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 *
 *   // 完整写法：自定义 key / defaultValue
 *   \\@remember({
 *     duration: 60_000,
 *     key: (id) => \`article:\${id}\`,
 *     // defaultValue: null,
 *   })
 *   async findByIdCached(id: number) {
 *     return db.article.findUnique({ where: { id } });
 *   }
 * }
 * \`\`\`
 */
export const remember = createRemember(CacheService);
`;

  if (auth === 'bearer') {
    return `import { BaseCacheService, createRemember } from '@aomex/cache';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@/configs';

export default class CacheService extends BaseCacheService<CacheRedisAdapter> {
  protected readonly passportUserToken = this.key('passport-user-token', 'v1');

  protected createAdapter() {
    return new CacheRedisAdapter(configs.redis);
  }

  async getUserIdByToken(token: string, refreshTTL: boolean) {
    const key = this.passportUserToken.keyHash(token);
    const userId = await this.cache.get<number>(key);
    if (!userId) return null;
    if (refreshTTL) {
      await this.cache.expire(key, this.ttl.DAY);
    }
    return userId;
  }

  async setUserIdInToken(token: string, userId: number) {
    await this.cache.set(this.passportUserToken.keyHash(token), userId, this.ttl.DAY);
  }

  async deleteUserToken(token: string) {
    await this.cache.delete(this.passportUserToken.keyHash(token));
  }
}

${rememberExport}`;
  }

  return `import { BaseCacheService, createRemember } from '@aomex/cache';
import { CacheRedisAdapter } from '@aomex/cache-redis-adapter';
import { configs } from '@/configs';

export default class CacheService extends BaseCacheService<CacheRedisAdapter> {
  protected readonly captcha = this.key('captcha', 'v1');

  protected createAdapter() {
    return new CacheRedisAdapter(configs.redis);
  }

  async getCaptcha(sessionId: string) {
    return this.cache.get<string>(this.captcha.key(sessionId));
  }

  async setCaptcha(sessionId: string, code: string) {
    return this.cache.set(this.captcha.key(sessionId), code, this.ttl.MINUTE * 5);
  }

  async deleteCaptcha(sessionId: string) {
    return this.cache.delete(this.captcha.key(sessionId));
  }
}

${rememberExport}`;
};

export const generateStartScript = (opts: {
  orm: Orm;
  hasCron: boolean;
  packageManager: PackageManager;
}): string => {
  const exec = packageManagerExec(opts.packageManager);
  const cronSpawnArgs =
    opts.packageManager === 'pnpm'
      ? `['exec', 'aomex', 'cron:start']`
      : opts.packageManager === 'yarn'
        ? `['exec', 'aomex', 'cron:start']`
        : `['exec', '--', 'aomex', 'cron:start']`;
  const cronBin =
    opts.packageManager === 'pnpm'
      ? 'pnpm'
      : opts.packageManager === 'yarn'
        ? 'yarn'
        : 'npm';

  const prismaBlock =
    opts.orm === 'prisma'
      ? `
execSync('${exec} prisma generate', { stdio: 'inherit' });
if (existsSync('prisma/migrations')) {
  execSync('${exec} prisma migrate deploy', { stdio: 'inherit' });
} else if (existsSync('prisma/schema.prisma')) {
  execSync('${exec} prisma db push', { stdio: 'inherit' });
}
`
      : '';

  const cronSpawn = opts.hasCron
    ? `const cron = spawn('${cronBin}', ${cronSpawnArgs}, { stdio: 'inherit', env: process.env });\n`
    : '';

  const cronKill = opts.hasCron ? `  cron.kill('SIGINT');\n` : '';

  const fsImport =
    opts.orm === 'prisma' ? `import { existsSync } from 'node:fs';\n` : '';

  return `import 'dotenv/config';
import { execSync, spawn } from 'node:child_process';
${fsImport}import process from 'node:process';

execSync('docker compose -f docker-compose.yml up --wait', { stdio: 'inherit' });
const healthCheck = execSync('docker compose -f docker-compose.yml ps', { encoding: 'utf8' });
if (healthCheck.includes('unhealthy')) process.exit(1);
${prismaBlock}
const api = spawn('node', ['--import', 'tsx/esm', '--watch', 'src/web.ts'], {
  stdio: 'inherit',
  env: process.env,
});
${cronSpawn}
process.on('SIGINT', () => {
${cronKill}  api.kill('SIGINT');
  execSync('docker compose -f docker-compose.yml down', { stdio: 'inherit' });
});
`;
};

export const generateCookieKey = (): string => {
  return `export enum CookieKey {
  ACCESS_TOKEN = 'access_token',
}
`;
};

export const generateHttpAccessLog = (
  transports: LoggerTransport[],
): string => {
  const imports = new Set<string>();
  const list: string[] = [];

  if (transports.includes('console') || !transports.includes('file')) {
    imports.add('ConsoleTransport');
    list.push(`    new ConsoleTransport(),`);
  }
  if (transports.includes('file')) {
    imports.add('FileTransport');
    list.push(
      `    new FileTransport({ file: 'logs/http/{year}-{month}-{day}/{level}.log' }),`,
    );
  }
  if (!list.length) {
    imports.add('ConsoleTransport');
    list.push(`    new ConsoleTransport(),`);
  }

  return `import { httpAccessLog as aomexHttpAccessLog } from '@aomex/http-access-log';
import { ${[...imports].join(', ')} } from '@aomex/logger';

export const httpAccessLog = aomexHttpAccessLog({
  transports: [
${list.join('\n')}
  ],
});
`;
};

export const generateDeployCompose = (opts: {
  env: 'production' | 'integration';
  hasCron: boolean;
  orm: Orm;
  cluster: ClusterStrategy;
}): string => {
  const image = `{{projectName}}:${opts.env}`;
  const envFile = `.env.${opts.env}`;
  const migration =
    opts.orm === 'prisma'
      ? `  migration:
    image: ${image}
    env_file:
      - ${envFile}
    command: prisma migrate deploy
`
      : '';
  const cron = opts.hasCron
    ? `  cron:
    image: ${image}
    env_file:
      - ${envFile}
    init: true
    command: aomex cron:start
    restart: unless-stopped
`
    : '';

  const clusterHint =
    opts.cluster === 'cluster-listen'
      ? `    # 已用内置 clusterListen 吃满多核；勿再 --scale api / PM2 -i
`
      : opts.cluster === 'pm2'
        ? `    # 已用 PM2 cluster；勿再 --scale api / clusterListen
`
        : '';

  return `services:
${migration}  api:
    image: ${image}
    env_file:
      - ${envFile}
    restart: unless-stopped
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
${clusterHint}    ports:
      - 3000:3000
${cron}`;
};

export const generatePm2Ecosystem = (opts: { docker: boolean }): string => {
  // Docker 镜像内已是编译后的 JS；无 Docker 与本地一致直接跑 TS
  const script = opts.docker ? 'src/web.js' : 'src/web.ts';
  const nodeArgs = opts.docker
    ? '--enable-source-maps --stack-trace-limit=30'
    : '--import tsx/esm --stack-trace-limit=30';
  return `module.exports = {
  apps: [
    {
      name: 'api',
      script: '${script}',
      instances: 'max',
      exec_mode: 'cluster',
      // 勿与 clusterListen / 容器多副本叠用
      node_args: '${nodeArgs}',
    },
  ],
};
`;
};

export const generateDockerCompose = (
  projectName: string,
  orm: Orm,
  db?: PrismaDatabase,
): string => {
  const services: string[] = [];

  const needMysql = (orm === 'prisma' && db === 'mysql') || false;
  const needPostgres =
    orm === 'prisma' && (db === 'postgresql' || db === 'cockroachdb');
  const needMongo =
    orm === 'mongoose' || (orm === 'prisma' && db === 'mongodb');

  if (needMysql) {
    services.push(`  mysql:
    image: mysql:8.4
    environment:
      # 与 DATABASE_URL 保持一致；首次初始化 data 目录时自动建库（改库名需清 volumes/mysql）
      MYSQL_ROOT_PASSWORD: abcde
      MYSQL_DATABASE: ${projectName}
    volumes:
      - ./volumes/mysql:/var/lib/mysql
    ports:
      - 3306:3306
    # 字符集/排序规则用 8.x 默认：utf8mb4 + utf8mb4_0900_ai_ci
    command:
      # binlog 保留 2 天（172800 秒）
      - --binlog_expire_logs_seconds=172800
      # 开启慢查询日志（默认写在数据目录：./volumes/mysql/<hostname>-slow.log）
      - --slow_query_log=1
      # 执行超过 2 秒记入慢查询
      - --long_query_time=2
    healthcheck:
      test:
        [
          "CMD",
          "mysqladmin",
          "ping",
          "-h",
          "localhost",
          "-u",
          "root",
          "-p$$MYSQL_ROOT_PASSWORD",
        ]
      # interval 短：再次 up --wait 几乎立刻过；首次初始化靠 start_period + retries
      interval: 1s
      timeout: 3s
      retries: 30
      start_period: 20s`);
  }

  if (needPostgres && db === 'postgresql') {
    services.push(`  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: abcde
      POSTGRES_DB: \${POSTGRES_DB}
    volumes:
      - ./volumes/postgres:/var/lib/postgresql/data
    ports:
      - 5432:5432`);
  }

  if (needPostgres && db === 'cockroachdb') {
    services.push(`  cockroach:
    image: cockroachdb/cockroach:latest
    command: start-single-node --insecure
    volumes:
      - ./volumes/cockroach:/cockroach/cockroach-data
    ports:
      - 26257:26257
      - 8080:8080`);
  }

  if (needMongo) {
    services.push(`  mongo:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: abcde
    volumes:
      - ./volumes/mongo:/data/db
    ports:
      - 27017:27017`);
  }

  services.push(`  redis:
    image: redis:8.0
    env_file:
      - .env
    volumes:
      - ./volumes/redis:/data
    ports:
      - 6379:6379
    command: --requirepass \${REDIS_PASSWORD}`);

  return `services:
${services.join('\n')}
`;
};

export const generateEnvExample = (
  projectName: string,
  opts: ScaffoldOptions,
  /** local：本地开发默认密码；deploy：integration/production 用占位符 */
  mode: 'local' | 'deploy' = 'local',
): string => {
  const password = mode === 'local' ? 'abcde' : 'CHANGE_ME';
  const lines: string[] = [];

  if (opts.orm === 'prisma' && opts.prismaDatabase) {
    lines.push(
      `DATABASE_URL=${databaseUrl(opts.prismaDatabase, projectName, password)}`,
    );
    if (opts.prismaDatabase === 'postgresql') {
      lines.push(`POSTGRES_DB=${projectName}`);
    }
  } else if (opts.orm === 'mongoose') {
    lines.push(
      `DATABASE_URL=mongodb://root:${password}@localhost:27017/${projectName}?authSource=admin`,
    );
  }

  lines.push(`REDIS_PASSWORD=${password}`);

  if (opts.auth === 'jwt') {
    lines.push(
      `JWT_SECRET=${mode === 'local' ? 'change-me-in-production' : 'CHANGE_ME'}`,
    );
  }
  if (opts.loggerTransports.includes('webhook')) {
    lines.push(`# LOG_WEBHOOK_URL=https://example.com/hook`);
  }
  if (opts.loggerTransports.includes('sentry')) {
    lines.push(`# SENTRY_DSN=`);
  }
  if (opts.loggerTransports.includes('telegram')) {
    lines.push(`# TELEGRAM_BOT_TOKEN=`);
    lines.push(`# TELEGRAM_CHAT_ID=`);
  }

  // TZ 固定第二行（有 DATABASE_URL 时紧随其后）
  lines.splice(1, 0, `TZ=${opts.timezone}`);

  return lines.join('\n') + '\n';
};

/** `name` / `name@version` / `@scope/name@version` → [name, version]；无版本默认 `*` */
export const parseDependencySpec = (spec: string): [string, string] => {
  if (spec.startsWith('@')) {
    const at = spec.indexOf('@', 1);
    if (at === -1) return [spec, '*'];
    return [spec.slice(0, at), spec.slice(at + 1)];
  }
  const at = spec.indexOf('@');
  if (at === -1) return [spec, '*'];
  return [spec.slice(0, at), spec.slice(at + 1)];
};

export const dependencyRecord = (specs: string[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const spec of specs) {
    const [name, version] = parseDependencySpec(spec);
    out[name] = version;
  }
  return Object.fromEntries(
    Object.entries(out).sort(([a], [b]) => a.localeCompare(b)),
  );
};

export const generatePackageJson = (opts: {
  packageManager: PackageManager;
  packageManagerVersion: string;
  hasCron: boolean;
  scaffoldOptions: ScaffoldOptions;
  /** @aomex/* 统一版本（由 resolveAomexVersion 解析） */
  aomexVersion: string;
  /** prisma / @prisma/* 统一版本（由 resolvePrismaVersion 解析，仅 7.x）；非 prisma 可省略 */
  prismaVersion?: string;
}): Record<string, any> => {
  const { docker, cluster } = opts.scaffoldOptions;
  const scripts: Record<string, string> = {
    start: 'node scripts/start.mjs',
    prepare: 'husky || true',
  };

  if (docker) {
    scripts['deploy:production'] = 'node scripts/deploy.mjs production';
    scripts['deploy:integration'] = 'node scripts/deploy.mjs integration';
    scripts['deploy:api'] = 'node scripts/deploy-api.mjs production';
    if (opts.hasCron) {
      scripts['deploy:cron'] = 'node scripts/deploy-cron.mjs production';
      scripts['cron:stats'] = 'node scripts/docker-cron-stats.mjs';
      scripts['cron:stop'] = 'node scripts/docker-cron-stop.mjs';
    }
  } else {
    scripts['deploy:production'] = 'node scripts/deploy.mjs production';
    scripts['deploy:integration'] = 'node scripts/deploy.mjs integration';
  }

  if (cluster === 'pm2') {
    scripts['pm2:start'] = 'pm2 start ecosystem.config.cjs';
    scripts['pm2:reload'] = 'pm2 reload api';
    scripts['pm2:stop'] = 'pm2 stop api';
  }

  const groups = buildDependencyGroups(
    opts.scaffoldOptions,
    opts.aomexVersion,
    opts.prismaVersion,
  );
  const dependencies = dependencyRecord(groups.find((g) => !g.dev)?.pkgs ?? []);
  const devDependencies = dependencyRecord(
    groups.find((g) => g.dev)?.pkgs ?? [],
  );

  const pkg: Record<string, any> = {
    name: '{{projectName}}',
    private: true,
    license: 'UNLICENSED',
    type: 'module',
    engines: {
      node: '{{nodeVersion}}',
    },
    scripts,
    dependencies,
    devDependencies,
  };

  if (opts.packageManager === 'pnpm') {
    // pnpm 通过 devEngines.runtime 自动下载并锁定 Node
    pkg['packageManager'] = `pnpm@${opts.packageManagerVersion}`;
    pkg['devEngines'] = {
      runtime: {
        name: 'node',
        version: '^{{nodeVersion}}',
        onFail: 'download',
      },
      packageManager: {
        name: 'pnpm',
        version: opts.packageManagerVersion,
        onFail: 'download',
      },
    };
  } else if (opts.packageManager === 'yarn') {
    pkg['packageManager'] = `yarn@${opts.packageManagerVersion}`;
    pkg['devEngines'] = {
      packageManager: {
        name: 'yarn',
        version: opts.packageManagerVersion,
        onFail: 'download',
      },
    };
  } else {
    pkg['devEngines'] = {
      packageManager: {
        name: 'npm',
        version: opts.packageManagerVersion,
        onFail: 'error',
      },
    };
  }

  return pkg;
};

/** TypeScript 7 only：不再兼容 moduleResolution:node / downlevelIteration 等已移除选项 */
export const generateTsconfig = (_opts: { orm: Orm }): string => {
  return (
    JSON.stringify(
      {
        compilerOptions: {
          target: 'es2024',
          lib: ['es2024'],
          module: 'esnext',
          moduleResolution: 'bundler',
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          verbatimModuleSyntax: true,
          resolveJsonModule: true,
          allowUnusedLabels: false,
          allowUnreachableCode: false,
          exactOptionalPropertyTypes: false,
          noFallthroughCasesInSwitch: true,
          noImplicitOverride: true,
          noImplicitReturns: true,
          noPropertyAccessFromIndexSignature: true,
          noUncheckedIndexedAccess: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          declaration: false,
          removeComments: true,
          sourceMap: true,
          rootDir: './',
          outDir: 'build',
          noEmit: false,
          paths: {
            '@/*': ['./src/*'],
          },
        },
      },
      null,
      2,
    ) + '\n'
  );
};

export const generateDockerfile = (
  env: 'production' | 'integration',
  cluster: ClusterStrategy = 'none',
): string => {
  const cmd =
    cluster === 'pm2'
      ? `CMD ["pm2-runtime", "ecosystem.config.cjs"]`
      : `CMD ["node", "--enable-source-maps", "--stack-trace-limit=30", "src/web.js"]`;

  return `FROM node:{{nodeVersion}}
COPY . /codes
WORKDIR /codes

ENV PORT=3000
ENV NODE_ENV=${env}
ENV PATH="$PATH:/codes/node_modules/.bin"

RUN sh scripts/build-in-docker.sh

${cmd}
`;
};

const dockerRunHelpers = `import { execFileSync } from 'node:child_process';
import process from 'node:process';

const run = (file, args) => {
  console.log('+', file, ...args);
  execFileSync(file, args, { stdio: 'inherit' });
};

const sudoDocker = (...args) => run('sudo', ['docker', ...args]);

/** aomex cron:stop / cron:stats 常以 exit 130（SIGINT）结束 */
const ignoreExit = (fn, codes = [130]) => {
  try {
    fn();
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
    if (!codes.includes(status)) throw err;
  }
};
`;

const dockerCronHelpers = `
const isCronRunning = (composeFile) => {
  try {
    const out = execFileSync(
      'sudo',
      ['docker', 'compose', '--file', composeFile, 'ps', '--status', 'running', '--services'],
      { encoding: 'utf8' },
    );
    return out
      .split('\\n')
      .map((s) => s.trim())
      .includes('cron');
  } catch {
    return false;
  }
};

/** exit 130 SIGINT；再 compose stop，避免 unless-stopped 因主进程退出而把容器拉起 */
const gracefulCronStop = (composeFile) => {
  if (!isCronRunning(composeFile)) return;
  ignoreExit(() =>
    sudoDocker('compose', '--file', composeFile, 'exec', '-T', 'cron', '/bin/sh', '-c', 'aomex cron:stop'),
  );
  sudoDocker('compose', '--file', composeFile, 'stop', 'cron', '--timeout', '1');
};
`;

export const generateDockerDeployScript =
  (): string => `${dockerRunHelpers}${dockerCronHelpers}
const env = process.argv[2];
if (!env) {
  console.error('usage: node scripts/deploy.mjs <production|integration>');
  process.exit(1);
}

const projectName = '{{projectName}}';
const composeFile = \`docker-compose-\${env}.yml\`;

sudoDocker('build', '--tag', \`\${projectName}:\${env}\`, '--file', \`Dockerfile.\${env}\`, '.');
gracefulCronStop(composeFile);
sudoDocker('compose', '--file', composeFile, 'up', '-d', '--remove-orphans');
`;

export const generateDockerDeployApiScript = (): string => `${dockerRunHelpers}
const env = process.argv[2];
if (!env) {
  console.error('usage: node scripts/deploy-api.mjs <production|integration>');
  process.exit(1);
}

const projectName = '{{projectName}}';
const composeFile = \`docker-compose-\${env}.yml\`;

sudoDocker('build', '--tag', \`\${projectName}:\${env}\`, '--file', \`Dockerfile.\${env}\`, '.');
sudoDocker('compose', '--file', composeFile, 'up', 'api', '-d');
`;

export const generateDockerDeployCronScript =
  (): string => `${dockerRunHelpers}${dockerCronHelpers}
const env = process.argv[2];
if (!env) {
  console.error('usage: node scripts/deploy-cron.mjs <production|integration>');
  process.exit(1);
}

const projectName = '{{projectName}}';
const composeFile = \`docker-compose-\${env}.yml\`;

sudoDocker('build', '--tag', \`\${projectName}:\${env}\`, '--file', \`Dockerfile.\${env}\`, '.');
gracefulCronStop(composeFile);
sudoDocker('compose', '--file', composeFile, 'up', 'cron', '-d');
`;

export const generateDockerCronStatsScript = (): string => `${dockerRunHelpers}
// exit 130 SIGINT
ignoreExit(() =>
  sudoDocker('compose', 'exec', '-T', 'cron', '/bin/sh', '-c', 'aomex cron:stats'),
);
`;

export const generateDockerCronStopScript = (): string => `${dockerRunHelpers}
const composeFile = 'docker-compose-production.yml';

// exit 130 SIGINT；再 compose stop，避免 unless-stopped 把容器再次拉起
ignoreExit(() =>
  sudoDocker('compose', '--file', composeFile, 'exec', '-T', 'cron', '/bin/sh', '-c', 'aomex cron:stop'),
);
sudoDocker('compose', '--file', composeFile, 'stop', 'cron', '--timeout', '1');
`;

export const generateBuildInDockerScript = (pm: PackageManager): string => {
  const exec = packageManagerExec(pm);
  const installDev =
    pm === 'pnpm'
      ? 'pnpm install --no-prod --frozen-lockfile --no-runtime'
      : pm === 'yarn'
        ? 'yarn install --frozen-lockfile'
        : 'npm ci';
  const installProd =
    pm === 'pnpm'
      ? `pnpm install --prod --no-runtime
pnpm store prune`
      : pm === 'yarn'
        ? 'yarn install --production --frozen-lockfile'
        : 'npm prune --omit=dev';

  return `#!/usr/bin/env sh

set -ex

# 国内环境请打开镜像注释
# npm config set registry https://registry.npmmirror.com
# export COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
corepack enable # package.json => packageManager
${installDev}
${exec} tsc
${exec} tsc-alias --resolve-full-paths
node ./scripts/build-minify.mjs
node ./scripts/build-fix-source-map.mjs
rm -rf src
mv build/src .
${installProd}
rm -rf node_modules/@types node_modules/*/*.d.ts
`;
};

/** 无 Docker：与本地一致直接跑 TS（tsx），可选 PM2 拉起 */
export const generateBareDeployScript = (opts: {
  packageManager: PackageManager;
  cluster: ClusterStrategy;
  orm: Orm;
}): string => {
  const exec = packageManagerExec(opts.packageManager);
  const prismaGenerate =
    opts.orm === 'prisma'
      ? `
run('${exec} prisma generate');
`
      : '';
  const startBlock =
    opts.cluster === 'pm2'
      ? `
run('pm2 startOrReload ecosystem.config.cjs --update-env');
`
      : `
const child = spawn(
  'node',
  ['--import', 'tsx/esm', '--stack-trace-limit=30', 'src/web.ts'],
  { stdio: 'inherit', env: { ...process.env, NODE_ENV: env } },
);
child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
`;

  const imports =
    opts.cluster === 'pm2'
      ? `import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';`
      : `import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';`;

  return `${imports}

const env = process.argv[2];
if (env !== 'production' && env !== 'integration') {
  console.error('usage: node scripts/deploy.mjs <production|integration>');
  process.exit(1);
}

const run = (cmd) => {
  console.log('+', cmd);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, NODE_ENV: env } });
};

const envFile = \`.env.\${env}\`;
if (!existsSync(envFile)) {
  console.error(\`missing \${envFile}\`);
  process.exit(1);
}
const envContent = readFileSync(envFile, 'utf8');
writeFileSync(
  '.env',
  /^(NODE_ENV=)/m.test(envContent)
    ? envContent.replace(/^NODE_ENV=.*$/m, \`NODE_ENV=\${env}\`)
    : \`\${envContent.trimEnd()}\\nNODE_ENV=\${env}\\n\`,
);
${prismaGenerate}${startBlock}
`;
};

export const resolvePackageManagerVersion = async (
  pm: PackageManager,
): Promise<string> => {
  const { execSync } = await import('node:child_process');
  try {
    if (pm === 'pnpm') {
      return (
        execSync('npm view pnpm version', { encoding: 'utf8' }).trim() ||
        '12.21.0'
      );
    }
    if (pm === 'yarn') {
      return (
        execSync('npm view yarn version', { encoding: 'utf8' }).trim() ||
        '1.22.22'
      );
    }
    return execSync('npm --version', { encoding: 'utf8' }).trim() || '10.0.0';
  } catch {
    if (pm === 'pnpm') return '12.21.0';
    if (pm === 'yarn') return '1.22.22';
    return '10.0.0';
  }
};

/**
 * 查询 npm 上 `@aomex/common` 版本，整系 `@aomex/*` 共用。
 * 优先 `latest`；网络不可用或无标签时直接抛错。
 */
export const resolveAomexVersion = async (): Promise<string> => {
  let res: Response;
  try {
    res = await fetch('https://registry.npmjs.org/@aomex/common');
  } catch (err) {
    throw new Error(
      `无法获取 @aomex/* 版本（网络不可用）：${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!res.ok) {
    throw new Error(`无法获取 @aomex/* 版本：HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    'dist-tags'?: Record<string, string>;
  };
  const tags = data['dist-tags'] ?? {};
  const version = tags['latest'];
  if (!version) {
    throw new Error('npm 上未找到 @aomex/common 的 latest 标签');
  }
  return version;
};

const compareSemver = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

/**
 * 查询 npm 上 `prisma` 最新稳定 7.x（不含预发布）。
 * Prisma 8 架构变更，故意不取 latest/8；网络不可用或无可用版本时直接抛错。
 */
export const resolvePrismaVersion = async (): Promise<string> => {
  let res: Response;
  try {
    res = await fetch('https://registry.npmjs.org/prisma');
  } catch (err) {
    throw new Error(
      `无法获取 prisma 版本（网络不可用）：${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!res.ok) {
    throw new Error(`无法获取 prisma 版本：HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    versions?: Record<string, unknown>;
  };
  const latest7 = Object.keys(data.versions ?? {})
    .filter((v) => /^7\.\d+\.\d+$/.test(v))
    .sort(compareSemver)
    .at(-1);
  if (!latest7) {
    throw new Error('npm 上未找到可用的 prisma 7.x 稳定版本');
  }
  return latest7;
};

export const buildDependencyGroups = (
  opts: ScaffoldOptions,
  aomexVersion: string,
  prismaVersion?: string,
): { label: string; pkgs: string[]; dev?: boolean }[] => {
  const aomex = (name: string) => `${name}@${aomexVersion}`;
  const prisma = (name: string) => `${name}@${prismaVersion!}`;
  const deps = new Set<string>([
    aomex('@aomex/common'),
    aomex('@aomex/web'),
    aomex('@aomex/console'),
    aomex('@aomex/cache'),
    aomex('@aomex/cache-redis-adapter'),
    aomex('@aomex/logger'),
    'dotenv@^18.0.10',
  ]);

  const devDeps = new Set<string>([
    'typescript@^7.0.2',
    'tsc-alias@^1.9.10',
    '@types/node@^26.6.6',
    'husky@^9.1.7',
    'prettier@^3.10.1',
    '@commitlint/cli@^21.2.4',
    '@commitlint/config-conventional@^21.2.4',
  ]);

  // 无 Docker 运行时直接跑 TS，tsx 需在 dependencies；Docker 仅本地 start 用
  if (opts.docker) {
    devDeps.add('tsx@^4.23.15');
    devDeps.add('esbuild@^0.28.2');
  } else {
    deps.add('tsx@^4.23.15');
  }

  for (const plugin of opts.webPlugins) {
    switch (plugin) {
      case 'cors':
        deps.add(aomex('@aomex/cors'));
        break;
      case 'etag':
        deps.add(aomex('@aomex/etag'));
        break;
      case 'helmet':
        deps.add(aomex('@aomex/helmet'));
        break;
      case 'compress':
        deps.add(aomex('@aomex/compress'));
        break;
      case 'response-time':
        deps.add(aomex('@aomex/response-time'));
        break;
      case 'pretty-json':
        deps.add(aomex('@aomex/pretty-json'));
        break;
      case 'rate-limit':
        deps.add(aomex('@aomex/rate-limit'));
        break;
      case 'serve-static':
        deps.add(aomex('@aomex/serve-static'));
        break;
      case 'http-access-log':
        deps.add(aomex('@aomex/http-access-log'));
        break;
      case 'async-trace':
        deps.add(aomex('@aomex/async-trace'));
        break;
    }
  }

  if (opts.docsUI !== 'none' || opts.consoleMiddlewares.includes('openapi')) {
    deps.add(aomex('@aomex/openapi'));
  }
  if (opts.docsUI === 'swagger') deps.add(aomex('@aomex/swagger-ui'));
  if (opts.docsUI === 'redoc') deps.add(aomex('@aomex/redoc-ui'));

  if (opts.consoleMiddlewares.includes('cron')) {
    deps.add(aomex('@aomex/cron'));
  }

  if (opts.auth !== 'none') {
    deps.add(aomex('@aomex/auth'));
  }
  if (opts.auth === 'jwt') {
    deps.add(aomex('@aomex/auth-jwt-strategy'));
  }

  if (opts.loggerTransports.includes('sentry')) {
    deps.add(aomex('@aomex/logger-sentry'));
  }
  if (opts.loggerTransports.includes('telegram')) {
    deps.add(aomex('@aomex/logger-telegram'));
  }

  if (opts.orm === 'prisma' && opts.prismaDatabase) {
    if (!prismaVersion) {
      throw new Error('选用 Prisma 时必须提供 prismaVersion');
    }
    deps.add(aomex('@aomex/prisma'));
    deps.add(prisma('@prisma/client'));
    devDeps.add(prisma('prisma'));
    devDeps.add('prisma-json-types-generator@^6.0.1');
    const meta = prismaAdapterMeta(opts.prismaDatabase);
    if (meta.adapterPkg) deps.add(prisma(meta.adapterPkg));
    for (const p of meta.driverPkgs) {
      deps.add(p);
    }
  }

  if (opts.orm === 'mongoose') {
    deps.add(aomex('@aomex/mongoose'));
    deps.add('mongoose@^8.24.10');
  }

  if (opts.cluster === 'pm2') {
    deps.add('pm2@^6.0.14');
  }

  return [
    { label: 'dependencies', pkgs: [...deps] },
    { label: 'dev dependencies', pkgs: [...devDeps], dev: true },
  ];
};

export const installCommand = (
  pm: PackageManager,
  pkgs: string[],
  dev?: boolean,
): string => {
  const list = pkgs.join(' ');
  if (pm === 'pnpm') return `pnpm add ${list}${dev ? ' -D' : ''}`;
  if (pm === 'yarn') return `yarn add ${list}${dev ? ' -D' : ''}`;
  return `npm install ${list}${dev ? ' --save-dev' : ''}`;
};
