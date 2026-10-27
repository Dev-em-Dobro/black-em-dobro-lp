const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { routes } = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const redirect = pathname => routes.find(route => new RegExp(route.src).test(pathname));

const salesRedirects = {
  '/v1': '/alunos-bf',
  '/v1/': '/alunos-bf',
  '/v1/index.html': '/alunos-bf',
  '/v2': '/alunos-dq',
  '/v2/': '/alunos-dq',
  '/v2/index.html': '/alunos-dq',
  '/v3': '/oferta-geral',
  '/v3/': '/oferta-geral',
  '/v3/index.html': '/oferta-geral',
};

for (const [pathname, location] of Object.entries(salesRedirects)) {
  const route = redirect(pathname);
  assert.equal(route?.status, 308, pathname);
  assert.equal(route.headers.Location, location, pathname);
}

for (const pathname of ['/v2/index', '/v4', '/v4/', '/v10', '/v3/cards-preview.html', '/v3/gold-preview', '/v3/vs-preview.html', '/v2/outra-pagina']) {
  const route = redirect(pathname);
  assert.equal(route?.status, 308, pathname);
  assert.equal(route.headers.Location, '/', pathname);
}

for (const pathname of ['/', '/index.html', '/obrigado', '/obrigado/', '/privacidade.html', '/cookies.html', '/api/subscribe', '/alunos-bf', '/alunos-bf/', '/alunos-dq', '/oferta-geral', '/v2/css/style.css', '/v2/js/main.js', '/v3/css/ecosystem.css', '/v3/js/course-gallery.js', '/v3/assets/fundadores.png']) {
  assert.equal(redirect(pathname), undefined, pathname);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<body class="v3">/);
assert.equal((html.match(/data-waitlist/g) || []).length, 2);
assert.equal(fs.existsSync(path.join(root, 'middleware.js')), false);
assert.equal(fs.existsSync(path.join(root, 'v1/index.html')), false);
assert.equal(fs.existsSync(path.join(root, 'v2/index.html')), false);
assert.equal(fs.existsSync(path.join(root, 'v3/index.html')), false);
assert.equal(fs.existsSync(path.join(root, 'alunos-bf/index.html')), true);
assert.equal(fs.existsSync(path.join(root, 'alunos-dq/index.html')), true);
assert.equal(fs.existsSync(path.join(root, 'oferta-geral/index.html')), true);

for (const filename of ['index.html', 'obrigado/index.html', 'privacidade.html', 'cookies.html', 'alunos-bf/index.html', 'alunos-dq/index.html', 'oferta-geral/index.html']) {
  const source = fs.readFileSync(path.join(root, filename), 'utf8');
  assert.doesNotMatch(source, /href="\/v\d+\/#/);
  for (const [, resource] of source.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    assert.ok(fs.existsSync(path.join(root, resource)), `${filename}: ${resource}`);
  }
}

console.log('Vendas em /alunos-bf, /alunos-dq e /oferta-geral; versões antigas redirecionadas; recursos preservados: OK');
