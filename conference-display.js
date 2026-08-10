(() => {
  'use strict';

  const byPlace = new Map();
  const aliases = new Map();
  let queued = false;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const [conferenceResponse, placesResponse] = await Promise.all([
        fetch('./data/conferences.json', { cache: 'force-cache' }),
        fetch('./data/places.json', { cache: 'force-cache' })
      ]);
      if (!conferenceResponse.ok || !placesResponse.ok) return;

      const conferenceDoc = await conferenceResponse.json();
      const placesDoc = await placesResponse.json();
      const placeById = new Map((placesDoc.places || []).map(place => [place.id, place]));

      for (const conference of conferenceDoc.conferences || []) {
        const place = placeById.get(conference.placeId);
        if (!place) continue;
        const record = { ...conference, place };
        byPlace.set(conference.placeId, record);
        [place.displayName, place.name].filter(Boolean).forEach(name => aliases.set(name, record));
      }

      observe(document.getElementById('list'));
      observe(document.getElementById('searchResults'));
      observe(document.getElementById('markers'));
      observe(document.getElementById('detail'));
      decorate();
    } catch (_) {
      // Presentation enhancement only. The core map remains usable without it.
    }
  }

  function observe(node) {
    if (!node) return;
    new MutationObserver(queueDecorate).observe(node, { childList: true, subtree: true });
  }

  function queueDecorate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorate();
    });
  }

  function decorate() {
    decorateRows('#list .place-row[data-place]');
    decorateRows('#searchResults .search-result[data-place]');
    decorateMarkers();
    decorateDetail();
  }

  function decorateRows(selector) {
    document.querySelectorAll(selector).forEach(row => {
      const conference = byPlace.get(row.dataset.place);
      if (!conference) return;
      row.classList.add('conference-entry');
      const title = row.querySelector('strong');
      const secondary = row.querySelector('.place-copy span, > span:last-child');
      if (title) title.textContent = conference.eventName;
      if (secondary) secondary.textContent = conference.locationLabel;
      row.setAttribute('aria-label', `${conference.eventName}, ${conference.locationLabel}`);
    });
  }

  function decorateMarkers() {
    const layer = document.getElementById('markers');
    if (!layer) return;

    layer.querySelectorAll('.marker').forEach(marker => {
      const conference = aliases.get(marker.getAttribute('title') || '');
      if (!conference) return;
      marker.dataset.conferencePlace = conference.placeId;
      marker.title = `${conference.eventName} — ${conference.locationLabel}`;
      marker.setAttribute('aria-label', `${conference.eventName}, ${conference.locationLabel}`);

      const left = marker.style.left;
      const top = marker.style.top;
      layer.querySelectorAll('.map-label').forEach(label => {
        if (label.style.left === left && label.style.top === top) {
          label.textContent = conference.shortName || conference.eventName;
          label.classList.add('conference-map-label');
        }
      });
    });
  }

  function decorateDetail() {
    const detail = document.getElementById('detail');
    if (!detail || detail.hidden) return;
    const placeId = new URLSearchParams(location.search).get('place');
    const conference = byPlace.get(placeId);
    if (!conference) return;

    detail.classList.add('conference-detail');
    const eyebrow = detail.querySelector('.detail-eyebrow');
    const heading = detail.querySelector('.detail h2');
    const location = detail.querySelector('.detail-location');
    if (eyebrow && !/^CONFERENCE/i.test(eyebrow.textContent || '')) eyebrow.textContent = 'CONFERENCE';
    if (heading) heading.textContent = conference.eventName;
    if (location) location.textContent = conference.locationLabel;
  }
})();
