#!/usr/bin/env sh

set -ex

corepack enable
pnpm install
npx prisma generate
npx tsc && npx tsc-alias --resolve-full-paths
rm -rf src
mv build/src .
pnpm install --prod --ignore-scripts
