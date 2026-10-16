const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('gallery controls follow scroll bounds, resizing and reduced motion', () => {
  const previous = { addEventListener: (_, fn) => { previous.click = fn; } };
  const next = { addEventListener: (_, fn) => { next.click = fn; } };
  let lastScroll, onScroll, onResize, reducedMotion = false;
  const track = {
    scrollLeft: 0, scrollWidth: 660, clientWidth: 420,
    firstElementChild: { offsetWidth: 136 },
    scrollBy: options => { lastScroll = options; },
    addEventListener: (_, fn) => { onScroll = fn; },
  };
  const elements = { '.builders-covers': track, '[data-gallery-prev]': previous, '[data-gallery-next]': next };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../v3/js/course-gallery.js'), 'utf8'), {
    document: { querySelectorAll: () => [{ querySelector: selector => elements[selector] }] },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    ResizeObserver: class { constructor(fn) { onResize = fn; } observe() {} },
  });
  assert.equal(previous.disabled, true);
  assert.equal(next.disabled, false);
  next.click();
  assert.equal(lastScroll.left, 148);
  assert.equal(lastScroll.behavior, 'smooth');
  track.scrollLeft = 240;
  onScroll();
  assert.equal(previous.disabled, false);
  assert.equal(next.disabled, true);
  reducedMotion = true;
  previous.click();
  assert.equal(lastScroll.left, -148);
  assert.equal(lastScroll.behavior, 'auto');
  track.scrollLeft = 0;
  track.clientWidth = 700;
  onResize();
  assert.equal(previous.disabled, true);
  assert.equal(next.disabled, true);
});

test('Builders and DevQuest galleries navigate independently', () => {
  const galleries = [0, 1].map(() => {
    const previous = { addEventListener: (_, fn) => { previous.click = fn; } };
    const next = { addEventListener: (_, fn) => { next.click = fn; } };
    const track = {
      scrollLeft: 0, scrollWidth: 660, clientWidth: 420,
      firstElementChild: { offsetWidth: 136 },
      addEventListener: (_, fn) => { track.onScroll = fn; },
      scrollBy: ({ left }) => { track.scrollLeft += left; track.onScroll(); },
    };
    const elements = { '.builders-covers': track, '[data-gallery-prev]': previous, '[data-gallery-next]': next };
    return { previous, next, track, querySelector: selector => elements[selector] };
  });
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../v3/js/course-gallery.js'), 'utf8'), {
    document: { querySelectorAll: () => galleries },
    window: { matchMedia: () => ({ matches: false }) },
    ResizeObserver: class { observe() {} },
  });
  galleries[0].next.click();
  assert.equal(galleries[0].track.scrollLeft, 148);
  assert.equal(galleries[1].track.scrollLeft, 0);
  assert.equal(galleries[1].previous.disabled, true);
  galleries[0].track.scrollLeft = 240;
  galleries[0].track.onScroll();
  assert.equal(galleries[0].next.disabled, true);
  assert.equal(galleries[1].next.disabled, false);
});
