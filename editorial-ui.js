(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('is-embedded')) return;

    const filters = document.getElementById('category-filters');
    if (filters) {
      relabelFilters(filters);
      new MutationObserver(() => relabelFilters(filters)).observe(filters, { childList: true, subtree: true });
    }

    const filtersHeading = document.getElementById('filters-heading');
    const placesHeading = document.getElementById('places-heading');
    const timelineHeading = document.getElementById('timeline-heading');
    const sortCaption = document.getElementById('sort-caption');

    if (filtersHeading) filtersHeading.textContent = 'Show on map';
    if (placesHeading) placesHeading.textContent = 'Places';
    if (timelineHeading) timelineHeading.textContent = 'Timeline';
    if (sortCaption) sortCaption.textContent = '';

    const observer = new MutationObserver(() => refineDeckHeading());
    const heading = document.querySelector('.deck-header h2');
    if (heading) observer.observe(heading, { childList: true, characterData: true, subtree: true });
    refineDeckHeading();
  });

  function relabelFilters(root) {
    const labels = {
      'Home campuses': 'Career bases',
      'NG campuses': 'Other NG campuses',
      'Mission sites': 'Mission & government',
      'Work travel': 'Other work travel',
      'Life / homes': 'Homes'
    };

    root.querySelectorAll('.filter-chip').forEach(button => {
      const text = [...button.querySelectorAll('span')].find(span => !span.classList.contains('filter-dot'));
      if (!text) return;
      const replacement = labels[text.textContent.trim()];
      if (replacement) text.textContent = replacement;
    });
  }

  function refineDeckHeading() {
    const heading = document.querySelector('.deck-header h2');
    if (!heading) return;
    const mode = document.querySelector('.mode-button.is-active')?.dataset.mode;
    if (mode === 'work') heading.textContent = 'My professional journey';
    if (mode === 'life') heading.textContent = 'My life & education';
    if (mode === 'combined') heading.textContent = 'Explore my journey';
  }
})();
