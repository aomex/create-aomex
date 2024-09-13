import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

execSync('docker compose -f docker-compose-development.yml down', { stdio: 'inherit' });

const docker = spawn('docker compose -f docker-compose-development.yml up', {
  stdio: ['inherit', 'inherit', 'pipe'],
  shell: 'zsh',
});

await new Promise((resolve) => {
  docker.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    if (chunk.toString().includes('port: 3306  MySQL Community Server - GPL.')) {
      resolve();
    }
  });
});

const server = spawn(
  'npx prisma migrate deploy && npx prisma generate && node --import tsx/esm --watch src/web.ts',
  { stdio: 'inherit', shell: 'zsh' },
);

const cron = spawn('npx', ['aomex', 'cron:start'], { stdio: 'inherit', shell: 'zsh' });

// 防止被其它逻辑清除监听
setTimeout(() => {
  process.on('SIGINT', () => {
    cron.kill('SIGINT');
    server.kill('SIGINT');
    docker.kill('SIGINT');
  });
}, 1000);
