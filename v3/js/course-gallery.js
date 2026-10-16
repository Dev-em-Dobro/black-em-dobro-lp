document.querySelectorAll('[data-course-gallery]').forEach(gallery => {
  const covers = gallery.querySelector('.builders-covers');
  const previous = gallery.querySelector('[data-gallery-prev]');
  const next = gallery.querySelector('[data-gallery-next]');

  function updateControls() {
    previous.disabled = covers.scrollLeft <= 2;
    next.disabled = covers.scrollLeft >= covers.scrollWidth - covers.clientWidth - 2;
  }

  for (const [button, direction] of [[previous, -1], [next, 1]]) {
    button.addEventListener('click', () => {
      covers.scrollBy({
        left: direction * (covers.firstElementChild.offsetWidth + 12),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  }

  covers.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(covers);
  updateControls();
});
