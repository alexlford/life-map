(() => {
  'use strict';

  const startedAt = performance.now();
  const originalFetch = window.fetch.bind(window);
  const dataPaths = [
    './data/places.json',
    './data/experiences.json',
    './data/stories.json'
  ];
  const dataUrls = new Set(dataPaths.map(path => new URL(path, window.location.href).href));
  const responseCache = new Map();

  window.__lifeMapPerformance = { startedAt };

  window.fetch = function lifeMapFetch(input, init = {}) {
    const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const rawUrl = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const absoluteUrl = rawUrl ? new URL(rawUrl, window.location.href).href : '';

    if (method === 'GET' && dataUrls.has(absoluteUrl)) {
      if (!responseCache.has(absoluteUrl)) {
        const requestInit = {
          ...init,
          cache: 'force-cache'
        };
        responseCache.set(
          absoluteUrl,
          originalFetch(absoluteUrl, requestInit).then(response => {
            if (!response.ok) {
              responseCache.delete(absoluteUrl);
              throw new Error(`Request failed: ${response.status} ${absoluteUrl}`);
            }
            return response;
          })
        );
      }
      return responseCache.get(absoluteUrl).then(response => response.clone());
    }

    return originalFetch(input, init);
  };

  // Start all small first-party data requests while the larger MapLibre bundle is downloading.
  dataUrls.forEach(url => {
    window.fetch(url).catch(() => {
      // The application will surface the actual data error if a later request also fails.
    });
  });
})();
