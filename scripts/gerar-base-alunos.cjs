#!/usr/bin/env node
/* Gera api/_base-alunos.json a partir da planilha de alunos (.xlsx).

   Uso:  node scripts/gerar-base-alunos.cjs "[DED] [BF_2026] Base de alunos.xlsx"

   - Lê só as abas listadas em ABAS (os não ativos ficam de fora).
   - Pega qualquer célula com cara de e-mail dessas abas.
   - Grava apenas o HASH de cada e-mail, nunca o e-mail. A planilha fica fora
     do git (.gitignore) e não vai para o site.
   - Sem dependências: o .xlsx é um zip com XML dentro. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { normalizeEmail, hashEmail } = require("../api/_aluno-hash");

const ABAS = ["ALUNOS_BF_2025", "ALUNOS_GERAIS_ATIVOS"];
const SAIDA = path.join(__dirname, "..", "api", "_base-alunos.json");

/* --- Zip: lê o diretório central e descompacta cada arquivo ------------- */
function readZip(buffer) {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("Arquivo não parece ser um .xlsx válido.");
  const count = buffer.readUInt16LE(end + 10);
  let pos = buffer.readUInt32LE(end + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    const method = buffer.readUInt16LE(pos + 10);
    const size = buffer.readUInt32LE(pos + 20);
    const nameLen = buffer.readUInt16LE(pos + 28);
    const extraLen = buffer.readUInt16LE(pos + 30);
    const commentLen = buffer.readUInt16LE(pos + 32);
    const local = buffer.readUInt32LE(pos + 42);
    const name = buffer.toString("utf8", pos + 46, pos + 46 + nameLen);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const data = buffer.subarray(start, start + size);
    files[name] = () => (method === 8 ? zlib.inflateRawSync(data) : data).toString("utf8");
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = text => text
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, "&");
const texts = xml => [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m => decode(m[1])).join("");

function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Informe a planilha: node scripts/gerar-base-alunos.cjs "arquivo.xlsx"');
  const zip = readZip(fs.readFileSync(file));

  const shared = zip["xl/sharedStrings.xml"]
    ? [...zip["xl/sharedStrings.xml"]().matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => texts(m[1]))
    : [];
  const rels = Object.fromEntries([...zip["xl/_rels/workbook.xml.rels"]().matchAll(/<Relationship\b[^>]*>/g)]
    .map(([tag]) => [tag.match(/Id="([^"]+)"/)[1], tag.match(/Target="([^"]+)"/)[1]]));
  const sheets = Object.fromEntries([...zip["xl/workbook.xml"]().matchAll(/<sheet\b[^>]*>/g)]
    .map(([tag]) => [decode(tag.match(/name="([^"]+)"/)[1]), rels[tag.match(/r:id="([^"]+)"/)[1]]]));

  const hashes = new Set();
  for (const aba of ABAS) {
    const target = sheets[aba];
    if (!target) throw new Error(`Aba "${aba}" não encontrada. Abas: ${Object.keys(sheets).join(", ")}`);
    const xml = zip[`xl/${target.replace(/^\/?xl\//, "")}`]();
    let total = 0;
    for (const [, attrs, body = ""] of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const raw = /t="s"/.test(attrs)
        ? shared[+(body.match(/<v>(\d+)<\/v>/) || [])[1]] || ""
        : /t="inlineStr"/.test(attrs) ? texts(body) : decode((body.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || "");
      const email = normalizeEmail(raw);
      if (email) { hashes.add(hashEmail(email)); total++; }
    }
    console.log(`${aba}: ${total} e-mails`);
  }

  fs.writeFileSync(SAIDA, JSON.stringify([...hashes].sort()) + "\n");
  console.log(`${hashes.size} alunos únicos -> ${path.relative(process.cwd(), SAIDA)}`);
}

main();
