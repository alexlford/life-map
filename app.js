(() => {
  'use strict';

  const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
  const CURRENT_YEAR = new Date().getFullYear();

  const CATEGORY_CONFIG = {
    life: { label: 'Life / homes', color: '#e0ad59', modes: ['combined', 'life'] },
    education: { label: 'Education', color: '#65b3dc', modes: ['combined', 'life'] },
    'home-campus': { label: 'Home campuses', color: '#e3b95f', modes: ['combined', 'work'] },
    'ng-campus': { label: 'NG campuses', color: '#4f9bd5', modes: ['combined', 'work'] },
    'mission-site': { label: 'Mission sites', color: '#52b19f', modes: ['combined', 'work'] },
    conference: { label: 'Conferences', color: '#9875d0', modes: ['combined', 'work'] },
    'professional-travel': { label: 'Work travel', color: '#c27da0', modes: ['combined', 'work'] }
  };

  const state = {
    places: [],
    experiences: [],
    placeById: new Map(),
    experiencesByPlace: new Map(),
    mode: 'combined',
    activeCategories: new Set(Object.keys(CATEGORY_CONFIG)),
    timelineEnabled: false,
    year: CURRENT_YEAR,
    selectedPlaceId: null,
    projection: 'mercator',
    mapReady: false
  };

  const els = {};
  let map;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindStaticControls();
    syncTimelineRange();

    try {
      const [placesPayload, experiencesPayload] = await Promise.all([
        fetch('./data/places.json').then(assertOk).then(r => r.json()),
        fetch('./data/experiences.json').then(assertOk).then(r => r.json())
      ]);

      state.places = placesPayload.places || [];
      state.experiences = experiencesPayload.experiences || [];
      state.placeById = new Map(state.places.map(place => [place.id, place]));

      state.experiences.forEach(exp => {
        if (!state.experiencesByPlace.has(exp.placeId)) state.experiencesByPlace.set(exp.placeId, []);
        state.experiencesByPlace.get(exp.placeId).push(exp);
      });

      state.experiencesByPlace.forEach(exps => expSort(exps));

      renderCategoryFilters();
      initMap();
      updateUI();
    } catch (error) {
      console.error(error);
      setStatus('DATA LOAD ERROR');
      els.placeList.innerHTML = `<div class="empty-state">The map data could not be loaded. If you opened this file directly, serve the repository through a local web server or GitHub Pages.</div>`;
    }
  }

  function cacheElements() {
    els.visibleCount = document.getElementById('visible-count');
    els.search = document.getElementById('place-search');
    els.searchResults = document.getElementById('search-results');
    els.filters = document.getElementById('category-filters');
    els.clearFilters = document.getElementById('clear-filters-button');
    els.timelineButton = document.getElementById('timeline-all-button');
    els.timelineSlider = document.getElementById('timeline-slider');
    els.timelineYear = document.getElementById('timeline-year');
    els.timelineNote = document.getElementById('timeline-note');
    els.placeList = document.getElementById('place-list');
    els.detailPanel = document.getElementById('detail-panel');
    els.detailContent = document.getElementById('detail-content');
    els.detailClose = document.getElementById('detail-close');
    els.projectionButton = document.getElementById('projection-button');
    els.resetButton = document.getElementById('reset-view-button');
    els.status = document.getElementById('map-status-text');
    els.modeButtons = [...document.querySelectorAll('.mode-button')];
  }

  function bindStaticControls() {
    els.modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.mode;
        state.selectedPlaceId = null;
        closeDetail();
        els.modeButtons.forEach(b => b.classList.toggle('is-active', b === button));
        renderCategoryFilters();
        updateUI();
        if (state.mapReady) fitToVisible();
      });
    });

    els.clearFilters.addEventListener('click', () => {
      relevantCategories().forEach(key => state.activeCategories.add(key));
      renderCategoryFilters();
      updateUI();
    });

    els.timelineButton.addEventListener('click', () => {
      state.timelineEnabled = !state.timelineEnabled;
      els.timelineSlider.disabled = !state.timelineEnabled;
      els.timelineButton.classList.toggle('is-active', !state.timelineEnabled);
      els.timelineButton.textContent = state.timelineEnabled ? 'All time' : 'Use timeline';
      updateUI();
      if (state.mapReady) fitToVisible();
    });

    els.timelineSlider.addEventListener('input', () => {
      state.year = Number(els.timelineSlider.value);
      updateUI();
    });

    els.search.addEventListener('input', renderSearchResults);
    els.search.addEventListener('keydown', event => {
      if (event.key === 'Escape') clearSearch();
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.search-box') && !event.target.closest('.search-results')) {
        els.searchResults.hidden = true;
      }
    });

    els.detailClose.addEventListener('click', closeDetail);
    els.resetButton.addEventListener('click', () => fitToVisible(true));
    els.projectionButton.addEventListener('click', toggleProjection);
  }

  function syncTimelineRange() {
    els.timelineSlider.min = '1988';
    els.timelineSlider.max = String(CURRENT_YEAR);
    els.timelineSlider.value = String(CURRENT_YEAR);
    els.timelineButton.textContent = 'Use timeline';
    els.timelineYear.textContent = 'Present';
  }

  function initMap() {
    map = new maplibregl.Map({
      container: 'map',
      style: MAP_STYLE,
      center: [-15, 25],
      zoom: 1.05,
      minZoom: 0.35,
      maxZoom: 17,
      attributionControl: true,
      hash: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'imperial' }), 'bottom-right');

    map.on('load', () => {
      installLifeMapLayers();
      state.mapReady = true;
      updateMapData();
      fitToVisible(false);
      setStatus('READY / ALL-TIME VIEW');
    });

    map.on('error', event => {
      if (event?.error) console.warn('MapLibre:', event.error);
    });
  }

  function installLifeMapLayers() {
    map.addSource('life-places', {
      type: 'geojson',
      data: emptyFeatureCollection(),
      cluster: true,
      clusterMaxZoom: 10,
      clusterRadius: 38
    });

    map.addSource('selected-place', {
      type: 'geojson',
      data: emptyFeatureCollection()
    });

    map.addLayer({
      id: 'life-clusters-halo',
      type: 'circle',
      source: 'life-places',
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 12, 27],
        'circle-color': 'rgba(7,24,39,0.9)',
        'circle-stroke-width': 5,
        'circle-stroke-color': 'rgba(217,173,88,0.22)'
      }
    });

    map.addLayer({
      id: 'life-clusters',
      type: 'circle',
      source: 'life-places',
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 12, 22],
        'circle-color': '#0a2033',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#d9ad58'
      }
    });

    map.addLayer({
      id: 'life-cluster-count',
      type: 'symbol',
      source: 'life-places',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 11,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#f5dfad',
        'text-halo-color': '#071827',
        'text-halo-width': 1
      }
    });

    map.addLayer({
      id: 'life-point-halo',
      type: 'circle',
      source: 'life-places',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['case', ['==', ['get', 'category'], 'home-campus'], 12, 9],
        'circle-color': 'rgba(4,17,29,0.58)',
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.2)'
      }
    });

    map.addLayer({
      id: 'life-points',
      type: 'circle',
      source: 'life-places',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['case', ['==', ['get', 'category'], 'home-campus'], 8, 6],
        'circle-color': categoryColorExpression(),
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#eef4f6'
      }
    });

    map.addLayer({
      id: 'life-home-stars',
      type: 'symbol',
      source: 'life-places',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'category'], 'home-campus']],
      layout: {
        'text-field': '★',
        'text-size': 10,
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#fff7df'
      }
    });

    map.addLayer({
      id: 'life-place-labels',
      type: 'symbol',
      source: 'life-places',
      minzoom: 5.4,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'shortName'],
        'text-size': 11,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.45,
        'text-justify': 'auto',
        'text-optional': true
      },
      paint: {
        'text-color': '#eef4f6',
        'text-halo-color': 'rgba(4,17,29,0.96)',
        'text-halo-width': 1.6,
        'text-halo-blur': 0.4
      }
    });

    map.addLayer({
      id: 'selected-place-ring',
      type: 'circle',
      source: 'selected-place',
      paint: {
        'circle-radius': 15,
        'circle-color': 'rgba(217,173,88,0.08)',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#f0cf8b'
      }
    });

    map.on('click', 'life-clusters', onClusterClick);
    map.on('click', 'life-points', onPointClick);
    map.on('click', 'life-home-stars', onPointClick);

    ['life-clusters', 'life-points', 'life-home-stars'].forEach(layer => {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    });
  }

  function categoryColorExpression() {
    const expression = ['match', ['get', 'category']];
    Object.entries(CATEGORY_CONFIG).forEach(([key, config]) => expression.push(key, config.color));
    expression.push('#d9ad58');
    return expression;
  }

  async function onClusterClick(event) {
    const feature = event.features?.[0];
    if (!feature) return;
    const source = map.getSource('life-places');
    const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
    map.easeTo({ center: feature.geometry.coordinates, zoom: Math.min(zoom, 13), duration: 650 });
  }

  function onPointClick(event) {
    const feature = event.features?.[0];
    if (!feature) return;
    showPlace(feature.properties.placeId, { fly: false });
  }

  function relevantCategories() {
    return Object.entries(CATEGORY_CONFIG)
      .filter(([, config]) => config.modes.includes(state.mode))
      .map(([key]) => key);
  }

  function categoryKey(exp) {
    if (exp.domain === 'life') return 'life';
    if (exp.domain === 'education') return 'education';
    return CATEGORY_CONFIG[exp.category] ? exp.category : 'professional-travel';
  }

  function modeIncludes(exp) {
    if (state.mode === 'combined') return true;
    if (state.mode === 'life') return exp.domain === 'life' || exp.domain === 'education';
    return exp.domain === 'work';
  }

  function timelineIncludes(exp) {
    if (!state.timelineEnabled) return true;
    if (!exp.period?.start) return false;
    const startYear = Number(String(exp.period.start).slice(0, 4));
    return Number.isFinite(startYear) && startYear <= state.year;
  }

  function experienceVisible(exp) {
    const key = categoryKey(exp);
    return modeIncludes(exp) && state.activeCategories.has(key) && timelineIncludes(exp);
  }

  function visibleExperiencesForPlace(placeId) {
    return (state.experiencesByPlace.get(placeId) || []).filter(experienceVisible);
  }

  function visiblePlaceRecords() {
    return state.places
      .map(place => {
        const experiences = visibleExperiencesForPlace(place.id);
        if (!experiences.length) return null;
        const topExperience = [...experiences].sort(prioritySort)[0];
        return {
          place,
          experiences,
          topExperience,
          category: categoryKey(topExperience),
          priority: Math.max(...experiences.map(exp => exp.displayPriority || 0))
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority || a.place.displayName.localeCompare(b.place.displayName));
  }

  function updateUI() {
    const records = visiblePlaceRecords();
    els.visibleCount.textContent = records.length;

    if (state.timelineEnabled) {
      els.timelineYear.textContent = String(state.year);
      els.timelineNote.textContent = `Showing dated experiences through ${state.year}. Work travel without a recorded date is hidden until those dates are added.`;
    } else {
      els.timelineYear.textContent = 'Present';
      els.timelineNote.textContent = 'Turn on the timeline to build the story year by year. Undated work travel remains in the all-time view.';
    }

    renderPlaceList(records);
    if (state.mapReady) updateMapData(records);

    const modeLabel = state.mode === 'combined' ? 'COMBINED' : state.mode.toUpperCase();
    setStatus(`${modeLabel} / ${state.timelineEnabled ? `THROUGH ${state.year}` : 'ALL TIME'}`);
  }

  function updateMapData(records = visiblePlaceRecords()) {
    const source = map.getSource('life-places');
    if (!source) return;
    source.setData(recordsToGeoJSON(records));

    if (state.selectedPlaceId && !records.some(record => record.place.id === state.selectedPlaceId)) {
      closeDetail();
    } else {
      updateSelectedSource();
    }
  }

  function recordsToGeoJSON(records) {
    return {
      type: 'FeatureCollection',
      features: records.map(record => ({
        type: 'Feature',
        properties: {
          placeId: record.place.id,
          shortName: record.place.displayName || record.place.name,
          category: record.category,
          priority: record.priority,
          experienceCount: record.experiences.length,
          precision: record.place.coordinatePrecision || 'unknown'
        },
        geometry: {
          type: 'Point',
          coordinates: [record.place.coordinates.lng, record.place.coordinates.lat]
        }
      }))
    };
  }

  function renderCategoryFilters() {
    const keys = relevantCategories();
    els.filters.innerHTML = keys.map(key => {
      const config = CATEGORY_CONFIG[key];
      const active = state.activeCategories.has(key);
      return `<button type="button" class="filter-chip ${active ? 'is-active' : ''}" data-category="${escapeAttr(key)}" style="--chip-color:${config.color}" aria-pressed="${active}">
        <span class="filter-dot"></span><span>${escapeHtml(config.label)}</span>
      </button>`;
    }).join('');

    els.filters.querySelectorAll('.filter-chip').forEach(button => {
      button.addEventListener('click', () => {
        const key = button.dataset.category;
        if (state.activeCategories.has(key)) state.activeCategories.delete(key);
        else state.activeCategories.add(key);
        renderCategoryFilters();
        updateUI();
      });
    });
  }

  function renderPlaceList(records) {
    if (!records.length) {
      els.placeList.innerHTML = `<div class="empty-state">No places match this view. Turn a layer back on or return to the all-time timeline.</div>`;
      return;
    }

    els.placeList.innerHTML = records.map(record => {
      const location = placeLocation(record.place);
      const config = CATEGORY_CONFIG[record.category] || CATEGORY_CONFIG.life;
      const meta = record.experiences.length > 1 ? `${record.experiences.length} chapters` : shortPeriod(record.topExperience);
      return `<button class="place-row" type="button" data-place-id="${escapeAttr(record.place.id)}" style="--row-color:${config.color}">
        <span class="place-row-dot"></span>
        <span class="place-row-copy"><strong>${escapeHtml(record.place.displayName || record.place.name)}</strong><span>${escapeHtml(location)}</span></span>
        <span class="place-row-meta">${escapeHtml(meta)}</span>
      </button>`;
    }).join('');

    els.placeList.querySelectorAll('.place-row').forEach(button => {
      button.addEventListener('click', () => showPlace(button.dataset.placeId, { fly: true }));
    });
  }

  function renderSearchResults() {
    const query = els.search.value.trim().toLowerCase();
    if (query.length < 2) {
      els.searchResults.hidden = true;
      els.searchResults.innerHTML = '';
      return;
    }

    const results = state.places
      .map(place => {
        const experiences = state.experiencesByPlace.get(place.id) || [];
        const haystack = [place.name, place.displayName, place.city, place.region, place.country, ...experiences.map(exp => exp.label), ...experiences.map(exp => exp.organization || '')]
          .filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query) ? { place, experiences } : null;
      })
      .filter(Boolean)
      .slice(0, 8);

    els.searchResults.innerHTML = results.length
      ? results.map(({ place }) => `<button class="search-result" type="button" data-place-id="${escapeAttr(place.id)}"><strong>${escapeHtml(place.displayName || place.name)}</strong><span>${escapeHtml(placeLocation(place))}</span></button>`).join('')
      : `<div class="empty-state">No matching place found.</div>`;
    els.searchResults.hidden = false;

    els.searchResults.querySelectorAll('.search-result').forEach(button => {
      button.addEventListener('click', () => {
        const placeId = button.dataset.placeId;
        ensurePlaceVisible(placeId);
        clearSearch();
        showPlace(placeId, { fly: true });
      });
    });
  }

  function ensurePlaceVisible(placeId) {
    const experiences = state.experiencesByPlace.get(placeId) || [];
    if (!experiences.length) return;

    const exp = [...experiences].sort(prioritySort)[0];
    state.mode = exp.domain === 'work' ? 'work' : 'life';
    els.modeButtons.forEach(button => button.classList.toggle('is-active', button.dataset.mode === state.mode));
    state.activeCategories.add(categoryKey(exp));
    if (state.timelineEnabled && !timelineIncludes(exp)) {
      state.timelineEnabled = false;
      els.timelineSlider.disabled = true;
      els.timelineButton.classList.add('is-active');
      els.timelineButton.textContent = 'Use timeline';
    }
    renderCategoryFilters();
    updateUI();
  }

  function clearSearch() {
    els.search.value = '';
    els.searchResults.hidden = true;
    els.searchResults.innerHTML = '';
  }

  function showPlace(placeId, { fly = true } = {}) {
    const place = state.placeById.get(placeId);
    if (!place) return;

    state.selectedPlaceId = placeId;
    renderDetail(place);
    updateSelectedSource();

    if (fly && state.mapReady) {
      const zoom = place.coordinatePrecision === 'city' ? 8 : place.coordinatePrecision === 'installation' ? 10 : 12;
      const padding = window.innerWidth > 720
        ? { left: 410, right: 410, top: 90, bottom: 70 }
        : { left: 30, right: 30, top: 80, bottom: 280 };
      map.flyTo({
        center: [place.coordinates.lng, place.coordinates.lat],
        zoom,
        duration: 1000,
        essential: true,
        padding
      });
    }
  }

  function renderDetail(place) {
    const allExperiences = [...(state.experiencesByPlace.get(place.id) || [])].sort(prioritySort);
    const location = placeLocation(place);
    const sourceUrl = place.source?.url || place.coordinateSource?.url;

    els.detailContent.innerHTML = `
      <span class="detail-kicker">${escapeHtml(place.kind || 'mapped place')}</span>
      <h2 class="detail-title">${escapeHtml(place.displayName || place.name)}</h2>
      <p class="detail-location">${escapeHtml(location)}${place.address ? `<br>${escapeHtml(place.address)}` : ''}</p>
      <span class="detail-coordinates">${formatCoordinate(place.coordinates.lat, 'lat')} / ${formatCoordinate(place.coordinates.lng, 'lng')}</span>
      <span class="precision-badge">${escapeHtml(place.coordinatePrecision || 'unknown')} point</span>
      <div class="detail-experiences">
        ${allExperiences.map(exp => experienceCard(exp)).join('')}
      </div>
      ${sourceUrl ? `<a class="detail-source" href="${escapeAttr(sourceUrl)}" target="_blank" rel="noreferrer">Coordinate source ↗</a>` : ''}
    `;
    els.detailPanel.hidden = false;
  }

  function experienceCard(exp) {
    const key = categoryKey(exp);
    const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.life;
    const details = exp.details || {};
    const detailLines = [exp.organization, details.eventName && details.eventName !== exp.label ? details.eventName : '', details.venue, exp.periodNote].filter(Boolean);

    return `<article class="experience-card" style="--experience-color:${config.color}">
      <strong>${escapeHtml(exp.label || 'Experience')}</strong>
      ${detailLines.length ? `<p>${detailLines.map(escapeHtml).join('<br>')}</p>` : ''}
      <div class="experience-meta">
        <span class="experience-tag">${escapeHtml(config.label)}</span>
        <span class="experience-tag">${escapeHtml(periodLabel(exp))}</span>
      </div>
    </article>`;
  }

  function closeDetail() {
    state.selectedPlaceId = null;
    els.detailPanel.hidden = true;
    if (state.mapReady) updateSelectedSource();
  }

  function updateSelectedSource() {
    if (!state.mapReady) return;
    const source = map.getSource('selected-place');
    if (!source) return;

    const place = state.selectedPlaceId ? state.placeById.get(state.selectedPlaceId) : null;
    source.setData(place ? {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { placeId: place.id },
        geometry: { type: 'Point', coordinates: [place.coordinates.lng, place.coordinates.lat] }
      }]
    } : emptyFeatureCollection());
  }

  function fitToVisible(animate = true) {
    if (!state.mapReady) return;
    const records = visiblePlaceRecords();
    if (!records.length) return;

    const coords = records.map(record => [record.place.coordinates.lng, record.place.coordinates.lat]);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const lonSpan = Math.max(...lngs) - Math.min(...lngs);
    const latSpan = Math.max(...lats) - Math.min(...lats);

    const desktopPadding = window.innerWidth > 720
      ? { top: 55, right: 55, bottom: 55, left: 430 }
      : { top: 45, right: 25, bottom: Math.min(window.innerHeight * 0.47, 440), left: 25 };

    if (lonSpan > 125 || latSpan > 75) {
      map.flyTo({
        center: [6, 25],
        zoom: window.innerWidth > 720 ? 0.8 : 0.2,
        bearing: 0,
        pitch: 0,
        duration: animate ? 850 : 0,
        essential: true
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    coords.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, {
      padding: desktopPadding,
      maxZoom: records.length === 1 ? 11 : 8,
      duration: animate ? 850 : 0,
      essential: true
    });
  }

  function toggleProjection() {
    if (!state.mapReady || !map.setProjection) return;
    state.projection = state.projection === 'mercator' ? 'globe' : 'mercator';
    try {
      map.setProjection({ type: state.projection });
      const isGlobe = state.projection === 'globe';
      els.projectionButton.setAttribute('aria-pressed', String(isGlobe));
      els.projectionButton.querySelector('span:last-child').textContent = isGlobe ? 'Map' : 'Globe';
      setStatus(`${state.mode.toUpperCase()} / ${isGlobe ? 'GLOBE' : 'MAP'} PROJECTION`);
      fitToVisible(true);
    } catch (error) {
      console.warn('Projection change unavailable:', error);
      state.projection = 'mercator';
      els.projectionButton.setAttribute('aria-pressed', 'false');
      els.projectionButton.querySelector('span:last-child').textContent = 'Globe';
    }
  }

  function periodLabel(exp) {
    if (!exp.period?.start) return exp.dateStatus === 'to-be-added' ? 'Date to add' : 'Date not recorded';
    const start = humanDate(exp.period.start);
    if (!exp.period.end) return `${start} – present`;
    const end = humanDate(exp.period.end);
    return start === end ? start : `${start} – ${end}`;
  }

  function shortPeriod(exp) {
    if (!exp.period?.start) return 'undated';
    const startYear = String(exp.period.start).slice(0, 4);
    if (!exp.period.end) return `${startYear}+`;
    const endYear = String(exp.period.end).slice(0, 4);
    return startYear === endYear ? startYear : `${startYear}–${endYear}`;
  }

  function humanDate(value) {
    const raw = String(value);
    if (/^\d{4}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}$/.test(raw)) {
      const [year, month] = raw.split('-').map(Number);
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
    }
    return raw;
  }

  function placeLocation(place) {
    const bits = [place.city, place.region, place.country && place.country !== 'US' ? countryLabel(place.country) : null].filter(Boolean);
    return bits.join(', ') || place.country || 'Location recorded';
  }

  function countryLabel(code) {
    const labels = { GB: 'United Kingdom', GU: 'Guam', US: 'United States' };
    return labels[code] || code;
  }

  function formatCoordinate(value, axis) {
    const abs = Math.abs(value).toFixed(5);
    const suffix = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${abs}° ${suffix}`;
  }

  function prioritySort(a, b) {
    return (b.displayPriority || 0) - (a.displayPriority || 0) || (a.label || '').localeCompare(b.label || '');
  }

  function expSort(exps) {
    exps.sort(prioritySort);
    return exps;
  }

  function setStatus(text) {
    if (els.status) els.status.textContent = text;
  }

  function emptyFeatureCollection() {
    return { type: 'FeatureCollection', features: [] };
  }

  function assertOk(response) {
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.url}`);
    return response;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
