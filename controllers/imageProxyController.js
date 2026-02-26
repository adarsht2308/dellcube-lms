import https from 'https';
import http from 'http';
import { URL } from 'url';

export const imageProxy = (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      },
    };

    // Set port if specified
    if (parsedUrl.port) {
      options.port = parsedUrl.port;
    }

    const proxyReq = httpModule.request(options, (proxyRes) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      
      // Check if response is an image
      const contentType = proxyRes.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) {
        console.warn(`Warning: Response is not an image. Content-Type: ${contentType}`);
      }

      // Pass through the headers from the remote server
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
      });
      
      // Pipe the image data directly to the client
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to fetch image', details: err.message });
      }
    });

    proxyReq.on('timeout', () => {
      console.error('Proxy request timeout');
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timeout' });
      }
    });
    
    proxyReq.setTimeout(10000); // 10 second timeout
    proxyReq.end();

  } catch (error) {
    console.error('Invalid URL:', error.message);
    res.status(400).json({ error: 'Invalid image URL', details: error.message });
  }
}; 