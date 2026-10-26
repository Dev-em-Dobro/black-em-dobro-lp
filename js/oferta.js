const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const incoming = new URLSearchParams(window.location.search);
const extra = new URLSearchParams();

keys.forEach((key) => {
  const value = (incoming.get(key) || "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 200);
  if (value) extra.set(key, value);
});

if ([...extra.keys()].length) {
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    const url = new URL(link.href);
    extra.forEach((value, key) => url.searchParams.set(key, value));
    link.href = url.toString();
  });
}
