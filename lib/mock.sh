#! /bin/bash

function response_error {
  # shellcheck disable=SC2005
  echo "$(jq -n --arg message "$1" '{
    code: 1,
    message: $message
  }')"
  exit
}

function response_ok {
  # echo "$(jq -n '{ code: 0, data: {} }')"
  # shellcheck disable=SC2005
  DATE=$(date)
  echo "$(jq -n \
        --arg torrent_hash "$DATE" \
        '{
          code: 0,
          data: {
            hash: $torrent_hash
          }
        }')"
}

# echo "$@"

# sleep 1
# response_error "there was an error"

cmd="ls . > /dev/null 2>&1"
if eval "$cmd"; then
  response_ok
else
  response_error "there was an error"
fi
