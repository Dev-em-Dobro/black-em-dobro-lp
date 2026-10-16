const heroMotion = document.querySelector('.hero-cover-motion');
const heroMotionBanner = heroMotion.closest('.hero-banner');
const heroMotionImage = heroMotionBanner.querySelector('img');

function fitHeroMotion() {
  const { width, height } = heroMotion.viewBox.baseVal;
  const { clientWidth, clientHeight } = heroMotionBanner;
  const scale = Math.max(clientWidth / width, clientHeight / height);
  const [x, y] = getComputedStyle(heroMotionImage).objectPosition.split(' ').map(parseFloat);
  Object.assign(heroMotion.style, {
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    left: `${(clientWidth - width * scale) * x / 100}px`,
    top: `${(clientHeight - height * scale) * y / 100}px`,
  });
}

new ResizeObserver(fitHeroMotion).observe(heroMotionBanner);
new IntersectionObserver(([entry]) => {
  heroMotion.dataset.active = String(entry.isIntersecting);
}).observe(heroMotionBanner);
