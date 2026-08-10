(() => {
  'use strict';

  if (!window.maplibregl?.Map?.prototype?.addLayer) return;

  const COLORS = {
    life: '#e8a84c',
    education: '#4ca6d8',
    'home-campus': '#f0c15c',
    'ng-campus': '#5b91c8',
    'mission-site': '#55ae9b',
    conference: '#9276bd',
    'professional-travel': '#b77d96'
  };

  const originalAddLayer = window.maplibregl.Map.prototype.addLayer;

  window.maplibregl.Map.prototype.addLayer = function themedAddLayer(layer, beforeId) {
    const next = clone(layer);

    if (next?.id === 'life-points') {
      next.paint = {
        ...(next.paint || {}),
        'circle-radius': ['case', ['==', ['get', 'category'], 'home-campus'], 8.5, 5.7],
        'circle-color': categoryExpression(),
        'circle-stroke-width': ['case', ['==', ['get', 'category'], 'home-campus'], 2.4, 1.35],
        'circle-stroke-color': ['case', ['==', ['get', 'category'], 'home-campus'], '#fff2c9', '#f2f5f6']
      };
    }

    if (next?.id === 'life-point-halo') {
      next.paint = {
        ...(next.paint || {}),
        'circle-radius': ['case', ['==', ['get', 'category'], 'home-campus'], 15.5, 8.5],
        'circle-color': ['case', ['==', ['get', 'category'], 'home-campus'], 'rgba(217,169,78,0.12)', 'rgba(4,19,31,0.52)'],
        'circle-stroke-width': ['case', ['==', ['get', 'category'], 'home-campus'], 2.2, 0.8],
        'circle-stroke-color': ['case', ['==', ['get', 'category'], 'home-campus'], '#d9a94e', 'rgba(255,255,255,0.16)']
      };
    }

    if (next?.id === 'life-home-stars') {
      next.layout = {
        ...(next.layout || {}),
        'text-field': '✦',
        'text-size': 11,
        'text-allow-overlap': true,
        'text-ignore-placement': true
      };
      next.paint = {
        ...(next.paint || {}),
        'text-color': '#fff4d4',
        'text-halo-color': 'rgba(217,169,78,.35)',
        'text-halo-width': 1.2
      };
    }

    if (next?.id === 'life-clusters') {
      next.paint = {
        ...(next.paint || {}),
        'circle-color': '#071d2d',
        'circle-stroke-color': '#d9a94e',
        'circle-stroke-width': 1.35
      };
    }

    if (next?.id === 'life-clusters-halo') {
      next.paint = {
        ...(next.paint || {}),
        'circle-color': 'rgba(4,19,31,.88)',
        'circle-stroke-color': 'rgba(217,169,78,.16)'
      };
    }

    if (next?.id === 'selected-place-ring') {
      next.paint = {
        ...(next.paint || {}),
        'circle-radius': 16,
        'circle-color': 'rgba(217,169,78,.055)',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#f1cd82'
      };
    }

    return originalAddLayer.call(this, next, beforeId);
  };

  function categoryExpression() {
    const expression = ['match', ['get', 'category']];
    Object.entries(COLORS).forEach(([key, value]) => expression.push(key, value));
    expression.push('#d9a94e');
    return expression;
  }

  function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
})();
