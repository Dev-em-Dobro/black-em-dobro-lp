const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const offers = [
  ['alunos-bf', '597', 'https://pay.hub.la/YKPMuMwSBhPBb7UUuDlX', true],
  ['alunos-dq', '797', 'https://pay.hub.la/NZKc6aZXwbD4ihw9vvPN', true],
  ['oferta-geral', '997', 'https://pay.hub.la/6njIGlJgossHQysj6WA7', false],
];

for (const [slug, price, checkout, ribbon] of offers) {
  const html = fs.readFileSync(path.join(__dirname, '..', slug, 'index.html'), 'utf8');
  const sections = html.match(/<section\b/g) || [];
  assert.equal((html.match(/data-waitlist|<form\b/g) || []).length, 0, slug);
  assert.doesNotMatch(html, /5 de novembro|às 20h|Dia 5|data-countdown|countdown\.js/);
  assert.equal(sections.length, 11, slug);
  assert.match(html, /<section class="v3-section current-lot"[^>]*>/, slug);
  assert.match(html, /<script src="\/js\/prazo-oferta\.js" defer><\/script>/, slug);
  assert.doesNotMatch(html, /id="desafio-primeiro-freela"|id="conteudo-live"|\/js\/lote-atual\.js/);
  assert.equal((html.match(/class="current-lot-bonus[" ]/g) || []).length, 4, slug);
  assert.equal((html.match(/data-offer-period/g) || []).length, 1, slug);
  assert.match(html, /data-end="2026-11-06T23:59:00-03:00"/, slug);
  assert.ok(html.indexOf('class="card signup-card offer-card hero-form"') < html.indexOf('data-offer-period'), slug);
  assert.doesNotMatch(html, /topbar-cta/);
  assert.equal((html.match(/data-checkout/g) || []).length, 10, slug);
  assert.equal((html.split(checkout).length - 1), 10, slug);
  assert.match(html, new RegExp(`class="ecosystem-final-value">R\\$ ${price}<span>,00</span>`));
  assert.equal(html.includes('Condição Exclusiva para alunos por tempo limitado!'), ribbon, slug);
  if (ribbon) assert.ok(html.indexOf('offer-ribbon') < html.indexOf('hero-banner'), slug);
  assert.match(html, /href="https:\/\/api\.whatsapp\.com\/send\/\?phone=5551989875708"/);
}

const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.equal((home.match(/data-waitlist/g) || []).length, 2);
assert.match(home, /5 de novembro/);

console.log('Ofertas alunos-bf, alunos-dq e oferta-geral sem formulário, com preço e checkout próprios: OK');
