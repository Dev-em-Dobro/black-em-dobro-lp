const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../alunos-geral/index.html'), 'utf8');
const base = fs.readFileSync(path.join(__dirname, '../alunos-dq/index.html'), 'utf8');
const condition = 'O seu desconto depende do que você já tem na Dev em Dobro. Informe seu e-mail para ver a sua condição.';

assert.match(html, /<link rel="canonical" href="https:\/\/blackinfinita\.devemdobro\.com\/alunos-geral">/);
assert.match(html, /A <span class="hl">maior condição<\/span> da história da Dev em Dobro está ainda melhor para alunos!<\/h1>/);
assert.doesNotMatch(html, /offer-card-price|ecosystem-final-value|Preço final|R\$ 797|Quero garantir|Asimov/);
assert.doesNotMatch(html, /class="card signup-card offer-card hero-form"/);
assert.equal((html.match(/Sua condição de aluno/g) || []).length, 2);
assert.equal(html.split(condition).length - 1, 2);
assert.equal((html.match(/data-checkout/g) || []).length, 10);
assert.equal((html.match(/>Quero minha condição de aluno<\/a>/g) || []).length, 10);
assert.equal((html.match(/<section\b/g) || []).length, (base.match(/<section\b/g) || []).length);
assert.match(html, /<p class="offer-ribbon">Condição Exclusiva para alunos por tempo limitado!<\/p>/);
assert.match(html, /data-offer-period hidden/);
assert.match(html, /<script src="\/js\/lote-atual\.js\?v=bonus-novembro-2026" defer><\/script>/);

assert.match(html, /<aside class="hz-bar" data-hz-bar data-hz-hide-on="#lista"[^>]* inert>/);
assert.match(html, /<a class="hz-bar-cta" id="cta-barra-flutuante" href="https:\/\/pay\.hub\.la\/NZKc6aZXwbD4ihw9vvPN" target="_blank" rel="noopener">Quero minha condição de aluno</);
assert.equal((html.match(/data-hz-(?:days|hours|minutes|seconds)>/g) || []).length, 4);
assert.match(html, /<script src="\/js\/barra-flutuante\.js\?v=2" defer><\/script>/);
assert.match(html, /<div class="hz-zoom" data-hz-zoom>\s*<section class="hero hz-hero" id="topo">\s*<div class="hz-overlay" aria-hidden="true"><\/div>\s*<figure class="hero-banner"/);
assert.match(html, /<link rel="stylesheet" href="\/css\/hero-zoom\.css\?v=4">/);
assert.match(html, /<\/div>\s*<progress class="offer-lot-progress"[^>]*><\/progress>\s*<\/div>/, 'barra de progresso abaixo do contador');
assert.ok(html.indexOf('/js/barra-flutuante.js') < html.indexOf('/js/hero-zoom.js'), 'barra escuta o zoom antes dele emitir');


// Todos os botões (10 do checkout + barra flutuante) abrem em nova aba
const buttons = html.match(/<a class="[^"]*"[^>]*(?:data-checkout|id="cta-barra-flutuante")[^>]*>/g) || [];
assert.equal(buttons.length, 11);
buttons.forEach(tag => assert.match(tag, / target="_blank" rel="noopener"/, tag));

console.log('alunos-geral sem preço, com condição de aluno e CTA próprio: OK');
