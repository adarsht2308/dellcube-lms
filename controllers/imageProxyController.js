import https from 'https';
import { URL } from 'url';

export const imageProxy = (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  try {
    const parsedUrl = new URL(imageUrl);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Pass through the headers from the remote server
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      // Pipe the image data directly to the client
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      if (!res.headersSent) {
        res.status(500).send('Failed to fetch image');
      }
    });
    
    proxyReq.end();

  } catch (error) {
    console.error('Invalid URL:', error);
    res.status(400).send('Invalid image URL');
  }
}; 