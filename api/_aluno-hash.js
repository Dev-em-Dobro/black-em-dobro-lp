// Normaliza e gera o hash de um e-mail de aluno.
// Usado pelo script que gera a base (scripts/gerar-base-alunos.cjs) e pela
// função /api/aluno. Arquivos com "_" na pasta api não viram endpoint.
const crypto = require("crypto");

const SALT = "black-em-dobro:alunos-geral";
const EMAIL_RE = /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function normalizeEmail(value) {
  if (typeof value !== "string" || value.length > 160) return "";
  const email = value.trim().toLowerCase().replace(/^mailto:/, "");
  return EMAIL_RE.test(email) ? email : "";
}

function hashEmail(email) {
  return crypto.createHash("sha256").update(`${SALT}:${email}`).digest("hex").slice(0, 24);
}

module.exports = { normalizeEmail, hashEmail };
