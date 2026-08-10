(() => {
  'use strict';

  const MOBILE = window.matchMedia('(max-width: 900px)');
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
  const careerLabels = new Map();
  let decorateQueued = false;

  document.addEventListener('DOMContentLoaded', () => {
    installPanelToggle();
    installChapterFocus();
    loadCareerLabels();
  });

  function installPanelToggle() {
    const panel = document.querySelector('.panel');
    const head = panel?.querySelector('.panel-head');
    if (!panel || !head || head.querySelector('.panel-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Expand map controls');
    button.innerHTML = '<span class="panel-toggle-icon" aria-hidden="true">⌃</span>';
    head.appendChild(button);

    const setExpanded = expanded => {
      panel.classList.toggle('is-expanded', expanded && MOBILE.matches);
      button.setAttribute('aria-expanded', String(expanded && MOBILE.matches));
      button.setAttribute('aria-label', expanded && MOBILE.matches ? 'Collapse map controls' : 'Expand map controls');
    };

    button.addEventListener('click', () => setExpanded(!panel.classList.contains('is-expanded')));

    panel.addEventListener('click', event => {
      if (!MOBILE.matches) return;
      if (event.target.closest('.chapter')) {
        window.setTimeout(() => setExpanded(false), 0);
      }
    });

    MOBILE.addEventListener?.('change', event => {
      if (!event.matches) setExpanded(false);
    });
  }

  function installChapterFocus() {
    const chapters = document.getElementById('chapters');
    if (!chapters) return;

    const focusActive = () => {
      const active = chapters.querySelector('.chapter.active');
      if (!active || !MOBILE.matches) return;
      active.scrollIntoView({
        behavior: REDUCED_MOTION.matches ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    };

    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' && m.attributeName === 'class')) focusActive();
    });
    observer.observe(chapters, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  async function loadCareerLabels() {
    try {
      const [storiesResponse, placesResponse] = await Promise.all([
        fetch('./data/stories.json', { cache: 'force-cache' }),
        fetch('./data/places.json', { cache: 'force-cache' })
      ]);
      if (!storiesResponse.ok || !placesResponse.ok) return;

      const stories = await storiesResponse.json();
      const places = await placesResponse.json();
      const byId = new Map((places.places || []).map(place => [place.id, place]));

      for (const chapter of stories.careerChapters || []) {
        const place = byId.get(chapter.placeId);
        if (!place) continue;
        const label = String(chapter.location || place.city || place.displayName || place.name).split(',')[0].trim();
        [place.displayName, place.name].filter(Boolean).forEach(name => careerLabels.set(name, label));
      }

      installMarkerObserver();
      decorateMarkers();
    } catch (_) {
      // This layer is purely presentational; the map remains fully usable without it.
    }
  }

  function installMarkerObserver() {
    const markerLayer = document.getElementById('markers');
    if (!markerLayer) return;
    const observer = new MutationObserver(queueDecoration);
    observer.observe(markerLayer, { childList: true });
  }

  function queueDecoration() {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(() => {
      decorateQueued = false;
      decorateMarkers();
    });
  }

  function decorateMarkers() {
    const layer = document.getElementById('markers');
    if (!layer || !careerLabels.size) return;

    layer.querySelectorAll('.cluster').forEach(cluster => {
      const title = cluster.getAttribute('title') || '';
      cluster.classList.toggle('career-cluster', [...careerLabels.keys()].some(name => title.includes(name)));
    });

    layer.querySelectorAll('.marker.career').forEach(marker => {
      const title = marker.getAttribute('title') || '';
      const labelText = careerLabels.get(title);
      if (!labelText) return;

      const left = marker.style.left;
      const top = marker.style.top;
      const existing = [...layer.querySelectorAll('.career-map-label')].find(label => label.dataset.markerTitle === title);
      if (existing) {
        existing.style.left = left;
        existing.style.top = top;
        return;
      }

      [...layer.querySelectorAll('.map-label')].forEach(label => {
        if (label.style.left === left && label.style.top === top) label.remove();
      });

      const label = document.createElement('div');
      label.className = 'career-map-label';
      label.dataset.markerTitle = title;
      label.textContent = labelText;
      label.style.left = left;
      label.style.top = top;
      layer.appendChild(label);
    });
  }
})();
