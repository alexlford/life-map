(() => {
  'use strict';

  if (!window.maplibregl?.Map) return;

  const OriginalMap = window.maplibregl.Map;

  // A local style object avoids a remote style JSON plus its vector sources,
  // glyphs and sprites. The raster basemap is pre-rendered, so mobile devices
  // only need a handful of image tiles before the interactive overlay is ready.
  const FAST_BASEMAP = {
    version: 8,
    name: 'Life Map Fast Basemap',
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxzoom: 20
      }
    },
    layers: [
      {
        id: 'carto-dark',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 20,
        paint: {
          'raster-opacity': 0.92,
          'raster-fade-duration': 0,
          'raster-saturation': -0.16,
          'raster-contrast': 0.08,
          'raster-brightness-min': 0.06,
          'raster-brightness-max': 0.9
        }
      }
    ]
  };

  class LifeMap extends OriginalMap {
    constructor(options = {}) {
      super({
        ...options,
        style: FAST_BASEMAP,
        validateStyle: false,
        fadeDuration: 0,
        renderWorldCopies: false,
        refreshExpiredTiles: false
      });

      const perf = window.__lifeMapPerformance || {};
      this.once('load', () => {
        const elapsed = Math.round(performance.now() - (perf.startedAt || performance.now()));
        document.documentElement.classList.add('map-has-loaded');
        document.getElementById('map-load-screen')?.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => document.getElementById('map-load-screen')?.remove(), 220);
        console.info(`[Life Map] map load: ${elapsed} ms`);
      });

      this.once('idle', () => {
        const elapsed = Math.round(performance.now() - (perf.startedAt || performance.now()));
        console.info(`[Life Map] first idle: ${elapsed} ms`);
      });
    }
  }

  Object.setPrototypeOf(LifeMap, OriginalMap);
  window.maplibregl.Map = LifeMap;
})();
