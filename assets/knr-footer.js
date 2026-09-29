(() => {
  const desktop = window.matchMedia('(min-width: 750px)');

  /**
   * Menus en accordéon sur mobile, toujours ouverts sur desktop : l'état `open` doit suivre
   * pour que les lecteurs d'écran n'annoncent pas « replié » un menu affiché.
   *
   * @param {HTMLDetailsElement} details - details[data-knr-footer-accordion]
   */
  function initAccordion(details) {
    const summary = details.querySelector('summary');
    if (!summary) return;

    const sync = () => {
      details.open = desktop.matches;
      if (desktop.matches) summary.setAttribute('tabindex', '-1');
      else summary.removeAttribute('tabindex');
    };

    summary.addEventListener('click', (event) => {
      if (desktop.matches) event.preventDefault();
    });

    desktop.addEventListener('change', sync);
    sync();
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('details[data-knr-footer-accordion]').forEach((details) => {
      if (details instanceof HTMLDetailsElement) initAccordion(details);
    });

    root.querySelectorAll('select[data-knr-autosubmit]').forEach((select) => {
      select.addEventListener('change', () => {
        if (select instanceof HTMLSelectElement) select.form?.requestSubmit();
      });
    });
  }

  init();

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
