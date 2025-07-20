#!/usr/bin/env bash
set -o errexit

npm install

# Explicitly install the browser for Puppeteer v21+
npx puppeteer browsers install chrome

# List all chrome binaries after install for debugging
echo "Listing Puppeteer cache after install:"
find /opt/render/project/ -name chrome || true
