#!/usr/bin/env sh

set -ex

# 国内环境请打开镜像注释
# npm config set registry https://registry.npmmirror.com
# export COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
corepack enable # package.json => packageManager
npm ci
npm exec -- tsc
npm exec -- tsc-alias --resolve-full-paths
node ./scripts/build-minify.mjs
node ./scripts/build-fix-source-map.mjs
rm -rf src
mv build/src .
npm prune --omit=dev
rm -rf node_modules/@types node_modules/*/*.d.ts
