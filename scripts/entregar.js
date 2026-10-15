// Copia uma rodada aprovada pro Drive do cliente, no formato "passo a passo"
// que ele segue pra publicar: uma pasta por passo, uma por peça, as imagens
// originais (sem perder qualidade) e o texto pronto pra copiar.
//
// Uso:  node scripts/entregar.js <pasta-da-rodada> <destino> [--secoes 2,3] [--pular "03 Posts/04 Algo"]
//   <destino>   ex.: "G:\Meu Drive\Imagens - Excellence Produtora\Instagram 14 10 2026"
//               (o Google Drive para computador sincroniza sozinho)
//   --secoes    só estas seções, pelo número da pasta (padrão: todas)
//   --pular     peça que não foi aprovada, pelo caminho dentro da rodada (pode repetir)
//
// Não vai pro cliente: info.txt (notas da aprovação) e anuncio.txt (ficha interna
// do anúncio, quem sobe somos nós). campos.txt vira texto.txt.
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opc = nome => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
const pular = args.flatMap((a, i) => args[i - 1] === "--pular" ? [path.normalize(a).toLowerCase()] : []);
const soSecoes = opc("--secoes")?.split(",").map(n => parseInt(n));
const [origem, destino] = args.filter((a, i) => !a.startsWith("--") && !["--secoes", "--pular"].includes(args[i - 1]));
if (!origem || !destino) {
  console.error('Uso: node scripts/entregar.js <pasta-da-rodada> <destino> [--secoes 2,3] [--pular "03 Posts/04 Algo"]');
  process.exit(1);
}
if (!fs.existsSync(origem)) { console.error(`Pasta não encontrada: ${origem}`); process.exit(1); }
if (fs.existsSync(destino)) { console.error(`Já existe: ${destino}\nEscolha outro nome (a pasta antiga fica como está no Drive do cliente).`); process.exit(1); }

const ler = f => fs.readFileSync(f, "utf8").replace(/^\ufeff/, "").replace(/\r\n/g, "\n");
const ordena = (a, b) => a.localeCompare(b, "pt-BR", { numeric: true });
const semNumero = s => s.replace(/^\d+[\s._-]*/, "").trim();
const limpa = s => s.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
const subpastas = dir => fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort(ordena);
const chave = (arq, k) => fs.existsSync(arq) ? ler(arq).match(new RegExp(`^${k}:\\s*(.+)$`, "mi"))?.[1].trim() : null;
const nn = n => String(n).padStart(2, "0");

const titulo = chave(path.join(origem, "rodada.txt"), "t[ií]tulo") || "Material";
const passos = [];
let imagens = 0, puladas = [];
fs.mkdirSync(destino, { recursive: true });

subpastas(origem).forEach(nomeSec => {
  const numSec = parseInt(nomeSec);
  if (soSecoes && !soSecoes.includes(numSec)) return;
  const dirSec = path.join(origem, nomeSec);
  const tSec = chave(path.join(dirSec, "secao.txt"), "t[ií]tulo") || semNumero(nomeSec);
  const nomePasso = `Passo ${passos.length + 1} - ${limpa(tSec)}`;
  const dPasso = path.join(destino, nomePasso);
  fs.mkdirSync(dPasso);
  passos.push(nomePasso);

  let p = 0;
  subpastas(dirSec).forEach(nomePeca => {
    if (pular.includes(path.normalize(`${nomeSec}/${nomePeca}`).toLowerCase())) { puladas.push(`${nomeSec}/${nomePeca}`); return; }
    const dirPeca = path.join(dirSec, nomePeca);
    const tPeca = chave(path.join(dirPeca, "info.txt"), "t[ií]tulo") || semNumero(nomePeca);
    const dPeca = path.join(dPasso, `${nn(++p)} - ${limpa(tPeca).slice(0, 60).trim()}`);
    fs.mkdirSync(dPeca);
    for (const f of fs.readdirSync(dirPeca).sort(ordena)) {
      const baixo = f.toLowerCase();
      if (baixo === "info.txt" || baixo === "anuncio.txt") continue;
      if (/\.(jpe?g|png|webp|mp4|mov)$/i.test(f)) { fs.copyFileSync(path.join(dirPeca, f), path.join(dPeca, f)); imagens++; }
      else if (baixo.endsWith(".txt")) fs.copyFileSync(path.join(dirPeca, f), path.join(dPeca, baixo === "campos.txt" ? "texto.txt" : f));
    }
  });
});

fs.writeFileSync(path.join(destino, "LEIA-ME.txt"), "\ufeff" + [
  `${titulo.toUpperCase()} · PASSO A PASSO`, "",
  "Siga as pastas na ordem, de cima pra baixo.",
  "Em cada pasta estão as imagens na ordem certa e o texto pronto pra copiar (legenda.txt).",
  "Pra publicar sem perder qualidade, baixe a imagem do Drive (não encaminhe pelo WhatsApp).", "",
  "As pastas, na ordem:", ...passos.map(p => `  ${p}`), "",
].join("\r\n"));

console.log(`${passos.length} passos, ${imagens} arquivos em ${destino}`);
passos.forEach(p => console.log(`  ${p}`));
if (puladas.length) console.log(`Fora (não aprovadas): ${puladas.join("; ")}`);
if (pular.length > puladas.length) console.log("Atenção: algum --pular não bateu com nenhuma pasta. Confira o caminho.");
