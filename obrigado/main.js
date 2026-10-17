const params = new URLSearchParams(window.location.hash.slice(1));
const firstName = params.get("nome")?.trim();

if (firstName) {
  document.querySelector("[data-first-name]").textContent = `${firstName}, seu cadastro`;
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

// shortcut: falta a URL do SendFlow, preencher quando o link do grupo for fornecido.
const sendflowUrl = "";
const sendflowLink = document.querySelector("[data-sendflow-link]");

if (sendflowUrl) {
  sendflowLink.href = sendflowUrl;
  sendflowLink.classList.remove("is-disabled");
  sendflowLink.removeAttribute("aria-disabled");
  sendflowLink.setAttribute("target", "_blank");
  sendflowLink.setAttribute("rel", "noopener noreferrer");
  document.querySelector("[data-link-note]").textContent = "O grupo é silencioso e usado apenas para os avisos da campanha.";
} else {
  sendflowLink.addEventListener("click", (event) => event.preventDefault());
}
