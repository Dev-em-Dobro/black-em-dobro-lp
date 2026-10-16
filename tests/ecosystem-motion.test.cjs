const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const art = Array.from({ length: 5 }, () => ({ dataset: {} }));
const observed = [];
let onIntersection;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../v3/js/ecosystem-motion.js'), 'utf8'), {
  document: { querySelectorAll: () => art },
  IntersectionObserver: class {
    constructor(callback) { onIntersection = callback; }
    observe(target) { observed.push(target); }
  },
});
assert.deepEqual(observed, art);
onIntersection(art.map((target, index) => ({ target, isIntersecting: index === 0 })));
assert.deepEqual(art.map(target => target.dataset.active), ['true', 'false', 'false', 'false', 'false']);
onIntersection([{ target: art[0], isIntersecting: false }, { target: art[4], isIntersecting: true }]);
assert.deepEqual(art.map(target => target.dataset.active), ['false', 'false', 'false', 'false', 'true']);
console.log('As cinco ilustrações alternam entre execução e pausa conforme a visibilidade: OK');
