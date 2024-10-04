#!/usr/bin/env sh

set -ex

corepack enable # package.json => packageManager
pnpm install
pnpm exec prisma generate
pnpm exec tsc
pnpm exec tsc-alias --resolve-full-paths
rm -rf src
mv build/src .
pnpm install --prod
rm -rf node_modules/@types node_modules/*/*.d.ts
ln -s $PWD/node_modules/.bin/aomex /usr/local/bin/aomex
ln -s $PWD/node_modules/.bin/prisma /usr/local/bin/prisma
