import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

execSync('docker compose -f docker-compose.yml down --timestamps', { stdio: 'inherit' });

const docker = spawn('docker compose -f docker-compose.yml up --wait', {
  stdio: ['inherit', 'inherit', 'pipe'],
  shell: true,
});

await new Promise((resolve) => {
  const reg = /mysql.+?healthy/i;
  docker.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    if (reg.test(chunk.toString())) {
      resolve();
    }
  });
});

const server = spawn(
  'npx prisma generate && npx prisma migrate deploy && node --import tsx/esm --watch src/web.ts',
  { stdio: 'inherit', shell: true },
);

const cron = spawn('npx aomex cron:start', { stdio: 'inherit', shell: true });

// 防止被其它逻辑清除监听
setTimeout(() => {
  process.on('SIGINT', () => {
    cron.kill('SIGINT');
    server.kill('SIGINT');
    docker.kill('SIGINT');
  });
}, 1000);
