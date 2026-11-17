import * as esbuild from 'esbuild';
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
