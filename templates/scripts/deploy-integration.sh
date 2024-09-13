#!/usr/bin/env sh

set -ex

sudo docker build --tag {{projectName}}:integration --file Dockerfile.integration .

cron_container_name={{projectName}}-cron-integration
container_exist=$(sudo docker ps | { grep $cron_container_name || :; })
if [ -n "$container_exist" ];
then
  sudo docker exec it $cron_container_name /bin/sh -c "npx aomex cron:stop"
fi

sudo docker compose --file docker-compose-integration.yml up -d --timeout=1
