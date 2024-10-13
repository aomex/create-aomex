#!/usr/bin/env sh

set -e

git checkout main
git fetch
git reset --hard origin/main
git rebase origin/develop
git push
git switch -
