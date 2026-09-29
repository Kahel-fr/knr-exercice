(() => {
  // En dessous de cette position, le header reste toujours visible (haut de page / hero).
  const HIDE_AFTER = 100;
  // Mouvement minimal avant de changer d'état : évite le clignotement sur les micro-défilements.
  const TOLERANCE = 8;

  let lastY = window.scrollY;
  /** @type {number | null} */
  let frame = null;

  /** @param {Element} header */
  const mustStayVisible = (header) =>
    header.querySelector('.knr-header__drawer[open]') !== null || header.contains(document.activeElement);

  const update = () => {
    frame = null;
    const y = Math.max(window.scrollY, 0);
    const delta = y - lastY;

    document.querySelectorAll('.knr-header').forEach((header) => {
      header.classList.toggle('is-scrolled', y > 0);

      if (y <= HIDE_AFTER || mustStayVisible(header)) {
        header.classList.remove('is-hidden');
      } else if (Math.abs(delta) >= TOLERANCE) {
        header.classList.toggle('is-hidden', delta > 0);
      }
    });

    // La position de référence n'avance qu'une fois la tolérance franchie : les petits mouvements s'additionnent.
    if (Math.abs(delta) >= TOLERANCE || y <= HIDE_AFTER) lastY = y;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (frame === null) frame = requestAnimationFrame(update);
    },
    { passive: true }
  );

  document.addEventListener('focusin', (event) => {
    const header = event.target instanceof Element ? event.target.closest('.knr-header') : null;
    header?.classList.remove('is-hidden');
  });

  // État initial (page rechargée au milieu du défilement) et re-rendu dans l'éditeur de thème.
  update();
  document.addEventListener('shopify:section:load', update);
})();
