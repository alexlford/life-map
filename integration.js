(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const allowedModes = new Set(['combined', 'life', 'work']);
  const truthy = value => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
  const embedded = truthy(params.get('embed'));
  const requestedMode = allowedModes.has(params.get('mode'))
    ? params.get('mode')
    : (embedded ? 'work' : null);
  const requestedProjection = params.get('projection');
  const requestedPlace = params.get('place');
  const requestedYearRaw = params.get('year');
  const requestedYear = requestedYearRaw === null ? NaN : Number(requestedYearRaw);
  const requestedTimeline = truthy(params.get('timeline')) || Number.isFinite(requestedYear);

  if (embedded) {
    document.documentElement.classList.add('embed-mode');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (embedded) {
      document.body.classList.add('is-embedded');
      document.title = 'Professional Journey Map | Alex Ford';
    }

    if (requestedMode) activateMode(requestedMode);
    if (requestedTimeline) activateTimeline(requestedYear);
    if (requestedProjection === 'globe') activateGlobeWhenReady();
    if (requestedPlace) openInitialPlace(requestedPlace);

    bindUrlState();
    installParentBridge();
  });

  function activateMode(mode) {
    const button = document.querySelector(`.mode-button[data-mode="${cssEscape(mode)}"]`);
    if (button && !button.classList.contains('is-active')) button.click();
  }

  function activateTimeline(year) {
    const toggle = document.getElementById('timeline-all-button');
    const slider = document.getElementById('timeline-slider');
    if (!toggle || !slider) return;

    if (slider.disabled) toggle.click();
    if (Number.isFinite(year)) {
      const min = Number(slider.min) || 1988;
      const max = Number(slider.max) || new Date().getFullYear();
      slider.value = String(Math.max(min, Math.min(max, year)));
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function activateGlobeWhenReady() {
    const button = document.getElementById('projection-button');
    const status = document.getElementById('map-status-text');
    if (!button) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      const mapReady = status && !/NOMINAL|LOAD/i.test(status.textContent || '');
      if (mapReady) {
        window.clearInterval(timer);
        if (button.getAttribute('aria-pressed') !== 'true') button.click();
        return;
      }
      attempts += 1;
      if (attempts >= 80) window.clearInterval(timer);
    }, 100);
  }

  function openInitialPlace(placeId) {
    const selector = `.place-row[data-place-id="${cssEscape(placeId)}"]`;
    let attempts = 0;
    const timer = window.setInterval(() => {
      const row = document.querySelector(selector);
      if (row) {
        window.clearInterval(timer);
        row.click();
        return;
      }
      attempts += 1;
      if (attempts >= 80) window.clearInterval(timer);
    }, 100);
  }

  function bindUrlState() {
    document.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', () => setQuery({ mode: button.dataset.mode, place: null }));
    });

    const timelineToggle = document.getElementById('timeline-all-button');
    const slider = document.getElementById('timeline-slider');
    const projectionButton = document.getElementById('projection-button');
    const resetButton = document.getElementById('reset-view-button');
    const detailClose = document.getElementById('detail-close');

    timelineToggle?.addEventListener('click', () => {
      window.setTimeout(() => {
        const active = !slider?.disabled;
        setQuery({
          timeline: active ? '1' : null,
          year: active ? slider.value : null
        });
      }, 0);
    });

    slider?.addEventListener('input', () => setQuery({ timeline: '1', year: slider.value }));

    projectionButton?.addEventListener('click', () => {
      window.setTimeout(() => {
        const globe = projectionButton.getAttribute('aria-pressed') === 'true';
        setQuery({ projection: globe ? 'globe' : null });
      }, 0);
    });

    resetButton?.addEventListener('click', () => setQuery({ place: null }));
    detailClose?.addEventListener('click', () => setQuery({ place: null }));

    document.addEventListener('click', event => {
      const target = event.target.closest('[data-place-id]');
      if (!target) return;
      const placeId = target.dataset.placeId;
      if (placeId) setQuery({ place: placeId });
    });
  }

  function setQuery(changes) {
    const url = new URL(window.location.href);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    });
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function installParentBridge() {
    if (!embedded || window.parent === window) return;

    const publish = () => {
      window.parent.postMessage({
        type: 'alexford-life-map:resize',
        height: Math.ceil(document.documentElement.getBoundingClientRect().height),
        mode: activeMode()
      }, '*');
    };

    window.parent.postMessage({ type: 'alexford-life-map:ready', mode: activeMode() }, '*');
    publish();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => publish());
      observer.observe(document.documentElement);
    } else {
      window.addEventListener('resize', publish, { passive: true });
    }
  }

  function activeMode() {
    return document.querySelector('.mode-button.is-active')?.dataset.mode || 'combined';
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
})();
