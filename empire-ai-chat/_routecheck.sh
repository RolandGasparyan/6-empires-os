#!/usr/bin/env bash
for p in /world /world/ /world/empire-hq /empire-hq /world/empire; do
  printf "%s = " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3010$p"
done
