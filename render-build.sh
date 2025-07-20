#!/usr/bin/env bash
set -o errexit

npm install

# Puppeteer cache handling
if [[ -d $XDG_CACHE_HOME/puppeteer ]]; then
  echo "...Copying Puppeteer Cache from Build Cache"
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR || true
else
  echo "...No Puppeteer cache to copy"
fi
