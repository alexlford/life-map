(() => {
  'use strict';

  if (!window.maplibregl?.Map) return;

  const OriginalMap = window.maplibregl.Map;

  class LifeMap extends OriginalMap {
    constructor(options = {}) {
      super({
        ...options,
        validateStyle: false,
        fadeDuration: 0,
        renderWorldCopies: false
      });

      const perf = window.__lifeMapPerformance || {};
      this.once('load', () => {
        const elapsed = Math.round(performance.now() - (perf.startedAt || performance.now()));
        document.documentElement.classList.add('map-has-loaded');
        document.getElementById('map-load-screen')?.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => document.getElementById('map-load-screen')?.remove(), 260);
        console.info(`[Life Map] map load: ${elapsed} ms`);
      });

      this.once('idle', () => {
        const elapsed = Math.round(performance.now() - (perf.startedAt || performance.now()));
        console.info(`[Life Map] first idle: ${elapsed} ms`);
      });
    }
  }

  // Preserve the original static inheritance chain while allowing app.js to use
  // the normal `new maplibregl.Map(...)` API.
  Object.setPrototypeOf(LifeMap, OriginalMap);
  window.maplibregl.Map = LifeMap;
})();
