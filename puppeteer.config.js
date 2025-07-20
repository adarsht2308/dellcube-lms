import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import("puppeteer").Configuration} */
const config = {
  // Changes the cache location for Puppeteer
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

export default config;
