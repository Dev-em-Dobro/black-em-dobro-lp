const countdown = document.querySelector("[data-countdown]");
const liveAt = new Date("2026-11-05T20:00:00-03:00").getTime();
const compact = window.matchMedia("(max-width: 560px)");

function updateCountdown() {
  const remaining = Math.max(0, liveAt - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  countdown.textContent = compact.matches
    ? `${days}d ${String(hours).padStart(2, "0")}h`
    : `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

if (countdown) {
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}
