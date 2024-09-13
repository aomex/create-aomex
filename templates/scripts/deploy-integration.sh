#!/usr/bin/env sh

set -ex

sudo docker build --tag {{projectName}}:latest --file Dockerfile.integration .

cron_container=$(sudo docker ps | { grep "{{projectName}}-cron" || :; })
if [ -n "$cron_container" ];
then
  sudo docker exec it {{projectName}}-cron /bin/sh -c "npx aomex cron:stop"
fi

sudo docker compose --file Dockerfile.integration up -d --timeout=1
