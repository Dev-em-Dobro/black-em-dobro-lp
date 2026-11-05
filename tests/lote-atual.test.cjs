const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../js/lote-atual.js'), 'utf8');
const bonus = { textContent: '' };
const period = { textContent: '' };
const section = {
  hidden: true,
  querySelector(selector) { return selector === '[data-lot-bonus]' ? bonus : period; },
};

let now = Date.parse('2026-11-05T02:59:59Z');
let tick;
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
}

vm.runInNewContext(script, {
  Date: TestDate,
  Intl,
  document: { querySelector: () => section, addEventListener() {} },
  window: { addEventListener() {} },
  setInterval(callback) { tick = callback; },
});

function expectLot(instant, expected) {
  now = Date.parse(instant);
  tick();
  assert.equal(section.hidden, !expected, instant);
  assert.equal(bonus.textContent, expected || '', instant);
}

assert.equal(section.hidden, true, 'antes do início da campanha');
expectLot('2026-11-05T03:00:00Z', 'Sorteio de 3 meses de Claude');
expectLot('2026-11-07T02:59:59Z', 'Sorteio de 3 meses de Claude');
expectLot('2026-11-07T03:00:00Z', 'Acesso ao Orion Pro');
expectLot('2026-11-12T03:00:00Z', 'Você poderá participar do Desafio Meu Primeiro Cliente em 45 dias');
expectLot('2026-11-14T03:00:00Z', 'Acesso ao Workshop Como Ser Aprovado em Qualquer Entrevista Dev');
expectLot('2026-11-19T03:00:00Z', 'Acesso ao Workshop Desenvolvendo Sites Premium');
expectLot('2026-11-26T02:59:59Z', 'Acesso ao Workshop Desenvolvendo Sites Premium');
expectLot('2026-11-26T03:00:00Z', null);
assert.equal(period.textContent, '', 'prazo oculto após a campanha');
