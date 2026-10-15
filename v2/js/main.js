document.documentElement.classList.add("js");

const topbar = document.querySelector(".topbar");
const updateTopbar = () => topbar?.classList.toggle("is-hidden", window.scrollY > 24);
if (topbar) {
  window.addEventListener("scroll", updateTopbar, { passive: true });
  updateTopbar();
}

/* Validação --------------------------------------------------------------
   Mesmas regras do /api/subscribe: nome com letras, e-mail simples,
   WhatsApp brasileiro ou número internacional em formato E.164. */
const digits = (value) => String(value || "").replace(/\D/g, "");
const cleanName = (value) => value.trim().replace(/\s+/g, " ");
const countries = [
  ["🇧🇷", "Brasil", "+55"], ["🇦🇷", "Argentina", "+54"], ["🇦🇺", "Austrália", "+61"],
  ["🇧🇪", "Bélgica", "+32"], ["🇧🇴", "Bolívia", "+591"], ["🇨🇦", "Canadá", "+1"],
  ["🇨🇱", "Chile", "+56"], ["🇨🇳", "China", "+86"], ["🇨🇴", "Colômbia", "+57"],
  ["🇰🇷", "Coreia do Sul", "+82"], ["🇩🇰", "Dinamarca", "+45"], ["🇪🇸", "Espanha", "+34"],
  ["🇺🇸", "Estados Unidos", "+1"], ["🇫🇷", "França", "+33"], ["🇩🇪", "Alemanha", "+49"],
  ["🇬🇷", "Grécia", "+30"], ["🇳🇱", "Holanda", "+31"], ["🇮🇳", "Índia", "+91"],
  ["🇮🇪", "Irlanda", "+353"], ["🇮🇱", "Israel", "+972"], ["🇮🇹", "Itália", "+39"],
  ["🇯🇵", "Japão", "+81"], ["🇲🇽", "México", "+52"], ["🇳🇿", "Nova Zelândia", "+64"],
  ["🇵🇪", "Peru", "+51"], ["🇵🇱", "Polônia", "+48"], ["🇵🇹", "Portugal", "+351"],
  ["🇬🇧", "Reino Unido", "+44"], ["🇷🇺", "Rússia", "+7"], ["🇿🇦", "África do Sul", "+27"],
  ["🇨🇭", "Suíça", "+41"], ["🇺🇾", "Uruguai", "+598"], ["🇻🇪", "Venezuela", "+58"],
];

document.querySelectorAll("[data-country-code]").forEach((select) => {
  countries.forEach(([flag, country, code], index) => {
    if (index === 0) return;
    select.add(new Option(`${flag} ${country} ${code}`, code));
  });
});

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
    test: (v, input) => {
      const local = digits(v);
      const code = input.closest(".field").querySelector("[name=countryCode]").value;
      return code === "+55"
        ? /^[1-9]{2}\d{8,9}$/.test(local)
        : /^[1-9]\d{5,13}$/.test(local) && /^[1-9]\d{7,14}$/.test(digits(code) + local);
    },
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
  const ok = rule.test(input.value, input);
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
  const countryCode = form.querySelector('[name="countryCode"]');
  phone.maxLength = 15;

  phone.addEventListener("input", () => {
    const maxLength = 15 - digits(countryCode.value).length;
    phone.maxLength = countryCode.value === "+55" ? 15 : maxLength;
    phone.value = countryCode.value === "+55"
      ? maskPhone(phone.value)
      : digits(phone.value).slice(0, maxLength);
  });
  countryCode.addEventListener("change", () => {
    phone.maxLength = countryCode.value === "+55" ? 15 : 15 - digits(countryCode.value).length;
    phone.placeholder = countryCode.value === "+55" ? "(11) 99999-9999" : "Número local";
    phone.value = countryCode.value === "+55"
      ? maskPhone(phone.value)
      : digits(phone.value).slice(0, phone.maxLength);
    if (phone.getAttribute("aria-invalid") === "true") checkField(phone);
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
          phone: digits(countryCode.value) + digits(form.whatsapp.value),
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
  ".section-head, .narrative, .versus, .chips, .tile, .path, .timeline li, .mantra, .duo-card, .founders, .manifesto blockquote, .signup"
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
