(() => {
  'use strict';

  const CONFIG = {
    life: { label: 'Life / homes', color: '#e8a84c', modes: ['combined', 'life'] },
    education: { label: 'Education', color: '#4ca6d8', modes: ['combined', 'life'] },
    'home-campus': { label: 'Career bases', color: '#d9a94e', modes: ['combined', 'work'] },
    'ng-campus': { label: 'Other NG campuses', color: '#5b91c8', modes: ['combined', 'work'] },
    'mission-site': { label: 'Mission, government & travel', color: '#55ae9b', modes: ['combined', 'work'] },
    conference: { label: 'Conferences', color: '#9276bd', modes: ['combined', 'work'] }
  };

  const qs = new URLSearchParams(location.search);
  const currentYear = new Date().getFullYear();
  const requestedYear = qs.has('year') ? Number(qs.get('year')) : NaN;
  const timelineRequested = truthy(qs.get('timeline')) || Number.isFinite(requestedYear);
  const initialYear = Number.isFinite(requestedYear)
    ? Math.max(1988, Math.min(currentYear, requestedYear))
    : currentYear;

  const state = {
    mode: ['work', 'life', 'combined'].includes(qs.get('mode')) ? qs.get('mode') : (qs.get('embed') === '1' ? 'work' : 'combined'),
    places: [], experiences: [], stories: { careerChapters: [], places: {} },
    placeById: new Map(), expByPlace: new Map(), active: new Set(Object.keys(CONFIG)),
    timeline: timelineRequested, year: initialYear, selected: null,
    camera: { lng: 10, lat: 25, zoom: 1 },
    dragging: null, renderQueued: false
  };

  const el = {};
  const tileNodes = new Map();
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    if (qs.get('embed') === '1') {
      document.body.classList.add('is-embedded');
      document.title = 'Professional Journey Map | Alex Ford';
    }

    cache();
    bind();
    syncTimelineControls();
    setMode(state.mode, false);

    try {
      const [p, e, s] = await Promise.all([
        fetch('./data/places.json', { cache: 'force-cache' }).then(ok).then(r => r.json()),
        fetch('./data/experiences.json', { cache: 'force-cache' }).then(ok).then(r => r.json()),
        fetch('./data/stories.json', { cache: 'force-cache' }).then(ok).then(r => r.json())
      ]);

      state.places = p.places || [];
      state.experiences = e.experiences || [];
      state.stories = s || { careerChapters: [], places: {} };
      state.placeById = new Map(state.places.map(x => [x.id, x]));
      state.experiences.forEach(x => {
        if (!state.expByPlace.has(x.placeId)) state.expByPlace.set(x.placeId, []);
        state.expByPlace.get(x.placeId).push(x);
      });

      renderChapters();
      renderFilters();
      updateAll();

      requestAnimationFrame(() => {
        fitVisible();
        renderMap();
        const deep = qs.get('place');
        if (deep && state.placeById.has(deep)) showPlace(deep, true);
      });

      document.documentElement.dataset.ready = '1';
      installParentBridge();
    } catch (err) {
      console.error(err);
      el.list.innerHTML = '<div class="empty">The map data could not be loaded. The page itself is running, but the local data request failed.</div>';
      installParentBridge();
    }
  }

  function cache() {
    ['map','tiles','markers','modeSwitch','count','panelTitle','chapters','journey','search','searchResults','filters','showAll','timelineToggle','timeline','timelineYear','timelineNote','list','detail','detailBody','zoomIn','zoomOut','reset'].forEach(id => el[id] = document.getElementById(id));
  }

  function bind() {
    el.modeSwitch.addEventListener('click', ev => {
      const b = ev.target.closest('[data-mode]');
      if (b) setMode(b.dataset.mode, true);
    });

    el.zoomIn.addEventListener('click', () => zoomBy(1));
    el.zoomOut.addEventListener('click', () => zoomBy(-1));
    el.reset.addEventListener('click', fitVisible);

    el.showAll.addEventListener('click', () => {
      relevantCats().forEach(key => state.active.add(key));
      renderFilters();
      updateAll();
    });

    el.timelineToggle.addEventListener('click', () => {
      state.timeline = !state.timeline;
      syncTimelineControls();
      updateAll();
      updateUrl();
      fitVisible();
    });

    el.timeline.addEventListener('input', () => {
      state.year = Number(el.timeline.value);
      syncTimelineControls();
      updateAll();
      updateUrl();
    });

    el.search.addEventListener('input', renderSearch);
    el.search.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        el.search.value = '';
        el.searchResults.hidden = true;
      }
    });

    document.addEventListener('click', ev => {
      if (!ev.target.closest('.search-wrap')) el.searchResults.hidden = true;
    });

    el.detail.addEventListener('click', ev => {
      if (ev.target.closest('[data-close-detail]')) {
        closeDetail();
        return;
      }
      const related = ev.target.closest('[data-related-place]');
      if (related) showPlace(related.dataset.relatedPlace, true, Math.max(7, state.camera.zoom));
    });

    el.map.addEventListener('pointerdown', startDrag);
    el.map.addEventListener('pointermove', drag);
    el.map.addEventListener('pointerup', endDrag);
    el.map.addEventListener('pointercancel', endDrag);
    el.map.addEventListener('dblclick', ev => {
      ev.preventDefault();
      zoomAt(ev.clientX, ev.clientY, 1);
    });
    el.map.addEventListener('wheel', ev => {
      ev.preventDefault();
      zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('resize', () => {
      queueRender();
      publishResize();
    }, { passive: true });
  }

  function syncTimelineControls() {
    el.timeline.min = '1988';
    el.timeline.max = String(currentYear);
    el.timeline.value = String(state.year);
    el.timeline.disabled = !state.timeline;
    el.timelineToggle.textContent = state.timeline ? 'All time' : 'Use timeline';
    el.timelineToggle.setAttribute('aria-pressed', String(state.timeline));
    el.timelineYear.textContent = state.timeline ? String(state.year) : 'Present';
    el.timelineNote.textContent = state.timeline
      ? `Showing dated experiences through ${state.year}. Undated professional locations remain available in All time.`
      : 'Turn on the timeline to build the journey year by year.';
  }

  function setMode(mode, refit) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(b => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    if (el.panelTitle) el.panelTitle.textContent = mode === 'work' ? 'Professional footprint' : mode === 'life' ? 'Life & education' : 'Explore the journey';
    if (el.journey) el.journey.hidden = mode === 'life';
    updateUrl();
    if (state.places.length) {
      renderFilters();
      updateAll();
      if (refit) fitVisible();
    }
  }

  function category(exp) {
    if (exp.domain === 'life') return 'life';
    if (exp.domain === 'education') return 'education';
    return CONFIG[exp.category] ? exp.category : 'mission-site';
  }

  function modeOk(exp) {
    return state.mode === 'combined' || (state.mode === 'life' ? ['life','education'].includes(exp.domain) : exp.domain === 'work');
  }

  function timeOk(exp) {
    if (!state.timeline) return true;
    if (!exp.period?.start) return false;
    const y = Number(String(exp.period.start).slice(0, 4));
    return Number.isFinite(y) && y <= state.year;
  }

  function visibleExps(placeId) {
    return (state.expByPlace.get(placeId) || []).filter(x => modeOk(x) && state.active.has(category(x)) && timeOk(x));
  }

  function records() {
    return state.places.map(place => {
      const exps = visibleExps(place.id);
      if (!exps.length) return null;
      const sorted = [...exps].sort((a,b) => (b.displayPriority || 0) - (a.displayPriority || 0));
      return {
        place,
        exps,
        top: sorted[0],
        cat: category(sorted[0]),
        priority: Math.max(...exps.map(x => x.displayPriority || 0))
      };
    }).filter(Boolean).sort((a,b) => b.priority - a.priority || a.place.displayName.localeCompare(b.place.displayName));
  }

  function renderChapters() {
    const chapters = state.stories.careerChapters || [];
    el.chapters.innerHTML = chapters.map(c => `<button class="chapter" data-chapter="${esc(c.id)}" data-place="${esc(c.placeId)}" type="button"><span>${esc(c.period)}</span><strong>${esc(c.title)}</strong><em>${esc(c.location)}</em></button>`).join('');
    el.chapters.addEventListener('click', ev => {
      const b = ev.target.closest('[data-place]');
      if (!b) return;
      setMode('work', false);
      showPlace(b.dataset.place, true, 7);
    });
  }

  function syncActiveChapter(placeId) {
    document.querySelectorAll('.chapter').forEach(x => {
      const active = x.dataset.place === placeId;
      x.classList.toggle('active', active);
      if (active) x.setAttribute('aria-current', 'true');
      else x.removeAttribute('aria-current');
    });
  }

  function relevantCats() {
    return Object.entries(CONFIG).filter(([,c]) => c.modes.includes(state.mode)).map(([k]) => k);
  }

  function renderFilters() {
    const cats = relevantCats();
    el.filters.innerHTML = cats.map(k => `<button class="filter ${state.active.has(k) ? 'on' : 'off'}" style="--dot:${CONFIG[k].color}" data-cat="${k}" type="button" aria-pressed="${state.active.has(k)}">${CONFIG[k].label}</button>`).join('');
    el.filters.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.cat;
      state.active.has(k) ? state.active.delete(k) : state.active.add(k);
      renderFilters();
      updateAll();
    }));
  }

  function updateAll() {
    const recs = records();
    el.count.textContent = recs.length;
    syncTimelineControls();
    renderList(recs);
    renderMarkers(recs);
  }

  function renderList(recs) {
    if (!recs.length) {
      el.list.innerHTML = '<div class="empty">No places match these filters.</div>';
      return;
    }

    el.list.innerHTML = recs.map(r => {
      const career = r.cat === 'home-campus';
      return `<button class="place-row ${career ? 'career' : ''}" data-place="${esc(r.place.id)}" type="button"><span class="place-dot" style="--dot:${CONFIG[r.cat]?.color || '#d9a94e'}"></span><span class="place-copy"><strong>${esc(r.place.displayName || r.place.name)}</strong><span>${esc(CONFIG[r.cat]?.label || 'Professional location')}</span></span><b aria-hidden="true">›</b></button>`;
    }).join('');

    el.list.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => showPlace(b.dataset.place, true)));
  }

  function renderSearch() {
    const q = el.search.value.trim().toLowerCase();
    if (!q) {
      el.searchResults.hidden = true;
      return;
    }

    const hits = records().filter(r => {
      const text = [r.place.displayName, r.place.name, r.place.city, ...r.exps.map(x => x.label), ...r.exps.map(x => x.organization)].filter(Boolean).join(' ').toLowerCase();
      return text.includes(q);
    }).slice(0, 8);

    el.searchResults.innerHTML = hits.length
      ? hits.map(r => `<button class="search-result" data-place="${esc(r.place.id)}" type="button"><strong>${esc(r.place.displayName || r.place.name)}</strong><span>${esc(r.exps[0]?.label || '')}</span></button>`).join('')
      : '<div class="empty">No matches.</div>';
    el.searchResults.hidden = false;
    el.searchResults.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => {
      showPlace(b.dataset.place, true);
      el.searchResults.hidden = true;
    }));
  }

  function showPlace(id, focus = false, zoom = 8) {
    const place = state.placeById.get(id);
    if (!place) return;

    state.selected = id;
    syncActiveChapter(id);
    updateUrl();

    if (focus) {
      state.camera.lng = place.coordinates.lng;
      state.camera.lat = place.coordinates.lat;
      state.camera.zoom = Math.max(state.camera.zoom, zoom);
      queueRender();
    }

    const exps = (state.expByPlace.get(id) || []).filter(modeOk).sort((a,b) => (b.displayPriority || 0) - (a.displayPriority || 0));
    const story = state.stories.places?.[id];
    const related = (story?.relatedPlaceIds || []).map(placeId => state.placeById.get(placeId)).filter(Boolean);

    el.detailBody.innerHTML = `<div class="detail">
      <div class="detail-eyebrow">${esc(story?.eyebrow || CONFIG[category(exps[0] || {})]?.label || 'Mapped place')}</div>
      <h2>${esc(place.displayName || place.name)}</h2>
      <div class="detail-location">${esc(prettyLocation(place))}</div>
      ${story ? `<section class="story-card"><h3>${esc(story.headline || '')}</h3><p>${esc(story.summary || '')}</p>${story.highlights?.length ? `<ul>${story.highlights.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</section>` : ''}
      ${related.length ? `<div class="related-sites"><span>Related places</span><div>${related.map(x => `<button type="button" data-related-place="${esc(x.id)}">${esc(x.displayName || x.name)}</button>`).join('')}</div></div>` : ''}
      <div>${exps.map(x => `<div class="experience"><strong>${esc(x.label || x.organization || 'Experience')}</strong><span>${esc(formatPeriod(x))}${x.organization ? ` · ${esc(x.organization)}` : ''}</span></div>`).join('')}</div>
      <details class="map-meta"><summary>Map location details</summary><div>${place.coordinates.lat.toFixed(5)}, ${place.coordinates.lng.toFixed(5)} · ${esc(place.coordinatePrecision || 'mapped')}${place.address ? `<br>${esc(place.address)}` : ''}${place.source?.url ? `<br><a href="${attr(place.source.url)}" target="_blank" rel="noopener">Coordinate source</a>` : ''}</div></details>
    </div>`;

    el.detail.hidden = false;
    renderMarkers(records());
    publishResize();
  }

  function closeDetail() {
    state.selected = null;
    syncActiveChapter(null);
    el.detail.hidden = true;
    updateUrl();
    renderMarkers(records());
    publishResize();
  }

  function prettyLocation(place) {
    const country = place.country === 'GB' ? 'United Kingdom' : place.country === 'US' ? '' : place.country;
    const local = [place.city, place.region].filter(Boolean).join(', ');
    return [local, country].filter(Boolean).join(' · ');
  }

  function formatPeriod(exp) {
    const period = exp?.period;
    if (!period?.start) return 'Date not recorded';

    const start = String(period.start);
    const end = period.end ? String(period.end) : null;
    const startYear = start.slice(0, 4);
    const endYear = end?.slice(0, 4);

    if (period.precision === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      const startDate = new Date(`${start}T00:00:00Z`);
      const endDate = end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? new Date(`${end}T00:00:00Z`) : null;
      const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      if (endDate && startDate.getUTCFullYear() === endDate.getUTCFullYear() && startDate.getUTCMonth() === endDate.getUTCMonth()) {
        return `${monthDay.format(startDate)}–${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;
      }
    }

    if (!end) return `${startYear}–present`;
    if (startYear === endYear) return startYear;
    return `${startYear}–${endYear}`;
  }

  function project(lng, lat, z = state.camera.zoom) {
    const size = 256 * Math.pow(2, z);
    const x = (lng + 180) / 360 * size;
    const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const sin = Math.sin(clamped * Math.PI / 180);
    const y = (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
    return { x, y, size };
  }

  function unproject(x, y, z = state.camera.zoom) {
    const size = 256 * Math.pow(2, z);
    const lng = x / size * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / size;
    const lat = 180 / Math.PI * Math.atan(.5 * (Math.exp(n) - Math.exp(-n)));
    return { lng: wrapLng(lng), lat: Math.max(-85, Math.min(85, lat)) };
  }

  function wrapLng(lng) {
    return ((lng + 180) % 360 + 360) % 360 - 180;
  }

  function renderMap() {
    renderTiles();
    renderMarkers(records());
  }

  function queueRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      renderMap();
    });
  }

  function renderTiles() {
    const rect = el.map.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const z = Math.round(state.camera.zoom);
    const center = project(state.camera.lng, state.camera.lat, z);
    const ts = 256;
    const n = Math.pow(2, z);
    const minX = Math.floor((center.x - rect.width / 2) / ts) - 1;
    const maxX = Math.floor((center.x + rect.width / 2) / ts) + 1;
    const minY = Math.max(0, Math.floor((center.y - rect.height / 2) / ts) - 1);
    const maxY = Math.min(n - 1, Math.floor((center.y + rect.height / 2) / ts) + 1);
    const needed = new Set();

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const wx = ((tx % n) + n) % n;
        const key = `${z}/${tx}/${ty}`;
        needed.add(key);
        let img = tileNodes.get(key);

        if (!img) {
          img = document.createElement('img');
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          img.fetchPriority = 'low';
          img.src = `https://a.basemaps.cartocdn.com/dark_all/${z}/${wx}/${ty}.png`;
          img.onerror = () => {
            tileNodes.delete(key);
            img.remove();
          };
          tileNodes.set(key, img);
          el.tiles.appendChild(img);
        }

        img.style.left = `${tx * ts - center.x + rect.width / 2}px`;
        img.style.top = `${ty * ts - center.y + rect.height / 2}px`;
      }
    }

    for (const [key, img] of tileNodes) {
      if (!needed.has(key)) {
        img.remove();
        tileNodes.delete(key);
      }
    }
  }

  function screenPos(place) {
    const rect = el.map.getBoundingClientRect();
    const c = project(state.camera.lng, state.camera.lat);
    const p = project(place.coordinates.lng, place.coordinates.lat);
    let dx = p.x - c.x;
    const world = p.size;
    if (dx > world / 2) dx -= world;
    if (dx < -world / 2) dx += world;
    return { x: rect.width / 2 + dx, y: rect.height / 2 + (p.y - c.y) };
  }

  function renderMarkers(recs) {
    if (!state.places.length) return;
    const rect = el.map.getBoundingClientRect();
    if (!rect.width) return;

    const raw = recs.map(r => ({ ...r, pos: screenPos(r.place) })).filter(r => r.pos.x > -50 && r.pos.x < rect.width + 50 && r.pos.y > -50 && r.pos.y < rect.height + 50);
    const groups = [];
    const threshold = state.camera.zoom < 4 ? 32 : state.camera.zoom < 7 ? 22 : 12;

    for (const r of raw) {
      const g = groups.find(group => Math.hypot(group.x - r.pos.x, group.y - r.pos.y) < threshold);
      if (g) {
        g.items.push(r);
        g.x = (g.x * (g.items.length - 1) + r.pos.x) / g.items.length;
        g.y = (g.y * (g.items.length - 1) + r.pos.y) / g.items.length;
      } else {
        groups.push({ x: r.pos.x, y: r.pos.y, items: [r] });
      }
    }

    const frag = document.createDocumentFragment();
    groups.forEach(g => {
      if (g.items.length > 1) {
        const b = document.createElement('button');
        b.className = 'cluster';
        b.type = 'button';
        b.textContent = g.items.length;
        b.style.left = `${g.x}px`;
        b.style.top = `${g.y}px`;
        b.title = g.items.map(x => x.place.displayName).join(', ');
        b.setAttribute('aria-label', `${g.items.length} nearby places: ${b.title}`);
        b.addEventListener('pointerdown', ev => ev.stopPropagation());
        b.addEventListener('click', () => {
          const center = clusterCenter(g.items.map(x => x.place.coordinates));
          state.camera.lng = center.lng;
          state.camera.lat = center.lat;
          state.camera.zoom = Math.min(13, state.camera.zoom + 2);
          queueRender();
        });
        frag.appendChild(b);
      } else {
        const r = g.items[0];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `marker ${r.cat === 'home-campus' ? 'career' : ''} ${state.selected === r.place.id ? 'selected' : ''}`;
        b.style.left = `${g.x}px`;
        b.style.top = `${g.y}px`;
        b.style.setProperty('--marker', CONFIG[r.cat]?.color || '#d9a94e');
        b.title = r.place.displayName || r.place.name;
        b.setAttribute('aria-label', b.title);
        b.addEventListener('pointerdown', ev => ev.stopPropagation());
        b.addEventListener('click', () => showPlace(r.place.id, true, Math.max(6, state.camera.zoom)));
        frag.appendChild(b);

        if (state.camera.zoom >= 6) {
          const label = document.createElement('div');
          label.className = 'map-label';
          label.style.left = `${g.x}px`;
          label.style.top = `${g.y}px`;
          label.textContent = r.place.name;
          frag.appendChild(label);
        }
      }
    });

    el.markers.replaceChildren(frag);
  }

  function clusterCenter(coords) {
    const ref = coords[0]?.lng || 0;
    const adjusted = coords.map(c => {
      let lng = c.lng;
      while (lng - ref > 180) lng -= 360;
      while (lng - ref < -180) lng += 360;
      return { lng, lat: c.lat };
    });
    const lng = adjusted.reduce((sum, c) => sum + c.lng, 0) / adjusted.length;
    const lat = adjusted.reduce((sum, c) => sum + c.lat, 0) / adjusted.length;
    return { lng: wrapLng(lng), lat };
  }

  function fitVisible() {
    const recs = records();
    if (!recs.length) return;

    const rect = el.map.getBoundingClientRect();
    const w = Math.max(250, rect.width);
    const h = Math.max(250, rect.height);
    const mobile = w <= 900;
    const fitHeight = mobile ? h * 0.40 : h;
    const lons = recs.map(r => r.place.coordinates.lng);
    const ys = recs.map(r => project(0, r.place.coordinates.lat, 0).y);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const spanLon = Math.max(2, maxLon - minLon);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanY = Math.max(2, maxY - minY);

    let z = 0;
    for (let tryZ = 0; tryZ <= 10; tryZ++) {
      const size = 256 * Math.pow(2, tryZ);
      const pxX = spanLon / 360 * size;
      const pxY = spanY * Math.pow(2, tryZ);
      const widthLimit = mobile ? w * 0.90 : w * 0.72;
      const heightLimit = mobile ? fitHeight * 0.82 : h * 0.62;
      if (pxX < widthLimit && pxY < heightLimit) z = tryZ;
      else break;
    }

    state.camera.zoom = Math.max(0, Math.min(10, z));
    const world = 256 * Math.pow(2, state.camera.zoom);
    const horizontalOffset = mobile ? 0 : Math.min(175, w * 0.16);
    state.camera.lng = wrapLng((minLon + maxLon) / 2 - horizontalOffset / world * 360);

    const baseCenterY = (minY + maxY) / 2 * Math.pow(2, state.camera.zoom);
    const verticalOffset = mobile ? h * 0.27 : 0;
    state.camera.lat = unproject(0, baseCenterY + verticalOffset, state.camera.zoom).lat;
    queueRender();
  }

  function zoomBy(d) {
    state.camera.zoom = Math.max(0, Math.min(13, state.camera.zoom + d));
    queueRender();
  }

  function zoomAt(clientX, clientY, d) {
    const rect = el.map.getBoundingClientRect();
    const before = screenToLngLat(clientX - rect.left, clientY - rect.top);
    const newZ = Math.max(0, Math.min(13, state.camera.zoom + d));
    if (newZ === state.camera.zoom) return;
    state.camera.zoom = newZ;
    const after = screenToLngLat(clientX - rect.left, clientY - rect.top);
    state.camera.lng = wrapLng(state.camera.lng + (before.lng - after.lng));
    state.camera.lat = Math.max(-85, Math.min(85, state.camera.lat + (before.lat - after.lat)));
    queueRender();
  }

  function screenToLngLat(x, y) {
    const rect = el.map.getBoundingClientRect();
    const c = project(state.camera.lng, state.camera.lat);
    return unproject(c.x + (x - rect.width / 2), c.y + (y - rect.height / 2));
  }

  function startDrag(ev) {
    if (ev.target.closest('button')) return;
    const c = project(state.camera.lng, state.camera.lat);
    state.dragging = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, cx: c.x, cy: c.y };
    el.map.setPointerCapture?.(ev.pointerId);
    el.map.classList.add('is-dragging');
  }

  function drag(ev) {
    const d = state.dragging;
    if (!d || d.id !== ev.pointerId) return;
    const dx = ev.clientX - d.x;
    const dy = ev.clientY - d.y;
    const p = unproject(d.cx - dx, d.cy - dy);
    state.camera.lng = p.lng;
    state.camera.lat = p.lat;
    queueRender();
  }

  function endDrag(ev) {
    if (!state.dragging || state.dragging.id !== ev.pointerId) return;
    state.dragging = null;
    el.map.classList.remove('is-dragging');
  }

  function updateUrl() {
    const u = new URL(location.href);
    u.searchParams.set('mode', state.mode);
    if (state.selected) u.searchParams.set('place', state.selected);
    else u.searchParams.delete('place');

    if (state.timeline) {
      u.searchParams.set('timeline', '1');
      u.searchParams.set('year', String(state.year));
    } else {
      u.searchParams.delete('timeline');
      u.searchParams.delete('year');
    }

    history.replaceState(null, '', `${u.pathname}${u.search}${u.hash}`);
  }

  function installParentBridge() {
    if (qs.get('embed') !== '1' || window.parent === window) return;
    window.parent.postMessage({ type: 'alexford-life-map:ready', mode: state.mode }, '*');
    publishResize();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => publishResize());
      observer.observe(document.documentElement);
    }
  }

  function publishResize() {
    if (qs.get('embed') !== '1' || window.parent === window) return;
    window.parent.postMessage({
      type: 'alexford-life-map:resize',
      height: Math.ceil(document.documentElement.getBoundingClientRect().height),
      mode: state.mode
    }, '*');
  }

  function truthy(value) {
    return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
  }

  function ok(r) {
    if (!r.ok) throw new Error(`${r.status} ${r.url}`);
    return r;
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function attr(v) {
    return esc(v);
  }
})();