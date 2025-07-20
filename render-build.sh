#!/usr/bin/env bash
set -o errexit

npm install

# Force Puppeteer to download Chromium and show output
npx puppeteer install --loglevel verbose

# List all chrome binaries after install for debugging
echo "Listing Puppeteer cache after install:"
find /opt/render/project/ -name chrome || true
