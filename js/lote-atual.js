(() => {
  const section = document.querySelector('#lote-atual');
  if (!section) return;

  const bonus = section.querySelector('[data-lot-bonus]');
  const period = section.querySelector('[data-lot-period]');
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const lots = [
    { start: '2026-11-05', end: '2026-11-07', bonus: 'Sorteio de 3 meses de Claude', period: '05 e 06 de novembro, até 23h59.' },
    { start: '2026-11-07', end: '2026-11-12', bonus: 'Acesso ao Orion Pro', period: 'De 07 a 11 de novembro, até 23h59.' },
    { start: '2026-11-12', end: '2026-11-14', bonus: 'Você poderá participar do Desafio Meu Primeiro Cliente em 45 dias', period: '12 e 13 de novembro, até 23h59.' },
    { start: '2026-11-14', end: '2026-11-19', bonus: 'Acesso ao Workshop Como Ser Aprovado em Qualquer Entrevista Dev', period: 'De 14 a 18 de novembro, até 23h59. Com especialista em empregabilidade.' },
    { start: '2026-11-19', end: '2026-11-26', bonus: 'Acesso ao Workshop Desenvolvendo Sites Premium', period: 'De 19 a 25 de novembro, até 23h59.' },
  ];

  let displayedDate = '';

  function dateInFortaleza() {
    const parts = Object.fromEntries(dateFormatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function updateLot() {
    const today = dateInFortaleza();
    if (today !== displayedDate) {
      displayedDate = today;
      const current = lots.find(({ start, end }) => today >= start && today < end);
      section.hidden = !current;
      bonus.textContent = current?.bonus || '';
      period.textContent = current?.period || '';
    }
  }

  updateLot();
  // Keeps an open page in sync when a new lot starts at midnight in Fortaleza.
  setInterval(updateLot, 1000);
  document.addEventListener('visibilitychange', updateLot);
  window.addEventListener('pageshow', updateLot);
})();
