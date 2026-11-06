(() => {
  const section = document.querySelector('#lote-atual');
  const block = document.querySelector('[data-offer-period]');
  if (!section || !block) return;

  const lots = [
    { number: 1, start: '2026-11-05T20:00:00-03:00', end: '2026-11-07T00:00:00-03:00', bonuses: ['freela', 'claude', 'orion', 'acompanhamento'] },
    { number: 2, start: '2026-11-07T00:00:00-03:00', end: '2026-11-12T00:00:00-03:00', bonuses: ['freela', 'orion', 'acompanhamento'] },
    { number: 3, start: '2026-11-12T00:00:00-03:00', end: '2026-11-19T00:00:00-03:00', bonuses: ['freela', 'orion', 'simone'] },
    { number: 4, start: '2026-11-19T00:00:00-03:00', end: '2026-11-26T00:00:00-03:00', bonuses: ['freela', 'orion', 'sites'] },
    { number: 5, start: '2026-11-29T00:00:00-03:00', end: '2026-12-03T00:00:00-03:00', bonuses: ['freela', 'orion', 'sites'] },
  ].map(lot => ({ ...lot, start: Date.parse(lot.start), end: Date.parse(lot.end) }));

  const bonuses = section.querySelectorAll('[data-lot-bonus]');
  const period = section.querySelector('[data-lot-period]');
  const progress = block.querySelector('progress');
  const status = block.querySelector('.offer-lot-status');
  const timer = block.querySelector('[role="timer"]');
  const fields = ['days', 'hours', 'minutes', 'seconds'].map(unit => block.querySelector(`[data-offer-${unit}]`));
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' });
  let displayedLot;

  function update() {
    const now = Date.now();
    const current = lots.find(lot => now >= lot.start && now < lot.end);
    const next = lots.find(lot => now < lot.start);

    if (displayedLot !== (current || null)) {
      displayedLot = current || null;
      section.hidden = !current;
      let number = 0;
      bonuses.forEach(bonus => {
        bonus.hidden = !current?.bonuses.includes(bonus.dataset.lotBonus);
        if (!bonus.hidden) bonus.querySelector('.current-lot-label').textContent = `Bônus ${++number}`;
      });
      period.textContent = current
        ? `Bônus válidos até ${dateFormatter.format(new Date(current.end - 1))}, às 23h59.`
        : '';
    }

    block.hidden = false;
    const end = current ? current.end : next?.start;
    const start = current ? current.start : lots.find(lot => lot.number === next?.number - 1)?.end ?? now;
    timer.hidden = !end;
    progress.hidden = !end;
    timer.setAttribute('aria-label', current ? 'Tempo até o encerramento do lote' : 'Tempo até a abertura do próximo lote');
    status.textContent = current
      ? `Lote ${current.number} com vagas limitadas!`
      : next ? `Matrículas ${next.number === 1 ? 'abrem' : 'reabrem'} em ${dateFormatter.format(new Date(next.start))}${next.number === 1 ? ', às 20h' : ''}.` : 'Lote promocional encerrado.';

    const remaining = end ? Math.max(0, end - now) : 0;
    const seconds = Math.ceil(remaining / 1000);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds % 86400 / 3600), Math.floor(seconds % 3600 / 60), seconds % 60];
    fields.forEach((field, index) => { field.textContent = String(values[index]).padStart(2, '0'); });
    progress.value = end > start ? 50 + (1 - Math.min(1, remaining / (end - start))) * 50 : 100;
  }

  update();
  setInterval(update, 1000);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
})();
