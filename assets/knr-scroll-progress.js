(() => {
  /**
   * Barre de progression des sliders horizontaux (How to use, Latest news).
   * Les cartes ne font pas toute la largeur et la dernière ne peut pas s'aligner à gauche :
   * la progression suit donc la fraction de défilement, pas l'index de la carte.
   *
   * @param {HTMLElement} progress - .knr-scroll-progress[data-knr-scroll-progress="<id de la liste>"]
   */
  function initProgress(progress) {
    const list = document.getElementById(progress.dataset.knrScrollProgress ?? '');
    // Le script est inclus par chaque section qui l'utilise : une barre ne doit être branchée qu'une fois.
    if (!list || progress.dataset.knrScrollReady) return;
    progress.dataset.knrScrollReady = 'true';

    const count = list.children.length;

    /** @type {number | null} */
    let frame = null;

    const update = () => {
      frame = null;
      const maxScroll = list.scrollWidth - list.clientWidth;
      const position = maxScroll > 0 ? (list.scrollLeft / maxScroll) * (count - 1) : 0;
      progress.style.setProperty('--knr-progress-index', position.toFixed(3));
    };

    const scheduleUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    list.addEventListener('scroll', scheduleUpdate, { passive: true });
    new ResizeObserver(scheduleUpdate).observe(list);
    update();
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('[data-knr-scroll-progress]').forEach(initProgress);
  }

  init();

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
