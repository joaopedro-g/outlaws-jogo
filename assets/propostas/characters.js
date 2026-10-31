/* Presentation only: no provider, wallet, chain, transaction or game-state access. */
(() => {
  'use strict';
  const script = document.currentScript;
  const emblemUrl = new URL('personagens/rank-seals.svg', script.src).href;
  const selector = '.card:not([data-outlaw-visual]), .rv-card:not([data-outlaw-visual]), .fuse-pick:not([data-outlaw-visual])';
  const colors = ['#A7ADB2', '#6CC24A', '#4AA3F0', '#B06CF0', '#F5A623', '#FF4F5E'];
  const svgNS = 'http://www.w3.org/2000/svg';
  const visibility = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.dataset.visualSleep = String(!entry.isIntersecting);
  }, { rootMargin: '40px', threshold: 0 }) : null;

  function rankOf(card) {
    const fromClass = Array.from(card.classList).find((name) => /^r-[0-5]$/.test(name));
    if (fromClass) return Number(fromClass.slice(2));
    const color = card.style.getPropertyValue('--rc').trim().toUpperCase();
    return colors.indexOf(color);
  }

  function decorate(card) {
    if (card.hasAttribute('data-outlaw-visual')) return;
    card.dataset.outlawVisual = 'v1';
    card.classList.add('outlaw-visual');
    const portrait = Array.from(card.children).find((child) => child.tagName === 'IMG');
    if (portrait) {
      const stage = document.createElement('span');
      stage.className = 'portrait-stage';
      const ground = document.createElement('span');
      ground.className = 'portrait-ground';
      ground.setAttribute('aria-hidden', 'true');
      const seed = Number(card.querySelector('.c-id, .rv-id, small')?.textContent.replace(/\D/g, '')) || 0;
      stage.style.setProperty('--idle-delay', `${-(seed % 17) * .27}s`);
      portrait.classList.add('outlaw-sprite');
      portrait.before(stage);
      stage.append(ground, portrait);
    }
    const rank = rankOf(card);
    const label = card.querySelector('.c-rank, figcaption > b, :scope > b');
    if (rank >= 0 && label && !label.querySelector('.rank-emblem')) {
      const emblem = document.createElementNS(svgNS, 'svg');
      emblem.classList.add('rank-emblem');
      emblem.setAttribute('viewBox', '0 0 24 24');
      emblem.setAttribute('aria-hidden', 'true');
      emblem.setAttribute('focusable', 'false');
      const use = document.createElementNS(svgNS, 'use');
      use.setAttribute('href', `${emblemUrl}#rank-${rank}`);
      emblem.append(use);
      label.prepend(emblem);
      label.classList.add('is-stamped');
    }
    visibility?.observe(card);
  }

  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches(selector)) decorate(root);
    root.querySelectorAll(selector).forEach(decorate);
  }

  function pauseWhenHidden() {
    document.documentElement.dataset.outlawIdle = document.hidden ? 'paused' : 'running';
  }
  document.addEventListener('visibilitychange', pauseWhenHidden);
  pauseWhenHidden();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches('.outlaw-visual')) visibility?.unobserve(node);
        node.querySelectorAll('.outlaw-visual').forEach((card) => visibility?.unobserve(card));
      }
      mutation.addedNodes.forEach(scan);
    }
  });
  for (const id of ['band', 'fusion', 'fuse-list', 'reveal', 'character-proposal']) {
    const root = document.getElementById(id);
    if (!root) continue;
    scan(root);
    observer.observe(root, { childList: true, subtree: true });
  }
})();
