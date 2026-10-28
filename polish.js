(() => {
  'use strict';

  // Compact map controls on mobile without adding editorial or storytelling UI.
  const MOBILE = window.matchMedia('(max-width: 900px)');
  document.addEventListener('DOMContentLoaded', () => {
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
      const active = Boolean(expanded && MOBILE.matches);
      panel.classList.toggle('is-expanded', active);
      button.setAttribute('aria-expanded', String(active));
      button.setAttribute('aria-label', active ? 'Collapse map controls' : 'Expand map controls');
    };
    button.addEventListener('click', () => setExpanded(!panel.classList.contains('is-expanded')));
    MOBILE.addEventListener?.('change', event => {
      if (!event.matches) setExpanded(false);
    });
  });
})();
