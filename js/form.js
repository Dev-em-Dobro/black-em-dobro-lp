function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isPhoneValid(value) {
  return /^[1-9]{2}\d{8,9}$/.test(onlyDigits(value));
}

function isNameValid(value) {
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 && /^[\p{L}][\p{L}\s'.-]*$/u.test(name);
}

function isEmailValid(value) {
  const email = value.trim().toLowerCase();
  return email.length <= 120 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
}

function setError(input, message) {
  const error = input.closest(".field")?.querySelector(".field-error");
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (error) error.textContent = message || "";
}

function validate(form) {
  const name = form.querySelector('[name="nome"]');
  const email = form.querySelector('[name="email"]');
  const phone = form.querySelector('[name="whatsapp"]');
  let valid = true;

  if (!isNameValid(name.value)) {
    setError(name, "Informe seu nome, sem links ou símbolos.");
    valid = false;
  } else {
    setError(name, "");
  }

  if (!isEmailValid(email.value)) {
    setError(email, "Informe um e-mail válido.");
    valid = false;
  } else {
    setError(email, "");
  }

  if (!isPhoneValid(phone.value)) {
    setError(phone, "Informe o WhatsApp com DDD.");
    valid = false;
  } else {
    setError(phone, "");
  }

  return valid;
}

function showAlert(form, message, ok) {
  let alert = form.querySelector(".form-alert");
  if (!alert) {
    alert = document.createElement("p");
    alert.className = "form-alert";
    alert.setAttribute("role", "status");
    form.prepend(alert);
  }
  alert.classList.toggle("form-alert--ok", ok);
  alert.textContent = message;
}

async function submitForm(form) {
  const button = form.querySelector("button");
  const honeypot = form.querySelector('[name="website"]');
  if (honeypot && honeypot.value.trim()) {
    showAlert(form, "Não foi possível enviar o formulário.");
    return;
  }

  const payload = {
    name: form.querySelector('[name="nome"]').value.trim().replace(/\s+/g, " "),
    email: form.querySelector('[name="email"]').value.trim().toLowerCase(),
    phone: onlyDigits(form.querySelector('[name="whatsapp"]').value),
  };

  button.disabled = true;
  button.dataset.label ||= button.textContent;
  button.textContent = "Enviando...";

  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível entrar na lista.");

    form.classList.add("is-done");
    showAlert(
      form,
      "Você está na lista. Vamos enviar a data, o horário e a condição especial da abertura.",
      true
    );
  } catch (error) {
    showAlert(form, error.message || "Erro ao enviar o formulário.");
  } finally {
    button.disabled = false;
    button.textContent = button.dataset.label;
  }
}

document.querySelectorAll("[data-waitlist]").forEach((form) => {
  const phone = form.querySelector('[name="whatsapp"]');
  phone.addEventListener("input", () => {
    phone.value = maskPhone(phone.value);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelector(".form-alert")?.remove();
    if (!validate(form)) return;
    submitForm(form);
  });
});
