#!/usr/bin/env sh

set -ex

corepack enable
pnpm install
pnpm prisma generate
pnpm exec tsc
pnpm exec tsc-alias --resolve-full-paths
rm -rf src
mv build/src .
pnpm install --prod
rm -rf node_modules/@types node_modules/*/*.d.ts
