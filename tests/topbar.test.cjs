const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../v2/js/main.js'), 'utf8').split('/* Validação')[0];

for (const persistent of [true, false]) {
  const classes = {};
  let onScroll;
  const window = { scrollY: 0, addEventListener: (_, callback) => { onScroll = callback; } };
  vm.runInNewContext(source, {
    document: {
      documentElement: { classList: { add() {} } },
      querySelector: () => ({
        hasAttribute: () => persistent,
        classList: { toggle: (name, enabled) => { classes[name] = enabled; } },
      }),
    },
    window,
  });
  assert.equal(classes['is-hidden'], false);
  window.scrollY = 800;
  onScroll();
  assert.equal(classes['is-hidden'], !persistent);
  assert.equal(classes['is-scrolled'], true);
  window.scrollY = 0;
  onScroll();
  assert.equal(classes['is-hidden'], false);
  assert.equal(classes['is-scrolled'], false);
}
console.log('Menu persistente na v3 e comportamento anterior nas demais páginas: OK');
