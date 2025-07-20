#!/usr/bin/env bash
set -o errexit

npm install

# Ensure Puppeteer downloads Chromium
npx puppeteer install

# Puppeteer cache handling
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then 
  echo "Copying Puppeteer Cache from Build Cache..." 
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR
else 
  echo "Storing Puppeteer Cache in Build Cache..." 
  cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME
fi
