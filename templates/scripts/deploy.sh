#!/usr/bin/env sh

set -ex

env="$1"
project_name="{{projectName}}"
docker_compose_file="docker-compose-$env.yml"

sudo docker build --tag "$project_name:$env" --file "Dockerfile.$env" .

cron_service_name=cron
if [ -n "$(sudo docker compose --file $docker_compose_file ps | { grep $cron_service_name || :; })" ]
then
  # exit 137 SIGKILL
  { sudo docker compose --file $docker_compose_file exec -it $cron_service_name /bin/sh -c "npx aomex cron:stop" || :; }
fi

sudo docker compose --file $docker_compose_file up -d --timeout=1 --remove-orphans
