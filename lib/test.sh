#! /bin/bash

# echo "$@"

# sleep 3
cmd="ls . > /dev/null 2>&1"
if eval "$cmd"; then
  echo "$(jq -n '{ error: null, data: {} }')"
else
  echo "ERR"
fi
