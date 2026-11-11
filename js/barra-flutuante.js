/* ==========================================================================
   Barra flutuante com contador + CTA (prefixo hz-)

   - O contador NÃO tem data própria: ele espelha os números que o
     js/lote-atual.js escreve no contador do hero ([data-offer-period]).
     Assim a barra mostra sempre exatamente o mesmo tempo do hero.
   - O link do botão é copiado do CTA do hero (que já recebeu as UTMs do
     js/oferta.js) na carga e de novo no clique.
   - Aparece quando o CTA do hero sai da tela por cima e some enquanto a
     seção final de oferta estiver visível.
   ========================================================================== */
(() => {
  const bar = document.querySelector('[data-hz-bar]');
  const heroCta = document.querySelector('.hero [data-checkout]');
  const heroTimer = document.querySelector('[data-offer-period]');
  const finalOffer = document.querySelector(bar?.dataset.hzHideOn || '#lista');
  if (!bar || !heroCta || !heroTimer) return;

  const barCta = bar.querySelector('#cta-barra-flutuante');
  const barTimer = bar.querySelector('[data-hz-timer]');
  const label = bar.querySelector('[data-hz-label]');
  const units = ['days', 'hours', 'minutes', 'seconds'];

  /* --- Contador: copia os valores do contador do hero ------------------- */
  function syncTimer() {
    const heroClock = heroTimer.querySelector('[role="timer"]');
    const off = heroTimer.hidden || !heroClock || heroClock.hidden;
    barTimer.hidden = off;
    if (off) return;
    units.forEach(unit => {
      const from = heroTimer.querySelector(`[data-offer-${unit}]`);
      const to = barTimer.querySelector(`[data-hz-${unit}]`);
      if (from && to && to.textContent !== from.textContent) to.textContent = from.textContent;
    });
    // Entre lotes o contador do hero conta até a próxima abertura
    const opening = /abertura/.test(heroClock.getAttribute('aria-label') || '');
    label.textContent = opening ? 'O próximo lote abre em:' : 'A oferta termina em:';
    barTimer.setAttribute('aria-label', heroClock.getAttribute('aria-label') || '');
  }
  new MutationObserver(syncTimer).observe(heroTimer, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-label'],
  });
  syncTimer();

  /* --- Link: mesmo href do CTA do hero (com UTMs) ----------------------- */
  const syncHref = () => { barCta.href = heroCta.href; };
  syncHref();
  window.addEventListener('load', syncHref);
  barCta.addEventListener('click', syncHref);

  /* --- Visibilidade ----------------------------------------------------- */
  let ctaGone = false;   // CTA do hero já saiu da tela por cima
  let inFinal = false;   // seção final de oferta visível
  let zoom = null;       // progresso do zoom do hero (null = sem zoom: mobile/movimento reduzido)

  function render() {
    // Com zoom (desktop): aparece quando o zoom passa de 5%. Sem zoom: quando o CTA do hero sai por cima.
    const show = (ctaGone || (zoom !== null && zoom > 0.05)) && !inFinal;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    document.body.classList.toggle('hz-bar-on', show);
  }

  new IntersectionObserver(([entry]) => {
    ctaGone = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    render();
  }).observe(heroCta);

  document.addEventListener('hz:zoom', ({ detail }) => { zoom = detail; render(); });

  if (finalOffer) {
    new IntersectionObserver(([entry]) => {
      inFinal = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      render();
    }, { threshold: [0, 0.25, 0.5] }).observe(finalOffer);
  }

  render();
})();
