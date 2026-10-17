const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const formScript = fs.readFileSync(path.join(root, 'v2/js/main.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'obrigado/index.html'), 'utf8');
const thanksScript = fs.readFileSync(path.join(root, 'obrigado/main.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'obrigado/style.css'), 'utf8');

assert.match(formScript, /window\.location\.assign\(`\/obrigado#nome=\$\{encodeURIComponent\(firstName\)\}`\)/);
assert.match(page, /data-first-name/);
assert.match(page, /data-sendflow-link/);
assert.match(page, /class="whatsapp-icon"/);
assert.match(page, /aria-disabled="true"/);
assert.match(thanksScript, /textContent = `\$\{firstName\}, seu cadastro`/);
assert.match(thanksScript, /history\.replaceState/);
assert.match(thanksScript, /https:\/\/sndflw\.com\/i\/iZlK938yCEH6pUT03RbK/);
assert.match(style, /@media \(max-width: 760px\) and \(max-height: 700px\)/);

for (const [, resource] of page.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
  if (resource === '/') continue;
  const target = resource.endsWith('/') ? path.join(root, resource, 'index.html') : path.join(root, resource);
  assert.ok(fs.existsSync(target), resource);
}

console.log('Página de obrigado, redirecionamento e personalização: OK');
