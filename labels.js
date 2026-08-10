(() => {
  'use strict';

  const FROM = 'Mission, government & travel';
  const TO = 'Mission';
  let queued = false;

  document.addEventListener('DOMContentLoaded', () => {
    relabel();
    new MutationObserver(queueRelabel).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });

  function queueRelabel() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      relabel();
    });
  }

  function relabel() {
    const filter = document.querySelector('[data-cat="mission-site"]');
    if (filter && filter.textContent.trim() === FROM) filter.textContent = TO;

    document.querySelectorAll('.place-copy span, .detail-eyebrow').forEach(node => {
      if (node.textContent.trim() === FROM) node.textContent = TO;
    });
  }
})();
