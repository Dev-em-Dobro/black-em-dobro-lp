const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const offers = [
  ['v1', '597', 'https://pay.hub.la/YKPMuMwSBhPBb7UUuDlX', true],
  ['v2', '797', 'https://pay.hub.la/NZKc6aZXwbD4ihw9vvPN', true],
  ['v3', '997', 'https://pay.hub.la/6njIGlJgossHQysj6WA7', false],
];

for (const [slug, price, checkout, ribbon] of offers) {
  const html = fs.readFileSync(path.join(__dirname, '..', slug, 'index.html'), 'utf8');
  const sections = html.match(/<section\b/g) || [];
  assert.equal((html.match(/data-waitlist|<form\b/g) || []).length, 0, slug);
  assert.doesNotMatch(html, /5 de novembro|às 20h|Dia 5|data-countdown|countdown\.js/);
  assert.equal(sections.length, 11, slug);
  assert.equal((html.match(/data-checkout/g) || []).length, sections.length + 1, slug);
  assert.equal((html.split(checkout).length - 1), sections.length + 1, slug);
  assert.match(html, new RegExp(`class="ecosystem-final-value">R\\$ ${price}<span>,00</span>`));
  assert.equal(html.includes('Condição Exclusiva para alunos por tempo limitado!'), ribbon, slug);
  assert.match(html, /href="https:\/\/api\.whatsapp\.com\/send\/\?phone=5551989875708"/);
}

const home = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.equal((home.match(/data-waitlist/g) || []).length, 2);
assert.match(home, /5 de novembro/);

console.log('Ofertas v1, v2 e v3 sem formulário, com preço e checkout próprios: OK');
