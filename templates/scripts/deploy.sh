#!/usr/bin/env sh

set -ex

env="$1"
projectName="{{projectName}}"

sudo docker build --tag "$projectName:$env" --file "Dockerfile.$env" .

cron_container_name="$projectName-cron-$env"
container_exist=$(sudo docker ps | { grep $cron_container_name || :; })
if [ -n "$container_exist" ];
then
  sudo docker exec -it $cron_container_name /bin/sh -c "npx aomex cron:stop"
fi

sudo docker compose --file "docker-compose-$env.yml" up -d --timeout=1 --remove-orphans
