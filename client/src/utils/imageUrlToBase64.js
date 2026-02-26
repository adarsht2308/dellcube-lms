export const imageUrlToBase64 = (url, retries = 2) => {
  return new Promise((resolve, reject) => {
    // Check if the URL is already a base64 string
    if (!url || typeof url !== 'string') {
      console.warn('imageUrlToBase64: Invalid URL provided:', url);
      resolve(null);
      return;
    }

    if (url.startsWith('data:image')) {
      resolve(url);
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      console.error('imageUrlToBase64: Invalid URL format:', url, error);
      resolve(null);
      return;
    }
    
    // Use our backend proxy for external URLs
    const proxyUrl = `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    fetch(proxyUrl, { 
      credentials: 'include',
      signal: controller.signal,
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`Proxy error! status: ${response.status} ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          console.warn(`Warning: Response is not an image. Content-Type: ${contentType}`);
        }
        return response.blob();
      })
      .then(blob => {
        if (!blob || blob.size === 0) {
          throw new Error('Empty blob received');
        }
        return new Promise((resolveReader, rejectReader) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolveReader(reader.result);
            } else {
              rejectReader(new Error('FileReader returned empty result'));
            }
          };
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            rejectReader(error);
          };
          reader.readAsDataURL(blob);
        });
      })
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error(`Timeout fetching image via proxy for URL: ${url}`);
        } else {
          console.error(`Error fetching image via proxy for URL: ${url}`, error);
        }
        
        // Retry logic
        if (retries > 0) {
          console.log(`Retrying image conversion (${retries} retries left)...`);
          setTimeout(() => {
            imageUrlToBase64(url, retries - 1).then(resolve).catch(() => resolve(null));
          }, 1000);
        } else {
          // Resolve with null so PDF generation doesn't fail
          resolve(null);
        }
      });
  });
}; 