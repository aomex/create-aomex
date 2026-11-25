import { randomBytes, randomInt } from 'node:crypto';
import { hasPlatform, withBaseWebPlugins, type ScaffoldOptions } from './types';
import {
  buildAllowInstallScripts,
  formatPnpmAllowBuilds,
  generateAuth,
  generateAsyncapiDocsMiddleware,
  generateBareDeployScript,
  generateBuildInDockerScript,
  generateCache,
  generatePassportService,
  generateCli,
  generateCookieKey,
  generateDeployCompose,
  generateAbuse,
  generateChatChannel,
  generateDocsMiddleware,
  generatePingChannel,
  generateWs,
  generateDockerCompose,
  generateDockerCronStatsScript,
  generateDockerCronStopScript,
  generateDockerDeployApiScript,
  generateDockerDeployCronScript,
  generateDockerDeployScript,
  generateDockerfile,
  generateEnvExample,
  generateOAuth2Router,
  generateOAuth2Services,
  generateOAuthAppConfigType,
  generateOAuthAppConfigValue,
  generateLoggerAppConfigType,
  generateLoggerAppConfigValue,
  generateLoggerEnvSecretsFields,
  generateOAuthEnvSecretsFields,
  generateGoogleIdentityRouter,
  generateWechatMiniRouter,
  packageManagerExec,
  generateGlobalErrorRewrite,
  generateAccessLog,
  generateLogger,
  generateArticleSchema,
  generateArticleService,
  generateMongooseFiles,
  generatePackageJson,
  generatePm2Ecosystem,
  generatePrismaClient,
  generatePrismaSchema,
  generatePrismaSchemaModule,
  generatePrismaJsonUtil,
  generatePrismaArticleRouter,
  generateServicesIndex,
  generateSlowTrace,
  generateStartScript,
  generateTsconfig,
  generateWeb,
} from './generators';
import { generateReadmeFromOptions, scaffoldText } from './scaffold-locale';
import {
  AOMEX_SKILL_FILE,
  generateAgentsMd,
  generateAomexSkill,
} from './skills/aomex-skill';

export type ProjectFile = {
  content: string;
  /** Unix file mode, e.g. 0o755 for shell scripts */
  mode?: number;
};

const sh = (content: string): ProjectFile => ({ content, mode: 0o755 });
const text = (content: string): ProjectFile => ({ content });

/** 写入磁盘前替换 `{{projectName}}` / `{{nodeVersion}}` 等占位符 */
export const applyScaffoldVariables = (
  content: string,
  variables: Record<string, string>,
): string => {
  let out = content;
  for (const [key, value] of Object.entries(variables)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
};

export const applyScaffoldVariablesToFiles = (
  files: Record<string, ProjectFile>,
  variables: Record<string, string>,
): Record<string, ProjectFile> => {
  const out: Record<string, ProjectFile> = {};
  for (const [relPath, file] of Object.entries(files)) {
    out[relPath] = {
      ...file,
      content: applyScaffoldVariables(file.content, variables),
    };
  }
  return out;
};

/**
 * 按脚手架选项生成完整项目文件树（相对路径 → 内容）。
 * 不再依赖 templates 复制后再打补丁。
 * 返回内容仍可能含 `{{...}}` 占位符，写入前请用 `applyScaffoldVariables`。
 */
export const generateProjectFiles = (opts: {
  projectName: string;
  options: ScaffoldOptions;
  packageManagerVersion: string;
  /** @aomex/* 统一版本 */
  aomexVersion: string;
  /** @aomex-contrib/* 各包版本；启用 oauth2 时必填 */
  aomexContribVersions?: Record<string, string>;
  /** prisma / @prisma/* 统一版本（仅 7.x）；非 prisma 可省略 */
  prismaVersion?: string;
  /** 文档 UI 路径随机后缀；不传则每次生成新的 */
  docsPathSecret?: string;
  /** cron 端口（1024–65535）；不传则每次随机 */
  cronPort?: number;
}): Record<string, ProjectFile> => {
  const enableWebsocketEarly = hasPlatform(opts.options.platforms, 'websocket');
  const options: ScaffoldOptions = {
    ...opts.options,
    webPlugins: hasPlatform(opts.options.platforms, 'web')
      ? withBaseWebPlugins([
          ...opts.options.webPlugins,
          // Websocket 平台默认带上 Node 层 rate-limit（Redis store）
          ...(enableWebsocketEarly &&
          !opts.options.webPlugins.includes('rate-limit')
            ? (['rate-limit'] as const)
            : []),
        ])
      : [],
  };
  const {
    packageManagerVersion,
    aomexVersion,
    aomexContribVersions,
    prismaVersion,
  } = opts;
  const enableWeb = hasPlatform(options.platforms, 'web');
  const enableConsole = hasPlatform(options.platforms, 'console');
  const enableWebsocket = hasPlatform(options.platforms, 'websocket');
  const cronPort = opts.cronPort ?? randomInt(1024, 65536);
  const hasCron = enableConsole && options.consoleMiddlewares.includes('cron');
  const hasOAuth2 =
    enableWeb &&
    options.auth.includes('oauth2') &&
    (options.oauth2Client || options.oauth2Presets.length > 0);
  const docsPathSecret = opts.docsPathSecret ?? randomBytes(8).toString('hex');
  const enrichOpenapi = enableWeb && options.docsUI === 'scalar';
  const files: Record<string, ProjectFile> = {};

  const add = (path: string, file: ProjectFile) => {
    files[path] = file;
  };

  // —— 固定工具链 ——
  add(
    '.gitignore',
    text(`node_modules/
.idea/
dist/
build/
.npmrc
coverage/
.DS_Store
*.log
volumes/
logs/
.env*
!.env.example
`),
  );
  add(
    '.prettierignore',
    text(`dist/
pnpm-lock.yaml
coverage/
openapi.json
asyncapi.json
build/
src/generated
`),
  );
  add(
    '.prettierrc.yml',
    text(`semi: true
singleQuote: true
quoteProps: consistent
tabWidth: 2
printWidth: 100
endOfLine: lf
trailingComma: all
bracketSpacing: true
arrowParens: always
proseWrap: preserve
jsxSingleQuote: false
bracketSameLine: false
`),
  );
  add(
    '.commitlintrc.yml',
    text(`extends:
  - '@commitlint/config-conventional'
`),
  );
  const exec = packageManagerExec(options.packageManager);
  add(
    '.husky/pre-commit',
    sh(`#!/usr/bin/env sh

${exec} prettier --cache --check .
${exec} tsc
`),
  );
  add(
    '.husky/commit-msg',
    sh(`#!/usr/bin/env sh

${exec} commitlint --edit $1
`),
  );

  add(AOMEX_SKILL_FILE, text(generateAomexSkill()));
  add('AGENTS.md', text(generateAgentsMd()));

  const vscodeExts = ['esbenp.prettier-vscode'];
  if (options.orm === 'prisma') vscodeExts.push('Prisma.prisma');
  if (options.docker) vscodeExts.push('ms-azuretools.vscode-docker');
  add(
    '.vscode/extensions.json',
    text(JSON.stringify({ recommendations: vscodeExts }, null, 2) + '\n'),
  );
  add(
    '.vscode/settings.json',
    text(
      JSON.stringify(
        {
          'editor.formatOnSave': true,
          'editor.defaultFormatter': 'esbenp.prettier-vscode',
          ...(options.orm === 'prisma'
            ? { '[prisma]': { 'editor.defaultFormatter': 'Prisma.prisma' } }
            : {}),
          'editor.tabSize': 2,
          'editor.inlayHints.fontSize': 9,
          'js/ts.inlayHints.parameterNames.enabled': 'all',
          'js/ts.inlayHints.enumMemberValues.enabled': true,
          'js/ts.inlayHints.functionLikeReturnTypes.enabled': true,
          'js/ts.preferences.quoteStyle': 'single',
          'js/ts.suggest.autoImports': true,
          'js/ts.experimental.useTsgo': true,
          'js/ts.tsdk.path': './node_modules/typescript',
          'cSpell.words': ['openapi', 'asyncapi', 'aomex'],
        },
        null,
        2,
      ) + '\n',
    ),
  );

  // —— package / tsconfig ——
  add(
    'package.json',
    text(
      JSON.stringify(
        generatePackageJson({
          packageManager: options.packageManager,
          packageManagerVersion,
          hasCron,
          scaffoldOptions: options,
          aomexVersion,
          aomexContribVersions,
          prismaVersion,
        }),
        null,
        2,
      ) + '\n',
    ),
  );
  add('tsconfig.json', text(generateTsconfig({ orm: options.orm })));

  if (options.packageManager === 'pnpm') {
    const prismaSkillsDeny =
      options.orm === 'prisma'
        ? `permissions:
  prisma-json-types-generator:
    skills: false
`
        : '';
    const allowBuilds = formatPnpmAllowBuilds(
      buildAllowInstallScripts({ docker: options.docker }),
    );
    add(
      'pnpm-workspace.yaml',
      text(
        `${allowBuilds}minimumReleaseAgeExclude:
  - '@aomex/*'
  - '@aomex-contrib/*'
${prismaSkillsDeny}`,
      ),
    );
  }

  // —— 配置 ——
  const oauthSecretsFields = generateOAuthEnvSecretsFields(
    hasOAuth2 ? options.oauth2Presets : [],
  );
  const oauthAppConfigType = generateOAuthAppConfigType(
    hasOAuth2 ? options.oauth2Presets : [],
  );
  const oauthConfigLocal = generateOAuthAppConfigValue(
    hasOAuth2 ? options.oauth2Presets : [],
    'local',
  );
  const oauthConfigDeploy = generateOAuthAppConfigValue(
    hasOAuth2 ? options.oauth2Presets : [],
    'deploy',
  );
  const loggerSecretsFields = generateLoggerEnvSecretsFields(
    options.loggerTransports,
  );
  const loggerAppConfigType = generateLoggerAppConfigType(
    options.loggerTransports,
  );
  const loggerConfigValue = generateLoggerAppConfigValue(
    options.loggerTransports,
  );
  // Prisma driver adapter 与 Mongoose 在运行时读 configs.database。
  // MongoDB 的 Prisma Client 不走 adapter，连接串仍只给 prisma.config.ts 的 env()。
  const hasDatabaseConfig =
    options.orm === 'mongoose' ||
    (options.orm === 'prisma' &&
      !!options.prismaDatabase &&
      options.prismaDatabase !== 'mongodb');
  const databaseSecretField = hasDatabaseConfig
    ? '  DATABASE_URL: string;\n'
    : '';
  const databaseAppField = hasDatabaseConfig ? '  database: string;\n' : '';
  const databaseConfigValue = hasDatabaseConfig
    ? "  database: secrets.DATABASE_URL || '',\n"
    : '';
  add(
    'src/configs/shared.ts',
    text(`import type { RedisOptions } from '@aomex/cache-redis-adapter';

/**
 * 多环境共用的基底配置。
 * 各环境文件通过 \`...baseConfig\` 展开后，再覆盖本环境特有项。
 */
export const baseConfig = {
  // timeout: 30_000,
};

type BaseConfig = typeof baseConfig;

/**
 * 各环境密钥配置，来自.env*、Aws Secret Manager、Vault 等。
 */
export interface EnvSecrets {
${databaseSecretField}  REDIS_PASSWORD: string;
${oauthSecretsFields}${loggerSecretsFields}}

/**
 * 应用运行时配置
 */
export interface AppConfig extends BaseConfig {
${databaseAppField}  redis: RedisOptions;
${oauthAppConfigType}${loggerAppConfigType}}
`),
  );
  add(
    'src/configs/production.ts',
    text(`import { baseConfig, type AppConfig, type EnvSecrets } from './shared';

/**
 * 密钥配置请放 .env.production，需在生产服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as EnvSecrets;

export const production: AppConfig = {
  ...baseConfig,
${databaseConfigValue}  redis: {
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
${oauthConfigDeploy}${loggerConfigValue}};
`),
  );
  add(
    'src/configs/development.ts',
    text(`import { baseConfig, type EnvSecrets, type AppConfig } from './shared';

/**
 * 密钥配置请放 .env
 */
const secrets = process.env as unknown as EnvSecrets;

export const development: AppConfig = {
  ...baseConfig,
${databaseConfigValue}  redis: {
    host: 'localhost',
    port: 6379,
    password: secrets.REDIS_PASSWORD || 'abcde',
    db: 0,
  },
${oauthConfigLocal}${loggerConfigValue}};
`),
  );
  add(
    'src/configs/integration.ts',
    text(`import { baseConfig, type EnvSecrets, type AppConfig } from './shared';

/**
 * 密钥配置请放 .env.integration，需在集成服务器手动创建文件。
 * 有条件请用 AWS Secret Manager 或者 Vault 存储密钥。
 */
const secrets = process.env as unknown as EnvSecrets;

export const integration: AppConfig = {
  ...baseConfig,
${databaseConfigValue}  redis: {
    host: '',
    port: 6379,
    password: secrets.REDIS_PASSWORD || '',
    db: 0,
  },
${oauthConfigDeploy}${loggerConfigValue}};
`),
  );
  add(
    'src/configs/index.ts',
    text(`import 'dotenv/config';
import type { AppConfig } from './shared';

const env = (process.env['NODE_ENV'] || 'development') as
  'development' | 'production' | 'integration';

const configList = await import(\`./\${env}.js\`);

export const configs = configList[env] as AppConfig;
`),
  );

  // —— 入口 / 路由 / 指令 ——
  if (enableWeb) {
    add(
      'src/web.ts',
      text(
        generateWeb({
          plugins: options.webPlugins,
          docsUI: options.docsUI,
          language: options.language,
          separateListen:
            enableConsole && options.consoleMiddlewares.includes('openapi'),
          cluster: options.cluster,
          websocket: enableWebsocket,
          asyncapiDocs: enableWebsocket,
        }),
      ),
    );
  }
  if (enableWebsocket) {
    add('src/middleware/abuse.md.ts', text(generateAbuse()));
    add(
      'src/ws.ts',
      text(
        generateWs({
          language: options.language,
          withAccessLog: options.webPlugins.includes('access-log'),
        }),
      ),
    );
  }
  if (enableConsole) {
    add(
      'src/cli.ts',
      text(
        generateCli({
          consoleMiddlewares: options.consoleMiddlewares,
          language: options.language,
          cronPort,
        }),
      ),
    );
  }
  if (enableWeb) {
    const indexText = scaffoldText(options.language);
    add(
      'src/routers/index.router.ts',
      text(
        enrichOpenapi
          ? `import { Router } from '@aomex/web';

export const router = new Router({
  docs: {
    tags: ['${indexText.systemTag}'],
    deprecated: false,
  },
});

router.get('/', {
  docs: {
    tags: ['${indexText.systemTag}'],
    summary: '${indexText.indexSummary}',
    description: '${indexText.indexDesc}',
    operationId: 'getWelcome',
    deprecated: false,
    externalDocs: {
      description: '${indexText.articleExternalDocsDesc}',
      url: 'https://aomex.js.org',
    },
    showInOpenapi: false,
  },
  action: (ctx) => {
    ctx.send('Hello World');
  },
});
`
          : `import { Router } from '@aomex/web';

export const router = new Router();

router.get('/', {
  docs: { showInOpenapi: false },
  action: (ctx) => {
    ctx.send('Hello World');
  },
});
`,
      ),
    );
  }
  if (enableConsole) {
    add(
      'src/commanders/hello.cmd.ts',
      text(`import { Commander, options } from '@aomex/console';
import { rule } from '@aomex/common';

export const commander = new Commander();

/**
 * 指令示例
 *
 * ${exec} aomex hello
 * ${exec} aomex hello --user World
 * ${exec} aomex hello -u aomex.js
 */
commander.create('hello', {
  mount: [
    options(
      {
        user: rule.string().default('World'),
      },
      {
        user: ['u'],
      },
    ),
  ],
  action: async (ctx) => {
    const { user } = ctx.options;
    await ctx.logger.info(\`Hello \${user}\`);
  },
});
`),
    );
  }

  // —— 服务 ——
  add(
    'src/services/index.ts',
    text(
      generateServicesIndex(options.orm, {
        oauth2Presets: hasOAuth2 ? options.oauth2Presets : [],
      }),
    ),
  );
  if (options.orm !== 'none') {
    add(
      'src/services/article.service.ts',
      text(generateArticleService(options.orm, options.prismaDatabase)),
    );
  }
  add(
    'src/services/logger.service.ts',
    text(generateLogger(options.loggerTransports)),
  );
  add('src/services/cache.service.ts', text(generateCache()));
  add('src/services/passport.service.ts', text(generatePassportService()));
  if (hasOAuth2) {
    for (const [rel, content] of Object.entries(
      generateOAuth2Services(options.oauth2Presets),
    )) {
      add(rel, text(content));
    }
  }

  // —— 中间件 / 认证（Web）——
  if (enableWeb) {
    add(
      'src/middleware/format-error.md.ts',
      text(generateGlobalErrorRewrite()),
    );
    // 始终生成；未勾选的策略以注释保留
    add('src/middleware/auth.md.ts', text(generateAuth(options.auth)));
    add('src/constants/cookie-key.ts', text(generateCookieKey()));
  }

  if (hasOAuth2) {
    const oauthRouter = generateOAuth2Router(options.oauth2Presets);
    if (oauthRouter) {
      add('src/routers/oauth2.router.ts', text(oauthRouter));
    }
    if (options.oauth2Presets.includes('wechat-mini')) {
      add(
        'src/routers/wechat-mini.router.ts',
        text(generateWechatMiniRouter()),
      );
    }
    if (options.oauth2Presets.includes('google-identity')) {
      add(
        'src/routers/google-identity.router.ts',
        text(generateGoogleIdentityRouter()),
      );
    }
  }

  // —— 文档 / 插件附属 ——
  if (enableWeb) {
    const docs = generateDocsMiddleware(
      options.docsUI,
      opts.projectName,
      docsPathSecret,
      options.language,
    );
    if (docs) {
      add(`src/middleware/${docs.filename}`, text(docs.content));
      add(docs.markdown.filename, text(docs.markdown.content));
    }
  }
  if (enableWebsocket) {
    const asyncapiDocs = generateAsyncapiDocsMiddleware(
      opts.projectName,
      docsPathSecret,
    );
    add(`src/middleware/${asyncapiDocs.filename}`, text(asyncapiDocs.content));
    add(asyncapiDocs.markdown.filename, text(asyncapiDocs.markdown.content));
    add('src/channels/ping.channel.ts', text(generatePingChannel()));
    add('src/channels/chat.channel.ts', text(generateChatChannel()));
  }

  if (enableWeb && options.webPlugins.includes('access-log')) {
    add(
      'src/middleware/access-log.md.ts',
      text(
        generateAccessLog(options.loggerTransports, {
          websocket: enableWebsocket,
        }),
      ),
    );
  }
  if (enableWeb && options.webPlugins.includes('async-trace')) {
    add(
      'src/middleware/slow-trace.md.ts',
      text(generateSlowTrace(options.language)),
    );
  }

  // —— ORM ——
  if (options.orm === 'prisma' && options.prismaDatabase) {
    add(
      'prisma/schema.prisma',
      text(generatePrismaSchema(options.prismaDatabase)),
    );
    add(
      'prisma.config.ts',
      text(`import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
`),
    );
    add(
      'src/services/prisma.service.ts',
      text(generatePrismaClient(options.prismaDatabase)),
    );
    add('src/schemas/prisma.schema.ts', text(generatePrismaSchemaModule()));
    add('src/schemas/article.schema.ts', text(generateArticleSchema()));
    if (
      options.prismaDatabase !== 'sqlserver' &&
      options.prismaDatabase !== 'mongodb'
    ) {
      add('src/utils/prisma-json.ts', text(generatePrismaJsonUtil()));
    }
    if (enableWeb) {
      add(
        'src/routers/article.router.ts',
        text(
          generatePrismaArticleRouter(
            options.language,
            options.prismaDatabase,
            enrichOpenapi,
          ),
        ),
      );
    }
  } else if (options.orm === 'mongoose') {
    const mongo = generateMongooseFiles(options.language, enrichOpenapi);
    add('src/services/mongoose.service.ts', text(mongo.mongoose));
    add('src/models/article.model.ts', text(mongo.articleModel));
    if (enableWeb) {
      add('src/routers/article.router.ts', text(mongo.articleRouter));
    }
  }

  // —— env / 本地依赖 compose ——
  const localEnv = generateEnvExample(opts.projectName, options, 'local');
  const deployEnv = generateEnvExample(opts.projectName, options, 'deploy');
  add(
    '.env',
    text(`# 本地密钥配置，请勿随git提交
# 配置项有变化时建议及时同步 .env.example
${localEnv}`),
  );
  add(
    '.env.example',
    text(`# 初始化时从这里复制一份，并重命名为 .env{.xxx}
# 配置项有变化时建议及时同步该文件
${localEnv}`),
  );
  add(
    '.env.integration',
    text(`# 集成环境密钥配置，复制到集成服务器。请勿随git提交
${deployEnv}`),
  );
  add(
    '.env.production',
    text(`# 生产环境密钥配置，复制到生产服务器。请勿随git提交
${deployEnv}`),
  );
  add(
    'docker-compose.yml',
    text(
      generateDockerCompose(
        opts.projectName,
        options.orm,
        options.prismaDatabase,
      ),
    ),
  );

  // —— 本地启动 / 构建辅助 ——
  add(
    'scripts/start.mjs',
    text(
      generateStartScript({
        orm: options.orm,
        hasCron,
        hasWeb: enableWeb,
        packageManager: options.packageManager,
      }),
    ),
  );

  if (options.cluster === 'pm2') {
    add(
      'ecosystem.config.cjs',
      text(generatePm2Ecosystem({ docker: options.docker })),
    );
  }

  // —— 无 Docker：本机 / 裸机部署（直接跑 TS）——
  if (!options.docker) {
    add(
      'scripts/deploy.mjs',
      text(
        generateBareDeployScript({
          packageManager: options.packageManager,
          cluster: options.cluster,
          orm: options.orm,
        }),
      ),
    );
  }

  // —— Docker 部署（生产 / 集成）——
  if (options.docker) {
    add(
      'scripts/build-minify.mjs',
      text(`import * as esbuild from 'esbuild';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));
const target = tsconfig.compilerOptions?.target ?? 'esnext';

const baseDir = path.resolve('./build');
const entryPoints = readdirSync(baseDir, { encoding: 'utf8', recursive: true })
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(baseDir, file));

if (entryPoints.length === 0) {
  console.error('No .js files found in build/');
  process.exit(1);
}

await esbuild.build({
  entryPoints,
  outdir: baseDir,
  outbase: baseDir,
  allowOverwrite: true,
  minify: true,
  keepNames: true,
  sourcemap: true,
  sourcesContent: false,
  legalComments: 'none',
  drop: ['debugger'],
  charset: 'utf8',
  target,
  platform: 'node',
  format: 'esm',
  logLevel: 'info',
});
`),
    );
    add(
      'scripts/build-fix-source-map.mjs',
      text(`import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve('./build');
const files = readdirSync(baseDir, { encoding: 'utf8', recursive: true });

for (const file of files) {
  if (file.endsWith('.js.map')) {
    const fullPath = path.join(baseDir, file);
    const content = JSON.parse(readFileSync(fullPath, 'utf8'));
    content.sources = content.sources.map((sourceFile) => path.basename(sourceFile));
    writeFileSync(fullPath, JSON.stringify(content));
  }
}
`),
    );
    add(
      '.dockerignore',
      text(`volumes/
node_modules/
coverage/
.git/
.vscode/
.cursor/
.claude/
.agents/
.husky/
.idea/
.env*
`),
    );
    add(
      'Dockerfile.production',
      text(generateDockerfile('production', options.cluster)),
    );
    add(
      'Dockerfile.integration',
      text(generateDockerfile('integration', options.cluster)),
    );
    add(
      'docker-compose-production.yml',
      text(
        generateDeployCompose({
          env: 'production',
          hasCron,
          orm: options.orm,
          cluster: options.cluster,
        }),
      ),
    );
    add(
      'docker-compose-integration.yml',
      text(
        generateDeployCompose({
          env: 'integration',
          hasCron,
          orm: options.orm,
          cluster: options.cluster,
        }),
      ),
    );
    add(
      'scripts/build-in-docker.sh',
      sh(generateBuildInDockerScript(options.packageManager)),
    );
    add('scripts/deploy.mjs', text(generateDockerDeployScript()));
    add('scripts/deploy-api.mjs', text(generateDockerDeployApiScript()));
    if (hasCron) {
      add('scripts/deploy-cron.mjs', text(generateDockerDeployCronScript()));
      add(
        'scripts/docker-cron-stats.mjs',
        text(generateDockerCronStatsScript()),
      );
      add('scripts/docker-cron-stop.mjs', text(generateDockerCronStopScript()));
    }
  }

  add('README.md', text(generateReadmeFromOptions(opts.projectName, options)));

  return files;
};
