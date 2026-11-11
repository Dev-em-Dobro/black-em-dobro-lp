// POST /api/aluno { email } -> { aluno: true | false }
// Confere se o e-mail está na base de alunos da Black (hashes gerados por
// scripts/gerar-base-alunos.cjs). Não devolve nenhum dado do aluno.
const { normalizeEmail, hashEmail } = require("./_aluno-hash");
const base = new Set(require("./_base-alunos.json"));

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ error: "Formato não suportado." });
  }

  const email = normalizeEmail(req.body && req.body.email);
  if (!email) return res.status(400).json({ error: "E-mail inválido." });

  return res.status(200).json({ aluno: base.has(hashEmail(email)) });
};
