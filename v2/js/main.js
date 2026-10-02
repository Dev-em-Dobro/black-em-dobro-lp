document.documentElement.classList.add("js");

/* Validação --------------------------------------------------------------
   Mesmas regras do /api/subscribe: nome com letras, e-mail simples,
   WhatsApp brasileiro com DDD (10 ou 11 dígitos). */
const digits = (value) => String(value || "").replace(/\D/g, "");
const cleanName = (value) => value.trim().replace(/\s+/g, " ");

const rules = {
  nome: {
    test: (v) => /^[\p{L}][\p{L}\s'.-]{1,79}$/u.test(cleanName(v)),
    message: "Informe seu nome, sem links ou símbolos.",
  },
  email: {
    test: (v) => {
      const email = v.trim().toLowerCase();
      return email.length <= 120 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
    },
    message: "Informe um e-mail válido.",
  },
  whatsapp: {
    test: (v) => /^[1-9]{2}\d{8,9}$/.test(digits(v)),
    message: "Informe o WhatsApp com DDD.",
  },
};

function maskPhone(value) {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function checkField(input) {
  const rule = rules[input.name];
  if (!rule) return true;
  const ok = rule.test(input.value);
  const error = input.closest(".field")?.querySelector(".field-error");
  input.setAttribute("aria-invalid", ok ? "false" : "true");
  if (error) error.textContent = ok ? "" : rule.message;
  return ok;
}

/* Formulário ------------------------------------------------------------ */
document.querySelectorAll("[data-waitlist]").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  const done = form.parentElement.querySelector(".form-done");
  const inputs = [...form.querySelectorAll("input[name]")].filter((i) => rules[i.name]);
  const phone = form.querySelector('[name="whatsapp"]');

  phone.addEventListener("input", () => {
    phone.value = maskPhone(phone.value);
  });

  // Revalida em tempo real só depois do primeiro erro no campo.
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") checkField(input);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    const results = inputs.map(checkField);
    if (results.includes(false)) {
      inputs[results.indexOf(false)].focus();
      return;
    }

    if (form.querySelector('[name="website"]').value.trim()) {
      status.textContent = "Não foi possível enviar o formulário.";
      return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Enviando...";

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName(form.nome.value),
          email: form.email.value.trim().toLowerCase(),
          phone: digits(form.whatsapp.value),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível entrar na lista.");

      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.setAttribute("tabindex", "-1");
        done.focus();
      }
    } catch (error) {
      status.textContent = error.message || "Erro ao enviar o formulário.";
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});

/* Dock mobile: aparece depois do hero e some quando o formulário está na tela */
const dock = document.querySelector("[data-dock]");
const hero = document.querySelector(".hero");
const signup = document.querySelector("#lista");

if (dock && hero && signup && "IntersectionObserver" in window) {
  let heroVisible = true;
  let signupVisible = false;
  const update = () => dock.classList.toggle("is-visible", !heroVisible && !signupVisible);

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    update();
  }).observe(hero);

  new IntersectionObserver(([entry]) => {
    signupVisible = entry.isIntersecting;
    update();
  }, { threshold: 0.15 }).observe(signup);
}

/* Reveal ao rolar --------------------------------------------------------- */
const revealTargets = document.querySelectorAll(
  ".section-head, .narrative, .versus, .chips, .tile, .product, .receipt, .path, .timeline li, .mantra, .duo-card, .founders, .manifesto blockquote, .signup"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}
