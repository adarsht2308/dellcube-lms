export const imageUrlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    // Check if the URL is already a base64 string
    if (url.startsWith('data:image')) {
      resolve(url);
      return;
    }
    
    // Use our backend proxy for external URLs
    const proxyUrl = `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;

    fetch(proxyUrl, { credentials: 'include' }) // Include credentials (cookies)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Proxy error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error(`Error fetching image via proxy for URL: ${url}`, error);
        // Resolve with null so PDF generation doesn't fail
        resolve(null);
      });
  });
}; 