(() => {
  /**
   * Calculé côté navigateur : 'now' en Liquid est figé au rendu, et la page peut être servie depuis le cache.
   *
   * @param {HTMLElement} element - <p data-knr-delivery> avec data-days, data-business-days, data-locale
   */
  function renderDeliveryDate(element) {
    const target = element.querySelector('[data-knr-delivery-date]');
    const days = parseInt(element.dataset.days ?? '', 10);
    if (!target || !Number.isFinite(days) || days < 0) return;

    const businessDaysOnly = element.dataset.businessDays === 'true';
    const date = new Date();

    let remaining = days;
    while (remaining > 0) {
      date.setDate(date.getDate() + 1);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (!businessDaysOnly || !isWeekend) remaining -= 1;
    }

    const formatted = new Intl.DateTimeFormat(element.dataset.locale || document.documentElement.lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);

    target.textContent = `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}.`;
  }

  /**
   * Le défilement et l'aimantation sont en CSS (scroll-snap) ; ici on ne fait que synchroniser
   * la progression et les flèches avec la position de défilement.
   *
   * @param {HTMLElement} gallery - .knr-product__media[data-knr-gallery]
   */
  function initGallery(gallery) {
    const product = gallery.closest('.knr-product');
    const progress = product?.querySelector('.knr-product__progress');
    const arrows = product ? [...product.querySelectorAll('[data-knr-gallery-nav]')] : [];
    const count = gallery.children.length;
    if (count < 2) return;

    /** @type {number | null} */
    let frame = null;

    const update = () => {
      frame = null;
      const width = gallery.clientWidth;
      if (!width) return;

      const position = gallery.scrollLeft / width;
      if (progress instanceof HTMLElement) progress.style.setProperty('--knr-progress-index', position.toFixed(3));

      const active = Math.round(position);
      arrows.forEach((arrow) => {
        const direction = Number(arrow.getAttribute('data-knr-gallery-nav'));
        const atEnd = direction < 0 ? active <= 0 : active >= count - 1;
        arrow.toggleAttribute('hidden', atEnd);
      });
    };

    arrows.forEach((arrow) => {
      arrow.addEventListener('click', () => {
        const direction = Number(arrow.getAttribute('data-knr-gallery-nav'));
        smoothScrollBy(gallery, direction * gallery.clientWidth);
      });
    });

    gallery.addEventListener(
      'scroll',
      () => {
        if (frame === null) frame = requestAnimationFrame(update);
      },
      { passive: true }
    );

    // État initial (le navigateur peut restaurer une position de défilement au retour arrière).
    update();
  }

  /**
   * Messages de livraison : un message par écran (scroll-snap en CSS), tirets synchronisés sur le défilement.
   * L'avance automatique reprend à zéro après chaque défilement, manuel compris, et s'arrête
   * tant que le carrousel est survolé ou a le focus.
   *
   * @param {HTMLElement} list - .knr-product__delivery-list[data-knr-delivery-list]
   */
  function initDeliveryCarousel(list) {
    const dots = [...(list.parentElement?.querySelectorAll('[data-knr-delivery-dot]') ?? [])];
    const count = list.children.length;
    if (count < 2) return;

    const delay = parseInt(list.dataset.autoplay ?? '', 10) * 1000;
    const autoplay = delay > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** @type {number | null} */
    let frame = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    let hovered = false;
    let focused = false;
    let editorSelected = false;

    const activeIndex = () => (list.clientWidth ? Math.round(list.scrollLeft / list.clientWidth) : 0);

    /** @param {number} index */
    const goTo = (index) => {
      list.scrollTo({ left: index * list.clientWidth, behavior: autoplay ? 'smooth' : 'auto' });
    };

    const schedule = () => {
      clearTimeout(timer);
      if (!autoplay || hovered || focused || editorSelected) return;
      timer = setTimeout(() => goTo((activeIndex() + 1) % count), delay);
    };

    const update = () => {
      frame = null;
      const active = activeIndex();
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === active));
      schedule();
    };

    list.addEventListener(
      'scroll',
      () => {
        clearTimeout(timer);
        if (frame === null) frame = requestAnimationFrame(update);
      },
      { passive: true }
    );

    list.addEventListener('pointerenter', () => {
      hovered = true;
      schedule();
    });
    list.addEventListener('pointerleave', () => {
      hovered = false;
      schedule();
    });
    list.addEventListener('focusin', () => {
      focused = true;
      schedule();
    });
    list.addEventListener('focusout', () => {
      focused = false;
      schedule();
    });

    // Éditeur de thème : afficher la ligne sélectionnée dans la barre latérale.
    list.addEventListener('shopify:block:select', (event) => {
      editorSelected = true;
      const index = [...list.children].indexOf(/** @type {Element} */ (event.target));
      if (index >= 0) goTo(index);
    });
    list.addEventListener('shopify:block:deselect', () => {
      editorSelected = false;
      schedule();
    });

    update();
  }

  /**
   * Slider « Complétez votre rituel » : chaque flèche fait défiler d'une carte et n'est affichée
   * que s'il reste des produits dans sa direction (les deux sont masquées si tout tient à l'écran).
   *
   * @param {HTMLElement} list - .knr-product__related-list[data-knr-related-list]
   */
  function initRelated(list) {
    const container = list.closest('[data-knr-related]');
    const arrows = container ? [...container.querySelectorAll('[data-knr-related-nav]')] : [];
    if (arrows.length === 0) return;

    /** @type {number | null} */
    let frame = null;

    const update = () => {
      frame = null;
      const maxScroll = list.scrollWidth - list.clientWidth;
      arrows.forEach((arrow) => {
        const direction = Number(arrow.getAttribute('data-knr-related-nav'));
        // Tolérance de 1px : scrollLeft peut être fractionnaire (zoom, écrans haute densité).
        const hasMore = direction < 0 ? list.scrollLeft > 1 : list.scrollLeft < maxScroll - 1;
        arrow.toggleAttribute('hidden', !hasMore);
      });
    };

    const scheduleUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    arrows.forEach((arrow) => {
      arrow.addEventListener('click', () => {
        const direction = Number(arrow.getAttribute('data-knr-related-nav'));
        const card = list.firstElementChild;
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        const step = card ? card.getBoundingClientRect().width + gap : list.clientWidth;
        smoothScrollBy(list, direction * step);
      });
    });

    list.addEventListener('scroll', scheduleUpdate, { passive: true });
    // Le nombre de cartes visibles change avec la largeur de l'écran.
    new ResizeObserver(scheduleUpdate).observe(list);
    update();
  }

  /**
   * Sélecteur de taille : les boutons radio du panneau et ceux de la barre sticky pilotent la même variante.
   * Les radios restent la source de vérité ; la barre sticky ne fait que les cocher.
   *
   * @param {HTMLScriptElement} json - <script type="application/json" data-knr-variants>
   */
  function initVariants(json) {
    const product = json.closest('.knr-product');
    const idInput = product?.querySelector('.knr-product__form input[name="id"]');
    if (!product || !(idInput instanceof HTMLInputElement)) return;

    /** @type {{ id: number, options: string[], available: boolean, price: string, compare_at_price: string | null, unit_price: string | null }[]} */
    const variants = JSON.parse(json.textContent || '[]');
    const fieldsets = [...product.querySelectorAll('[data-knr-option]')];
    const stickyOptions = [...product.querySelectorAll('[data-knr-sticky-option]')];
    const { addLabel = '', soldOutLabel = '' } = json.dataset;

    const selectedOptions = () =>
      fieldsets.map((fieldset) => {
        const checked = fieldset.querySelector('input:checked');
        return checked instanceof HTMLInputElement ? checked.value : '';
      });

    /**
     * @param {string} selector
     * @param {string | null} value
     */
    const setText = (selector, value) => {
      product.querySelectorAll(selector).forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        element.hidden = value === null;
        if (value !== null) element.textContent = value;
      });
    };

    const update = () => {
      const options = selectedOptions();
      const variant = variants.find((candidate) => candidate.options.every((value, index) => value === options[index]));

      stickyOptions.forEach((button) => {
        const position = Number(button.getAttribute('data-knr-sticky-option'));
        button.setAttribute('aria-pressed', String(options[position - 1] === button.getAttribute('value')));
      });

      product.querySelectorAll('[data-knr-add]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        button.disabled = !variant?.available;
        button.textContent = variant?.available ? addLabel : soldOutLabel;
      });

      if (!variant) return;

      idInput.value = String(variant.id);
      setText('[data-knr-price-current]', variant.price);
      setText('[data-knr-price-compare]', variant.compare_at_price);
      if (variant.unit_price) setText('[data-knr-price-unit]', variant.unit_price);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', String(variant.id));
      window.history.replaceState(window.history.state, '', url);
    };

    fieldsets.forEach((fieldset) => fieldset.addEventListener('change', update));

    stickyOptions.forEach((button) => {
      button.addEventListener('click', () => {
        const position = button.getAttribute('data-knr-sticky-option');
        const radio = [...product.querySelectorAll(`[data-knr-option="${position}"] input`)].find(
          (input) => input instanceof HTMLInputElement && input.value === button.getAttribute('value')
        );
        if (!(radio instanceof HTMLInputElement)) return;
        radio.checked = true;
        update();
      });
    });
  }

  /**
   * Barre sticky affichée une fois le bouton principal sorti par le haut de l'écran
   * (pas quand il est encore plus bas, au chargement sur un petit écran).
   *
   * @param {HTMLElement} sticky - .knr-product__sticky[data-knr-sticky]
   */
  function initSticky(sticky) {
    const trigger = sticky.closest('.knr-product')?.querySelector('.knr-product__form');
    if (!trigger) return;

    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        sticky.classList.toggle('is-visible', scrolledPast);
      });
    }).observe(trigger);
  }

  /**
   * « + » des produits associés : ajout via l'API AJAX du panier, sans quitter la page.
   * Sans JS, le formulaire garde son comportement natif (redirection vers le panier).
   *
   * @param {HTMLFormElement} form - form[data-knr-quick-add="<titre du produit>"]
   */
  function initQuickAdd(form) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.closest('[data-knr-related]')?.querySelector('[data-knr-quick-add-status]');
    if (!(button instanceof HTMLButtonElement)) return;

    // action = /cart/add (éventuellement préfixé par la langue) : /cart/add.js et /cart.js en dérivent.
    const addUrl = `${new URL(form.action).pathname}.js`;
    const cartUrl = addUrl.replace(/\/add\.js$/, '.js');

    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let resetTimer;

    /** @param {string} message */
    const announce = (message) => {
      if (status) status.textContent = message;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.getAttribute('aria-busy') === 'true') return;

      button.setAttribute('aria-busy', 'true');
      announce('');

      try {
        const response = await fetch(addUrl, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        const result = await response.json();
        // 422 : stock insuffisant ou produit indisponible ; Shopify fournit le message à afficher.
        if (!response.ok) throw new Error(result.description || result.message);

        const cart = await (await fetch(cartUrl, { headers: { Accept: 'application/json' } })).json();
        document.querySelectorAll('[data-knr-cart-count]').forEach((count) => {
          if (!(count instanceof HTMLElement)) return;
          count.textContent = String(cart.item_count);
          count.hidden = cart.item_count === 0;
        });

        announce(`${status instanceof HTMLElement ? status.dataset.added : ''} ${form.dataset.knrQuickAdd ?? ''}`.trim());
        button.classList.add('is-added');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => button.classList.remove('is-added'), 2000);
      } catch (error) {
        announce(error instanceof Error ? error.message : String(error));
      } finally {
        button.removeAttribute('aria-busy');
      }
    });
  }

  /**
   * @param {HTMLElement} element
   * @param {number} left
   */
  function smoothScrollBy(element, left) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('[data-knr-delivery]').forEach(renderDeliveryDate);
    root.querySelectorAll('[data-knr-gallery]').forEach(initGallery);
    root.querySelectorAll('[data-knr-delivery-list]').forEach(initDeliveryCarousel);
    root.querySelectorAll('[data-knr-related-list]').forEach(initRelated);
    root.querySelectorAll('script[data-knr-variants]').forEach((json) => {
      if (json instanceof HTMLScriptElement) initVariants(json);
    });
    root.querySelectorAll('[data-knr-sticky]').forEach((sticky) => {
      if (sticky instanceof HTMLElement) initSticky(sticky);
    });
    root.querySelectorAll('form[data-knr-quick-add]').forEach((form) => {
      if (form instanceof HTMLFormElement) initQuickAdd(form);
    });
  }

  init();

  // Éditeur de thème : la section est re-rendue à chaque modification de réglage.
  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
