const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../oferta-geral/index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../js/prazo-oferta.js'), 'utf8');
const fields = ['days', 'hours', 'minutes', 'seconds'].map(() => ({ textContent: '' }));
const progress = { value: 100 };
const status = { textContent: '' };
const selectors = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map((unit, index) => [`[data-offer-${unit}]`, fields[index]]));
const block = {
  hidden: true,
  dataset: { start: html.match(/data-start="([^"]+)"/)[1], end: html.match(/data-end="([^"]+)"/)[1] },
  querySelector: selector => ({ progress, '.offer-lot-status': status, ...selectors })[selector],
};
let now = Date.parse('2026-11-05T19:59:59-03:00');
let tick;
const context = {
  Date: { parse: Date.parse, now: () => now },
  document: { querySelector: () => block, addEventListener() {} },
  window: { addEventListener() {} },
  setInterval(callback) { tick = callback; },
};
vm.runInNewContext(script, context);
assert.equal(block.hidden, false, 'visível também antes de quinta às 20h');
assert.deepEqual(fields.map(field => field.textContent), ['02', '03', '59', '01'], 'conta o tempo real até o encerramento antes da abertura');
assert.equal(progress.value, 100);

function at(instant, expected) {
  now = Date.parse(instant);
  tick();
  assert.equal(block.hidden, false, instant);
  assert.deepEqual(fields.map(field => field.textContent), expected, instant);
}
at('2026-11-05T23:00:00Z', ['02', '03', '59', '00']);
assert.equal(progress.value, 100);
at('2026-11-06T21:59:30-03:00', ['01', '01', '59', '30']);
assert.equal(progress.value, 50, 'barra acompanha o tempo restante');
at('2026-11-07T23:58:59-03:00', ['00', '00', '00', '01']);
at('2026-11-07T23:59:00-03:00', ['00', '00', '00', '00']);
assert.equal(progress.value, 0);
assert.equal(status.textContent, 'Lote promocional encerrado.');
at('2026-11-08T12:00:00-03:00', ['00', '00', '00', '00']);
assert.equal(progress.value, 0, 'não reinicia após o prazo');
vm.runInNewContext(script, { document: { querySelector: () => null } });
console.log('Prazo da oferta: início, fuso de Brasília, barra e encerramento OK');
