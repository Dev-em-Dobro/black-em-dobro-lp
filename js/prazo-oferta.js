(() => {
  const block = document.querySelector('[data-offer-period]');
  if (!block) return;

  const start = Date.parse(block.dataset.start);
  const end = Date.parse(block.dataset.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;

  const progress = block.querySelector('progress');
  const status = block.querySelector('.offer-lot-status');
  const fields = ['days', 'hours', 'minutes', 'seconds'].map(unit => block.querySelector(`[data-offer-${unit}]`));

  function update() {
    const now = Date.now();
    block.hidden = false;
    const remaining = Math.max(0, end - now);
    const seconds = Math.ceil(remaining / 1000);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds % 86400 / 3600), Math.floor(seconds % 3600 / 60), seconds % 60];
    fields.forEach((field, index) => { field.textContent = String(values[index]).padStart(2, '0'); });
    progress.value = 50 + (1 - Math.min(1, remaining / (end - start))) * 50;
    status.textContent = now >= end ? 'Lote promocional encerrado.' : 'Lote promocional com vagas limitadas!';
  }

  update();
  setInterval(update, 1000);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
})();
