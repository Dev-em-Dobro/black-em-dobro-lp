// Testa /api/aluno com uma base falsa (a base real vem da planilha e não é usada aqui)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.join(__dirname, '..');
const { normalizeEmail, hashEmail } = require(path.join(root, 'api', '_aluno-hash.js'));

// Normalização
assert.equal(normalizeEmail('  Aluno@Exemplo.COM '), 'aluno@exemplo.com');
assert.equal(normalizeEmail('mailto:aluno@exemplo.com'), 'aluno@exemplo.com');
assert.equal(normalizeEmail('sem-arroba'), '');
assert.equal(normalizeEmail(42), '');
assert.equal(hashEmail('aluno@exemplo.com'), hashEmail(normalizeEmail('ALUNO@exemplo.com ')));
assert.match(hashEmail('aluno@exemplo.com'), /^[0-9a-f]{24}$/);

// Base falsa no lugar de api/_base-alunos.json
const basePath = path.join(root, 'api', '_base-alunos.json');
const fake = new Module(basePath);
fake.filename = basePath;
fake.loaded = true;
fake.exports = [hashEmail('aluno@exemplo.com')];
require.cache[basePath] = fake;
// O arquivo real pode não existir: aponta a resolução direto para o módulo falso
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return request === './_base-alunos.json' ? basePath : resolve.call(this, request, ...rest);
};
const handler = require(path.join(root, 'api', 'aluno.js'));

async function call({ method = 'POST', type = 'application/json', body } = {}) {
  const res = { statusCode: 0, headers: {}, body: null };
  res.setHeader = (key, value) => { res.headers[key.toLowerCase()] = value; };
  res.status = code => { res.statusCode = code; return res; };
  res.json = data => { res.body = data; return res; };
  await handler({ method, headers: { 'content-type': type }, body }, res);
  return res;
}

(async () => {
  let res = await call({ body: { email: ' ALUNO@exemplo.com' } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { aluno: true });
  assert.equal(res.headers['cache-control'], 'no-store');

  res = await call({ body: { email: 'outra@pessoa.com' } });
  assert.deepEqual(res.body, { aluno: false });

  assert.equal((await call({ body: { email: 'invalido' } })).statusCode, 400);
  assert.equal((await call({ body: {} })).statusCode, 400);
  assert.equal((await call({ method: 'GET' })).statusCode, 405);
  assert.equal((await call({ type: 'text/plain', body: 'x' })).statusCode, 415);

  // A planilha nunca vai para o git
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /^\*\.xlsx$/m);

  console.log('/api/aluno confere a base de alunos por hash: OK');
})();
