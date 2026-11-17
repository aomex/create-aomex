import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const env = process.argv[2];
if (env !== 'production' && env !== 'integration') {
  console.error('usage: node scripts/deploy.mjs <production|integration>');
  process.exit(1);
}

const run = (cmd) => {
  console.log('+', cmd);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, NODE_ENV: env } });
};

const envFile = `.env.${env}`;
if (!existsSync(envFile)) {
  console.error(`missing ${envFile}`);
  process.exit(1);
}
const envContent = readFileSync(envFile, 'utf8');
writeFileSync(
  '.env',
  /^(NODE_ENV=)/m.test(envContent)
    ? envContent.replace(/^NODE_ENV=.*$/m, `NODE_ENV=${env}`)
    : `${envContent.trimEnd()}\nNODE_ENV=${env}\n`,
);

run('pm2 startOrReload ecosystem.config.cjs --update-env');
