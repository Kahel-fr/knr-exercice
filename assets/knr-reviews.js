(() => {
  /**
   * Tous les avis sont rendus par Liquid : « Charger plus » et le filtre ne font que changer
   *
   * @param {HTMLElement} root - [data-knr-reviews]
   */
  function initReviews(root) {
    const list = root.querySelector('[data-knr-reviews-list]');
    if (!(list instanceof HTMLElement)) return;

    const toggle = root.querySelector('[data-knr-reviews-filter-toggle]');
    const panel = toggle && document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    const filters = root.querySelectorAll('[data-knr-reviews-filter]');
    const more = root.querySelector('[data-knr-reviews-more]');
    const empty = root.querySelector('[data-knr-reviews-empty]');
    const items = /** @type {HTMLElement[]} */ ([...list.children]);
    const pageSize = parseInt(list.dataset.pageSize ?? '', 10) || 3;

    let limit = pageSize;
    let verifiedOnly = false;

    const render = () => {
      const matching = items.filter((item) => !verifiedOnly || item.dataset.verified === 'true');
      items.forEach((item) => (item.hidden = true));
      matching.slice(0, limit).forEach((item) => (item.hidden = false));

      if (more instanceof HTMLElement) more.hidden = matching.length <= limit;
      if (empty instanceof HTMLElement) empty.hidden = matching.length > 0;
      return matching;
    };

    toggle?.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });

    filters.forEach((input) => {
      input.addEventListener('change', () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        verifiedOnly = input.value === 'verified';
        limit = pageSize;
        render();
      });
    });

    more?.addEventListener('click', () => {
      const firstNew = limit;
      limit += pageSize;
      // Le focus passe au premier avis révélé : sinon il resterait sur le bouton, qui peut disparaître.
      render()[firstNew]?.focus();
    });

    render();
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('[data-knr-reviews]').forEach((element) => {
      if (element instanceof HTMLElement) initReviews(element);
    });
  }

  init();

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
