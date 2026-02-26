/**
 * Cache Management Utility
 * Clears browser caches to ensure fresh data after login
 */

/**
 * Clear all browser caches except essential data (like auth token)
 * @param {Object} options - Configuration options
 * @param {boolean} options.preserveToken - Whether to preserve the auth token (default: true)
 * @param {Array<string>} options.preserveKeys - Additional localStorage keys to preserve
 * @returns {Promise<Object>} Result object with success status and details
 */
export const clearBrowserCache = async (options = {}) => {
  const {
    preserveToken = true,
    preserveKeys = [],
  } = options;

  const results = {
    success: true,
    cleared: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Clear localStorage (preserving specified keys)
    try {
      const keysToPreserve = preserveToken ? ['token', ...preserveKeys] : preserveKeys;
      const preservedData = {};

      // Save data that should be preserved
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          preservedData[key] = value;
        }
      });

      // Clear all localStorage
      localStorage.clear();

      // Restore preserved data
      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      results.cleared.push('localStorage');
      console.log('[CacheManager] localStorage cleared (preserved keys:', keysToPreserve.join(', ') + ')');
    } catch (error) {
      results.errors.push({ type: 'localStorage', error: error.message });
      console.error('[CacheManager] Error clearing localStorage:', error);
    }

    // 2. Clear sessionStorage
    try {
      sessionStorage.clear();
      results.cleared.push('sessionStorage');
      console.log('[CacheManager] sessionStorage cleared');
    } catch (error) {
      results.errors.push({ type: 'sessionStorage', error: error.message });
      console.error('[CacheManager] Error clearing sessionStorage:', error);
    }

    // 3. Clear Service Worker caches (if available)
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        results.cleared.push(`servicWorkerCaches (${cacheNames.length} caches)`);
        console.log('[CacheManager] Service Worker caches cleared:', cacheNames);
      } catch (error) {
        results.errors.push({ type: 'serviceWorkerCaches', error: error.message });
        console.error('[CacheManager] Error clearing Service Worker caches:', error);
      }
    }

    // 4. Clear IndexedDB (if available)
    if ('indexedDB' in window) {
      try {
        const databases = await window.indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            return new Promise((resolve, reject) => {
              const deleteRequest = window.indexedDB.deleteDatabase(db.name);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
              deleteRequest.onblocked = () => {
                console.warn('[CacheManager] IndexedDB deletion blocked for:', db.name);
                resolve(); // Don't fail if blocked
              };
            });
          })
        );
        results.cleared.push(`indexedDB (${databases.length} databases)`);
        console.log('[CacheManager] IndexedDB cleared:', databases.map(db => db.name));
      } catch (error) {
        results.errors.push({ type: 'indexedDB', error: error.message });
        console.error('[CacheManager] Error clearing IndexedDB:', error);
      }
    }

    // 5. Request browser to clear HTTP cache (best effort)
    try {
      // This is a hint to the browser, not guaranteed to work
      if (window.performance && window.performance.clearResourceTimings) {
        window.performance.clearResourceTimings();
        results.cleared.push('resourceTimings');
      }
    } catch (error) {
      results.errors.push({ type: 'resourceTimings', error: error.message });
    }

    results.success = results.errors.length === 0;
    
    console.log('[CacheManager] Cache clearing completed:', results);
    return results;
  } catch (error) {
    console.error('[CacheManager] Unexpected error during cache clearing:', error);
    return {
      success: false,
      cleared: results.cleared,
      errors: [...results.errors, { type: 'unexpected', error: error.message }],
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Clear cache and reload the page
 * Useful for ensuring a completely fresh start
 * @param {Object} options - Same as clearBrowserCache options
 */
export const clearCacheAndReload = async (options = {}) => {
  await clearBrowserCache(options);
  
  // Use location.reload(true) to force reload from server (bypassing cache)
  // In modern browsers, this forces a cache refresh
  window.location.reload();
};

/**
 * Get current cache statistics
 * @returns {Promise<Object>} Cache usage information
 */
export const getCacheStats = async () => {
  const stats = {
    localStorage: {
      itemCount: localStorage.length,
      keys: Object.keys(localStorage),
    },
    sessionStorage: {
      itemCount: sessionStorage.length,
      keys: Object.keys(sessionStorage),
    },
  };

  // Get Service Worker cache info
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      stats.serviceWorkerCaches = {
        count: cacheNames.length,
        names: cacheNames,
      };
    } catch (error) {
      stats.serviceWorkerCaches = { error: error.message };
    }
  }

  // Get IndexedDB info
  if ('indexedDB' in window) {
    try {
      const databases = await window.indexedDB.databases();
      stats.indexedDB = {
        count: databases.length,
        names: databases.map(db => db.name),
      };
    } catch (error) {
      stats.indexedDB = { error: error.message };
    }
  }

  return stats;
};

export default {
  clearBrowserCache,
  clearCacheAndReload,
  getCacheStats,
};
