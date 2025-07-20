import { join } from 'path';

/** @type {import("puppeteer").Configuration} */
const config = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(new URL('.', import.meta.url).pathname, '.cache', 'puppeteer'),
};

export default config;
