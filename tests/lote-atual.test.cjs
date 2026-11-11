const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../js/lote-atual.js'), 'utf8');

function load(slug, instant) {
  const html = fs.readFileSync(path.join(__dirname, '..', slug, 'index.html'), 'utf8');
  const bonuses = [...html.matchAll(/data-lot-bonus="([^"]+)"/g)].map(([, key]) => ({
    dataset: { lotBonus: key }, hidden: false, label: { textContent: '' },
    querySelector() { return this.label; },
  }));
  const period = { textContent: '' };
  const section = { hidden: true, querySelectorAll: () => bonuses, querySelector: () => period };
  const progress = { value: 100 };
  const status = { textContent: '' };
  const timer = { attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const fields = ['days', 'hours', 'minutes', 'seconds'].map(() => ({ textContent: '' }));
  const selectors = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map((unit, index) => [`[data-offer-${unit}]`, fields[index]]));
  const block = { hidden: true, querySelector: selector => ({ progress, '.offer-lot-status': status, '[role="timer"]': timer, ...selectors })[selector] };
  const events = {};
  let now = Date.parse(instant);
  let tick;
  class TestDate extends Date { static now() { return now; } }
  vm.runInNewContext(script, {
    Date: TestDate, Intl,
    document: {
      querySelector: selector => ({ '#lote-atual': section, '[data-offer-period]': block })[selector],
      addEventListener: (event, callback) => { events[event] = callback; },
    },
    window: { addEventListener: (event, callback) => { events[event] = callback; } },
    setInterval(callback, delay) { assert.equal(delay, 1000); tick = callback; },
  });
  return {
    bonuses, section, period, progress, status, timer, block, fields,
    at(instant, event) { now = typeof instant === 'number' ? instant : Date.parse(instant); (event ? events[event] : tick)(); },
    visible() { return bonuses.filter(bonus => !bonus.hidden).map(bonus => bonus.dataset.lotBonus); },
    digits() { return fields.map(field => field.textContent); },
  };
}

for (const slug of ['alunos-bf', 'alunos-dq', 'alunos-geral', 'oferta-geral']) {
  const page = load(slug, '2026-11-05T19:59:59-03:00');
  assert.equal(page.section.hidden, true);
  assert.deepEqual(page.visible(), []);
  assert.match(page.status.textContent, /abrem em 5 de novembro, às 20h/);
  assert.deepEqual(page.digits(), ['00', '00', '00', '01']);

  const lots = [
    ['2026-11-05T20:00:00-03:00', '2026-11-06T23:59:59-03:00', ['freela', 'claude', 'orion', 'acompanhamento'], '6 de novembro', ['01', '04', '00', '00']],
    ['2026-11-07T00:00:00-03:00', '2026-11-11T23:59:59-03:00', ['freela', 'orion', 'acompanhamento'], '11 de novembro', ['05', '00', '00', '00']],
    ['2026-11-12T00:00:00-03:00', '2026-11-18T23:59:59-03:00', ['sites', 'freela', 'orion'], '18 de novembro', ['07', '00', '00', '00']],
    ['2026-11-19T00:00:00-03:00', '2026-11-26T23:59:59-03:00', ['sites', 'freela', 'orion', 'entrevistas'], '26 de novembro', ['08', '00', '00', '00']],
    ['2026-11-27T00:00:00-03:00', '2026-12-02T23:59:59-03:00', ['sites', 'freela', 'orion', 'entrevistas', 'claude-mes'], '2 de dezembro', ['06', '00', '00', '00']],
  ];
  lots.forEach(([start, lastSecond, expected, deadline, digits], index) => {
    page.at(start);
    assert.equal(page.section.hidden, false, `${slug}: lote ${index + 1}`);
    assert.equal(page.block.hidden, false);
    assert.equal(page.timer.hidden, false);
    assert.equal(page.progress.hidden, false);
    assert.equal(page.progress.value, 50);
    assert.deepEqual(page.visible(), expected);
    assert.deepEqual(page.digits(), digits);
    assert.equal(page.period.textContent, `Bônus válidos até ${deadline}, às 23h59.`);
    assert.equal(page.status.textContent, 'Lote com vagas limitadas!');
    assert.equal(page.timer.attributes['aria-label'], 'Tempo até o encerramento do lote');
    assert.deepEqual(page.bonuses.filter(bonus => !bonus.hidden).map(bonus => bonus.label.textContent), expected.map((_, i) => `Bônus ${i + 1}`));
    const freshPage = load(slug, start);
    assert.deepEqual(freshPage.visible(), expected, 'acesso direto durante cada lote');
    assert.deepEqual(freshPage.digits(), digits);
    page.at(lastSecond);
    assert.deepEqual(page.visible(), expected, 'bônus ativos durante todo o último minuto');
    assert.deepEqual(page.digits(), ['00', '00', '00', '01']);
    page.at(Date.parse(lastSecond) + 999);
    assert.deepEqual(page.visible(), expected, 'não vira antes da meia-noite');
  });

  page.at('2026-11-09T12:00:00-03:00', 'visibilitychange');
  assert.equal(page.progress.value, 75, 'barra acompanha o prazo do lote atual');
  assert.deepEqual(page.visible(), ['freela', 'orion', 'acompanhamento']);
  page.at('2026-11-12T00:00:00-03:00', 'pageshow');
  assert.deepEqual(page.visible(), ['sites', 'freela', 'orion'], 'atualiza ao voltar do cache de navegação');
  page.at('2026-11-26T00:00:00-03:00');
  assert.equal(page.section.hidden, false, 'o período de 19 a 26 inclui o dia 26 inteiro');
  assert.deepEqual(page.visible(), ['sites', 'freela', 'orion', 'entrevistas']);
  assert.deepEqual(page.digits(), ['01', '00', '00', '00']);
  page.at('2026-11-26T23:59:59-03:00');
  assert.equal(page.section.hidden, false);
  assert.equal(page.visible().includes('claude-mes'), false, 'sorteio de um mês só na reabertura');
  assert.deepEqual(page.digits(), ['00', '00', '00', '01']);
  page.at('2026-11-27T00:00:00-03:00');
  assert.deepEqual(page.visible(), ['sites', 'freela', 'orion', 'entrevistas', 'claude-mes']);
  assert.deepEqual(page.digits(), ['06', '00', '00', '00']);
  page.at('2026-12-03T00:00:00-03:00');
  assert.equal(page.section.hidden, true);
  assert.equal(page.timer.hidden, true);
  assert.equal(page.progress.hidden, true);
  assert.equal(page.status.textContent, 'Lote promocional encerrado.');
  assert.deepEqual(page.visible(), []);
  assert.deepEqual(page.digits(), ['00', '00', '00', '00']);
  page.at('2026-12-10T12:00:00-03:00');
  assert.equal(page.timer.hidden, true, 'não reinicia após o encerramento final');
}
vm.runInNewContext(script, { document: { querySelector: () => null } });
console.log('Três páginas: bônus atualizados, viradas em Brasília, contador, reabertura em 27/11 e encerramento em 02/12: OK');
