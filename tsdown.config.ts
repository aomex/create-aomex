import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  fixedExtension: false,
  sourcemap: true,
  dts: true,
  shims: false,
});
