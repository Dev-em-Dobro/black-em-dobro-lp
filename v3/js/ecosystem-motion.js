const universeMotionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    entry.target.dataset.active = String(entry.isIntersecting);
  }
});

document.querySelectorAll('[data-universe-motion]').forEach(art => {
  universeMotionObserver.observe(art);
});
