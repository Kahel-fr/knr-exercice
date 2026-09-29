(() => {
  /**
   * Mobile : un argument par écran (scroll-snap en CSS) ; on synchronise seulement les tirets.
   *
   * @param {HTMLElement} list - .knr-reassurance__list[data-knr-reassurance]
   */
  function initReassurance(list) {
    const dots = [...(list.parentElement?.querySelectorAll('.knr-reassurance__dot') ?? [])];
    if (dots.length < 2) return;

    /** @type {number | null} */
    let frame = null;

    const update = () => {
      frame = null;
      const width = list.clientWidth;
      if (!width) return;
      const active = Math.round(list.scrollLeft / width);
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === active));
    };

    const scheduleUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    // Focusable au clavier seulement quand la liste défile (mobile) : sur desktop, ce serait un arrêt de tabulation vide.
    new ResizeObserver(() => {
      if (list.scrollWidth > list.clientWidth) list.setAttribute('tabindex', '0');
      else list.removeAttribute('tabindex');
      scheduleUpdate();
    }).observe(list);

    list.addEventListener('scroll', scheduleUpdate, { passive: true });
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('[data-knr-reassurance]').forEach((element) => {
      if (element instanceof HTMLElement) initReassurance(element);
    });
  }

  init();

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
