(() => {
  /** @param {HTMLElement} compare - .knr-before-after__compare[data-knr-compare] */
  function initCompare(compare) {
    const range = compare.querySelector('[data-knr-compare-range]');
    if (!(range instanceof HTMLInputElement)) return;

    const update = () => compare.style.setProperty('--knr-position', `${range.value}%`);
    range.addEventListener('input', update);
    // Le navigateur peut restaurer la valeur du curseur au retour arrière.
    update();
  }

  /** @param {HTMLElement} root - [data-knr-testimonials] */
  function initTestimonials(root) {
    const slides = [...root.querySelectorAll('.knr-before-after__slide')];
    const arrows = root.querySelectorAll('[data-knr-testimonials-nav]');
    if (slides.length < 2) return;

    let index = 0;

    arrows.forEach((arrow) => {
      arrow.addEventListener('click', () => {
        const direction = Number(arrow.getAttribute('data-knr-testimonials-nav'));
        slides[index].classList.remove('is-active');
        index = (index + direction + slides.length) % slides.length;
        slides[index].classList.add('is-active');
      });
    });
  }

  /** @param {ParentNode} [root] */
  function init(root = document) {
    root.querySelectorAll('[data-knr-compare]').forEach((element) => {
      if (element instanceof HTMLElement) initCompare(element);
    });
    root.querySelectorAll('[data-knr-testimonials]').forEach((element) => {
      if (element instanceof HTMLElement) initTestimonials(element);
    });
  }

  init();

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) init(event.target);
  });
})();
