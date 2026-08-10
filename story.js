(() => {
  'use strict';

  const state = {
    story: null,
    places: [],
    experiences: [],
    placeById: new Map(),
    experienceByPlace: new Map(),
    chapterButtons: new Map()
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const [storyPayload, placesPayload, experiencesPayload] = await Promise.all([
        fetch('./data/stories.json').then(assertOk).then(response => response.json()),
        fetch('./data/places.json').then(assertOk).then(response => response.json()),
        fetch('./data/experiences.json').then(assertOk).then(response => response.json())
      ]);

      state.story = storyPayload;
      state.places = placesPayload.places || [];
      state.experiences = experiencesPayload.experiences || [];
      state.placeById = new Map(state.places.map(place => [place.id, place]));

      state.experiences.forEach(exp => {
        if (!state.experienceByPlace.has(exp.placeId)) state.experienceByPlace.set(exp.placeId, []);
        state.experienceByPlace.get(exp.placeId).push(exp);
      });

      installJourneyOverview();
      installDetailObserver();
      bindModePresentation();
      refreshPresentation();
      enrichVisibleDetail();
    } catch (error) {
      console.warn('Professional storytelling layer unavailable:', error);
    }
  }

  function installJourneyOverview() {
    const deckHeader = document.querySelector('.control-deck .deck-header');
    if (!deckHeader || document.getElementById('journey-overview')) return;

    const stats = professionalStats();
    const section = document.createElement('section');
    section.id = 'journey-overview';
    section.className = 'journey-overview';
    section.setAttribute('aria-label', 'Professional journey overview');

    section.innerHTML = `
      <div class="journey-stats" aria-label="Professional footprint summary">
        <div class="journey-stat"><strong>${stats.homeCampuses}</strong><span>home bases</span></div>
        <div class="journey-stat"><strong>${stats.missionSites}</strong><span>mission sites</span></div>
        <div class="journey-stat"><strong>${stats.geographies}</strong><span>countries / territories</span></div>
      </div>
      <div class="chapter-heading">
        <span>Career chapters</span>
        <small>Select to zoom</small>
      </div>
      <div class="career-chapter-track" role="list">
        ${(state.story.careerChapters || []).map(chapter => chapterButton(chapter)).join('')}
      </div>
    `;

    deckHeader.insertAdjacentElement('afterend', section);

    section.querySelectorAll('.career-chapter').forEach(button => {
      state.chapterButtons.set(button.dataset.chapterId, button);
      button.addEventListener('click', () => focusPlace(button.dataset.placeId, button.dataset.chapterId));
    });
  }

  function professionalStats() {
    const workExperiences = state.experiences.filter(exp => exp.domain === 'work');
    const homeCampuses = new Set(workExperiences.filter(exp => exp.category === 'home-campus').map(exp => exp.placeId)).size;
    const missionSites = new Set(workExperiences.filter(exp => exp.category === 'mission-site').map(exp => exp.placeId)).size;
    const workPlaceIds = new Set(workExperiences.map(exp => exp.placeId));
    const geographies = new Set(
      [...workPlaceIds]
        .map(id => state.placeById.get(id)?.country)
        .filter(Boolean)
    ).size;

    return { homeCampuses, missionSites, geographies };
  }

  function chapterButton(chapter) {
    return `<button class="career-chapter" type="button" role="listitem" data-chapter-id="${escapeAttr(chapter.id)}" data-place-id="${escapeAttr(chapter.placeId)}">
      <span class="career-chapter-period">${escapeHtml(chapter.period)}</span>
      <strong>${escapeHtml(chapter.title)}</strong>
      <span class="career-chapter-location">${escapeHtml(chapter.location)}</span>
    </button>`;
  }

  function bindModePresentation() {
    document.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', () => window.setTimeout(refreshPresentation, 0));
    });
  }

  function refreshPresentation() {
    const mode = activeMode();
    const overview = document.getElementById('journey-overview');
    if (overview) overview.hidden = mode === 'life';

    const panelCode = document.querySelector('.control-deck .panel-code');
    const heading = document.querySelector('.control-deck .deck-header h2');
    const search = document.getElementById('place-search');

    if (mode === 'work') {
      if (panelCode) panelCode.textContent = 'PROFESSIONAL // MAP';
      if (heading) heading.textContent = 'Professional footprint';
      if (search) search.placeholder = 'Search a campus, site, or conference';
    } else if (mode === 'life') {
      if (panelCode) panelCode.textContent = 'LIFE // MAP';
      if (heading) heading.textContent = 'Life & education';
      if (search) search.placeholder = 'Search a home, city, or university';
      clearActiveChapter();
    } else {
      if (panelCode) panelCode.textContent = 'ATLAS // MAP';
      if (heading) heading.textContent = 'Explore the journey';
      if (search) search.placeholder = 'Search a place or experience';
    }
  }

  function installDetailObserver() {
    const detailContent = document.getElementById('detail-content');
    if (!detailContent) return;

    const observer = new MutationObserver(() => enrichVisibleDetail());
    observer.observe(detailContent, { childList: true, subtree: true });
  }

  function enrichVisibleDetail() {
    const content = document.getElementById('detail-content');
    const panel = document.getElementById('detail-panel');
    const title = content?.querySelector('.detail-title');
    if (!content || !panel || panel.hidden || !title) return;

    const titleText = title.textContent.trim();
    const place = state.places.find(item => (item.displayName || item.name) === titleText);
    if (!place || content.dataset.storyPlace === place.id) return;

    content.dataset.storyPlace = place.id;
    const placeStory = state.story?.places?.[place.id];

    if (placeStory) {
      const storySection = document.createElement('section');
      storySection.className = 'place-story';
      storySection.innerHTML = `
        <span class="place-story-eyebrow">${escapeHtml(placeStory.eyebrow || 'PROFESSIONAL STORY')}</span>
        <h3>${escapeHtml(placeStory.headline || titleText)}</h3>
        <p>${escapeHtml(placeStory.summary || '')}</p>
        ${Array.isArray(placeStory.highlights) && placeStory.highlights.length ? `
          <ul>${placeStory.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ` : ''}
        ${relatedPlacesMarkup(placeStory.relatedPlaceIds)}
      `;

      const experienceContainer = content.querySelector('.detail-experiences');
      if (experienceContainer) {
        const label = document.createElement('div');
        label.className = 'detail-section-label';
        label.textContent = 'Mapped experience';
        experienceContainer.insertAdjacentElement('beforebegin', storySection);
        experienceContainer.insertAdjacentElement('beforebegin', label);
      } else {
        content.appendChild(storySection);
      }

      bindRelatedPlaceButtons(storySection);
      setActiveChapterFromStory(placeStory, place.id);
    } else {
      clearActiveChapter();
    }

    collapseLocationMetadata(content);
  }

  function relatedPlacesMarkup(ids) {
    if (!Array.isArray(ids) || !ids.length) return '';
    const links = ids
      .map(id => state.placeById.get(id))
      .filter(Boolean)
      .map(place => `<button type="button" class="related-place" data-place-id="${escapeAttr(place.id)}">${escapeHtml(place.displayName || place.name)}</button>`)
      .join('');

    return links ? `<div class="related-places"><span>Related sites</span><div>${links}</div></div>` : '';
  }

  function bindRelatedPlaceButtons(scope) {
    scope.querySelectorAll('.related-place').forEach(button => {
      button.addEventListener('click', () => focusPlace(button.dataset.placeId));
    });
  }

  function collapseLocationMetadata(content) {
    if (content.querySelector('.location-data-card')) return;

    const location = content.querySelector('.detail-location');
    const coordinates = content.querySelector('.detail-coordinates');
    const precision = content.querySelector('.precision-badge');
    const source = content.querySelector('.detail-source');
    if (!location && !coordinates && !precision && !source) return;

    const details = document.createElement('details');
    details.className = 'location-data-card';
    details.innerHTML = '<summary>Map location details</summary><div class="location-data-body"></div>';
    const body = details.querySelector('.location-data-body');

    [location, coordinates, precision, source].forEach(node => {
      if (node) body.appendChild(node);
    });

    content.appendChild(details);
  }

  function setActiveChapterFromStory(placeStory, placeId) {
    const chapters = state.story?.careerChapters || [];
    const chapter = chapters.find(item => item.placeId === placeId || item.title === placeStory.chapter);
    if (!chapter) {
      clearActiveChapter();
      return;
    }

    state.chapterButtons.forEach((button, id) => {
      button.classList.toggle('is-active', id === chapter.id);
    });
  }

  function clearActiveChapter() {
    state.chapterButtons.forEach(button => button.classList.remove('is-active'));
  }

  function focusPlace(placeId, chapterId = null) {
    if (!placeId) return;

    if (activeMode() !== 'work') {
      document.querySelector('.mode-button[data-mode="work"]')?.click();
    }

    const slider = document.getElementById('timeline-slider');
    if (slider && !slider.disabled) {
      document.getElementById('timeline-all-button')?.click();
    }

    document.getElementById('clear-filters-button')?.click();

    if (chapterId) {
      state.chapterButtons.forEach((button, id) => button.classList.toggle('is-active', id === chapterId));
    }

    let attempts = 0;
    const timer = window.setInterval(() => {
      const row = document.querySelector(`.place-row[data-place-id="${cssEscape(placeId)}"]`);
      if (row) {
        window.clearInterval(timer);
        row.click();
        return;
      }
      attempts += 1;
      if (attempts > 20) window.clearInterval(timer);
    }, 50);
  }

  function activeMode() {
    return document.querySelector('.mode-button.is-active')?.dataset.mode || 'combined';
  }

  function assertOk(response) {
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.url}`);
    return response;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
