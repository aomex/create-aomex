#!/usr/bin/env bash

npx ts-node src/index.ts --name=snapshots/all-pnpm --orm=prisma --tools=prettier --tools=commitlint --pnpm --force
npx ts-node src/index.ts --name=snapshots/all-yarn --orm=prisma --tools=prettier --tools=commitlint --yarn --force
npx ts-node src/index.ts --name=snapshots/all-npm --orm=prisma --tools=prettier --tools=commitlint --npm --force

npx ts-node src/index.ts --name=snapshots/without-tools --orm=prisma --no-tools --pnpm --force

npx ts-node src/index.ts --name=snapshots/without-orm --no-orm --tools=prettier --tools=commitlint --pnpm --force

rm -rf snapshots/*/.git