/* ==========================================================================
   Modal da condição de aluno (prefixo ma-)

   - Qualquer botão de checkout ([data-checkout] ou a barra flutuante) abre
     o modal em vez de ir direto para o checkout.
   - O e-mail é conferido em POST /api/aluno (só responde aluno: true/false).
   - Aluno: abre o checkout do botão clicado (com UTMs) em nova aba. Se o
     navegador bloquear a aba, mostra um botão para abrir.
   - Não aluno: mostra "Matrícula não encontrada" com o link da /oferta-geral.
   - Se a conferência falhar, deixa seguir para o checkout (não perde a venda).
   - Eventos no dataLayer (sem e-mail): event "condicao_aluno".
   ========================================================================== */
(() => {
  const modal = document.querySelector('[data-ma-modal]');
  // Navegador sem <dialog>: os botões seguem direto para o checkout
  if (!modal || typeof modal.showModal !== 'function') return;

  const form = modal.querySelector('[data-ma-form]');
  const input = form.querySelector('input[type="email"]');
  const submit = modal.querySelector('[data-ma-submit]');
  const error = modal.querySelector('[data-ma-error]');
  const steps = modal.querySelectorAll('[data-ma-step]');
  const checkoutLink = modal.querySelector('[data-ma-checkout]');
  const geralLink = modal.querySelector('[data-ma-geral]');
  const emailOut = modal.querySelector('[data-ma-email]');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let checkoutUrl = '';
  let busy = false;

  const track = resultado => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'condicao_aluno', resultado });
  };

  function showStep(name) {
    steps.forEach(step => { step.hidden = step.dataset.maStep !== name; });
  }

  function setError(html) {
    error.innerHTML = html;
    error.hidden = !html;
    input.setAttribute('aria-invalid', html ? 'true' : 'false');
  }

  function setBusy(on) {
    busy = on;
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submit.textContent = on ? 'Conferindo...' : 'Ver minha condição de aluno';
  }

  function openModal(url) {
    checkoutUrl = url;
    setError('');
    showStep('email');
    modal.showModal();
    input.focus();
    track('modal_aberto');
  }

  // Abre o checkout em nova aba; se o navegador bloquear, mostra o botão
  function goToCheckout() {
    checkoutLink.href = checkoutUrl;
    const tab = window.open(checkoutUrl, '_blank');
    if (tab) {
      tab.opener = null;
      modal.close();
    } else {
      showStep('aluno');
      checkoutLink.focus();
    }
  }

  /* --- Intercepta os botões de checkout ---------------------------------- */
  // Fase de bolha: a barra flutuante já copiou o href do hero no próprio clique
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-checkout], #cta-barra-flutuante');
    if (!link || modal.contains(link)) return;
    event.preventDefault();
    openModal(link.href);
  });

  /* --- Envio do e-mail --------------------------------------------------- */
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const email = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setError('Digite um e-mail válido.');
      input.focus();
      return;
    }
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/aluno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { aluno } = await response.json();
      if (aluno) {
        track('aluno');
        goToCheckout();
      } else {
        track('nao_aluno');
        emailOut.textContent = email;
        geralLink.href = `/oferta-geral${window.location.search}`;
        showStep('nao-aluno');
        geralLink.focus();
      }
    } catch {
      track('erro');
      checkoutLink.href = checkoutUrl;
      setError(`Não conseguimos conferir agora. Tente de novo ou <a href="${checkoutUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener">siga para o checkout</a>.`);
    } finally {
      setBusy(false);
    }
  });

  input.addEventListener('input', () => { if (!error.hidden) setError(''); });

  /* --- Fechar e tentar de novo ------------------------------------------- */
  modal.querySelector('[data-ma-close]').addEventListener('click', () => modal.close());
  // Clique fora do cartão (no fundo escuro) fecha
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.querySelector('[data-ma-retry]').addEventListener('click', () => {
    showStep('email');
    input.select();
    input.focus();
  });
})();
