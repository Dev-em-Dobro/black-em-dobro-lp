/* ==========================================================================
   Zoom do hero ao rolar (prefixo hz-), sem bibliotecas.

   - O hero fica sticky dentro do wrapper .hz-zoom, que tem a altura do
     hero + 120vh de rolagem extra.
   - Progresso p (0 a 1) vem do getBoundingClientRect do wrapper e é
     gravado em --p no hero. O zoom completa em 70% da rolagem extra
     (easeOutCubic); o resto segura a cena antes de liberar a página.
   - FLIP: mede a posição original (offset*, sem transform) do banner e
     do título e calcula quanto cada um anda. O CSS só interpola com --p.
   - Avisa a barra flutuante pelo evento "hz:zoom" (detail = p ou null).
   ========================================================================== */
(() => {
  const wrap = document.querySelector('[data-hz-zoom]');
  const hero = wrap?.querySelector('.hz-hero');
  const banner = hero?.querySelector('.hero-banner');
  const title = hero?.querySelector('.hero-title');
  if (!wrap || !hero || !banner || !title) return;

  const media = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  const ZOOM_END = 0.7;      // zoom completo em 70% da rolagem extra
  const EXTRA = 1.2;         // rolagem extra = 120vh
  const BANNER_H = 0.8;      // banner ampliado ocupa 80% da altura da tela
  const TITLE_GAP = 40;      // distância do título até a base do banner ampliado
  const AREA_GAP = 16;       // folga abaixo do topo fixo
  const BAR_SPACE = 124;     // espaço reservado para a barra flutuante (bottom 24px + altura)
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  let enabled = false;
  let stickyTop = 0;
  let frame = 0;
  let lastP = -1;

  // Posição do elemento dentro do hero, ignorando transform
  function offsetIn(el) {
    let top = 0;
    let left = 0;
    for (let node = el; node && node !== hero; node = node.offsetParent) {
      top += node.offsetTop;
      left += node.offsetLeft;
    }
    return { top, left, width: el.offsetWidth, height: el.offsetHeight };
  }

  /* --- Medição (FLIP) ---------------------------------------------------- */
  function measure() {
    enabled = media.matches;
    if (!enabled) {
      wrap.style.removeProperty('height');
      hero.style.removeProperty('top');
      ['--p', '--hz-dx', '--hz-dy', '--hz-s', '--hz-ty'].forEach(name => hero.style.removeProperty(name));
      hero.classList.remove('hz-faded');
      lastP = -1;
      emit();
      return;
    }
    const vw = hero.clientWidth;
    const vh = window.innerHeight;
    const heroH = hero.offsetHeight;
    // Hero mais alto que a tela: prende quando a base dele encosta na base da tela
    stickyTop = Math.min(0, vh - heroH);
    hero.style.top = `${stickyTop}px`;
    wrap.style.height = `${heroH + vh * EXTRA}px`;

    const b = offsetIn(banner);
    const t = offsetIn(title);
    if (!b.width || !b.height) return;
    // Área livre entre o topo fixo e a barra flutuante, em coordenadas do hero preso
    const topbar = document.querySelector('.topbar')?.offsetHeight || 0;
    const areaTop = topbar + AREA_GAP;
    const areaBottom = vh - BAR_SPACE;
    const centerX = vw / 2;
    const centerY = (areaTop + areaBottom) / 2 - stickyTop;
    const scale = Math.max(1, Math.min(vh * BANNER_H, areaBottom - areaTop) / b.height);
    const bannerBottom = centerY + (b.height * scale) / 2;
    hero.style.setProperty('--hz-dx', (centerX - (b.left + b.width / 2)).toFixed(2));
    hero.style.setProperty('--hz-dy', (centerY - (b.top + b.height / 2)).toFixed(2));
    hero.style.setProperty('--hz-s', scale.toFixed(4));
    hero.style.setProperty('--hz-ty', (bannerBottom - TITLE_GAP - (t.top + t.height)).toFixed(2));
    lastP = -1;
    update();
  }

  /* --- Progresso a partir da rolagem ------------------------------------ */
  function update() {
    frame = 0;
    if (!enabled) return;
    const rect = wrap.getBoundingClientRect();
    const distance = rect.height - hero.offsetHeight;
    const raw = distance > 0 ? Math.min(1, Math.max(0, (stickyTop - rect.top) / distance)) : 0;
    const p = easeOutCubic(Math.min(1, raw / ZOOM_END));
    if (Math.abs(p - lastP) < 0.0005) return;
    lastP = p;
    hero.style.setProperty('--p', p.toFixed(4));
    hero.classList.toggle('hz-faded', p > 0.5);
    emit(p);
  }

  function emit(p) {
    document.dispatchEvent(new CustomEvent('hz:zoom', { detail: enabled ? p : null }));
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure); // depois da imagem carregar
  media.addEventListener('change', measure); // troca de breakpoint ou de preferência
  // Fontes e imagens mudam a altura do hero enquanto carregam: remede quando o tamanho mudar
  new ResizeObserver(() => measure()).observe(hero);
  measure();
})();
