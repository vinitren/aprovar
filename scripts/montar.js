// Monta uma rodada de aprovação a partir de uma pasta de peças.
//
// Uso:  node scripts/montar.js <cliente> <pasta-da-rodada> [--refazer]
//   <cliente>          pasta em clientes/ (cliente.json + logo.png)
//   <pasta-da-rodada>  ex.: Desktop\Clientes\Excellence-Eventos\aprovacao\2026-10-14
// Sai em public/<cliente>/<nome-da-pasta>/ e o endereço fica
// aprovar.tdigital.tech/<cliente>/<nome-da-pasta>/
//
// O formato da pasta está no README. Em resumo:
//   rodada.txt                 titulo, intro, data
//   01 Seção/secao.txt         nome (o botão da barra), titulo, sub
//   01 Seção/01 Peça/info.txt  titulo, etiqueta, grupo, ordem, nota, pergunta,
//                              aprovado, formato, escolha (pode repetir)
//   01 Seção/01 Peça/*.jpg     as versões, na ordem do nome; o nome vira a legenda
//   anuncio.txt, legenda.txt, campos.txt, qualquer outro .txt: viram "Ver o texto"
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const [slug, origem] = process.argv.slice(2).filter(a => !a.startsWith("--"));
const REFAZER = process.argv.includes("--refazer");
if (!slug || !origem) {
  console.error("Uso: node scripts/montar.js <cliente> <pasta-da-rodada> [--refazer]");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(path.join(RAIZ, "config.json"), "utf8"));
const dirCliente = path.join(RAIZ, "clientes", slug);
if (!fs.existsSync(path.join(dirCliente, "cliente.json"))) erro(`Falta clientes/${slug}/cliente.json`);
const cliente = JSON.parse(fs.readFileSync(path.join(dirCliente, "cliente.json"), "utf8"));
if (!fs.existsSync(origem)) erro(`Pasta não encontrada: ${origem}`);

const rodada = path.basename(path.resolve(origem));
const SAIDA = path.join(RAIZ, "public", slug, rodada);
if (fs.existsSync(SAIDA) && !REFAZER) erro(`Já existe ${path.relative(RAIZ, SAIDA)}. Use --refazer pra montar de novo (o link continua o mesmo).`);

function erro(msg) { console.error(msg); process.exit(1); }

// ---------- leitura ----------
const ler = f => fs.readFileSync(f, "utf8").replace(/^\ufeff/, "").replace(/\r\n/g, "\n");
const ordena = (a, b) => a.localeCompare(b, "pt-BR", { numeric: true });
const semNumero = s => s.replace(/^\d+[\s._-]*/, "").trim();
const subpastas = dir => fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort(ordena);
const slugify = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// "chave: valor", uma por linha. Linha sem chave conhecida continua o valor de cima.
// Chave que pode repetir (escolha) vira lista.
function chaves(arquivo, conhecidas, repetem = []) {
  const r = {};
  if (!fs.existsSync(arquivo)) return r;
  let atual = null;
  for (const linha of ler(arquivo).split("\n")) {
    const m = linha.match(/^([a-zçãõáéíóú]+):\s*(.*)$/i);
    if (m && conhecidas.includes(m[1].toLowerCase())) {
      atual = m[1].toLowerCase();
      if (repetem.includes(atual)) (r[atual] = r[atual] || []).push(m[2].trim());
      else r[atual] = m[2].trim();
    } else if (atual && !repetem.includes(atual) && linha.trim()) {
      r[atual] += "\n" + linha.trim();
    }
  }
  return r;
}

// ---------- imagens ----------
let ffmpeg = process.env.FFMPEG || "ffmpeg";
try { execFileSync(ffmpeg, ["-version"], { stdio: "ignore" }); } catch (e) {
  const base = path.join(process.env.LOCALAPPDATA || "", "Microsoft/WinGet/Packages");
  const pacote = fs.existsSync(base) && fs.readdirSync(base).find(n => n.startsWith("Gyan.FFmpeg"));
  const versao = pacote && fs.readdirSync(path.join(base, pacote)).find(n => n.startsWith("ffmpeg"));
  if (!versao) erro("ffmpeg não encontrado (instalar: winget install Gyan.FFmpeg)");
  ffmpeg = path.join(base, pacote, versao, "bin", "ffmpeg.exe");
}
const IMG = path.join(SAIDA, "img");
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(IMG, { recursive: true });
let contador = 0;
function img(arquivo, nome) {
  const saida = path.join(IMG, `${nome}.webp`);
  // webp já vem no tamanho de web; o resto é reduzido pra 1080 de largura
  if (arquivo.toLowerCase().endsWith(".webp")) fs.copyFileSync(arquivo, saida);
  else execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", arquivo,
    "-vf", "scale='min(1080,iw)':-2", "-c:v", "libwebp", "-quality", "80", saida]);
  contador++;
  return `img/${nome}.webp`;
}

// ---------- textos ----------
function anuncio(t) {
  if (!t.includes("TEXTO PRINCIPAL")) return [{ texto: t.trim() }];
  const partes = [{ rotulo: "Texto principal", texto: t.split("TEXTO PRINCIPAL")[1].split(/-{10,}/)[1].trim() }];
  const titulo = t.match(/^TÍTULO:\s*(.+)$/m), botao = t.match(/^BOTÃO:\s*(.+)$/m);
  if (titulo) partes.push({ rotulo: "Título", texto: titulo[1].trim() });
  if (botao) partes.push({ rotulo: "Botão", texto: botao[1].trim() });
  return partes;
}
function textos(dir, it) {
  const lista = [];
  const arqs = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".txt") && f.toLowerCase() !== "info.txt").sort(ordena);
  for (const f of arqs) {
    const t = ler(path.join(dir, f)).trim();
    const nome = f.slice(0, -4).toLowerCase();
    if (nome === "anuncio") lista.push({ resumo: "Ver o texto do anúncio", partes: anuncio(t) });
    else if (nome === "legenda") lista.push({ resumo: "Ver a legenda", partes: [{ texto: t }] });
    else if (nome === "campos") it.campos = Object.entries(chavesLivres(t));
    else if (/https?:\/\//.test(t)) {
      // lista de links: "nome   https://..." por linha
      lista.push({ resumo: `Ver ${semNumero(f.slice(0, -4))}`, linhas: t.split("\n").filter(l => l.trim()).map(l => {
        const m = l.match(/^(.*?)\s*(https?:\/\/\S+)\s*$/);
        return m ? { texto: m[1].trim() || m[2], url: m[2] } : { texto: l.trim() };
      }) });
    } else lista.push({ resumo: `Ver ${semNumero(f.slice(0, -4))}`, partes: [{ texto: t }] });
  }
  return lista;
}
// campos.txt: qualquer "Chave: valor", na ordem do arquivo
function chavesLivres(t) {
  const r = {}; let atual = null;
  for (const linha of t.split("\n")) {
    const m = linha.match(/^([^:]{1,30}):\s*(.*)$/);
    if (m && !/^https?$/i.test(m[1])) { atual = m[1].trim(); r[atual] = m[2].trim(); }
    else if (atual && linha.trim()) r[atual] += "\n" + linha.trim();
  }
  return r;
}

// "Pergunta | Opção A | Opção B". Um link no meio da pergunta vira o link dela.
function escolha(linha) {
  const [pergunta, ...opcoes] = linha.split("|").map(s => s.trim());
  const url = pergunta.match(/https?:\/\/\S+/)?.[0];
  return { pergunta: url ? pergunta.replace(url, "").trim() : pergunta, url, opcoes };
}

// ---------- peças ----------
const CHAVES = ["titulo", "título", "etiqueta", "grupo", "ordem", "nota", "pergunta", "aprovado", "formato", "escolha"];
function peca(dir, nomePasta, id) {
  const i = chaves(path.join(dir, "info.txt"), CHAVES, ["escolha"]);
  const it = { id, titulo: i.titulo || i["título"] || semNumero(nomePasta) };
  for (const k of ["etiqueta", "grupo", "ordem", "nota", "pergunta", "aprovado"]) if (i[k]) it[k] = i[k];
  if (/livre/i.test(i.formato || "")) it.livre = true;
  if (i.escolha) it.escolhas = i.escolha.map(escolha);

  const fotos = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort(ordena);
  it.slides = fotos.map((f, k) => {
    const rot = semNumero(f.replace(/\.[^.]+$/, ""));
    return { src: img(path.join(dir, f), `${id}-${k + 1}`), label: rot || (fotos.length > 1 ? `${k + 1} de ${fotos.length}` : "Peça"), ia: /\bIA\b|ilustrativa/i.test(rot) };
  });
  const t = textos(dir, it);
  if (t.length) it.textos = t;
  return it;
}

// ---------- rodada ----------
const r = chaves(path.join(origem, "rodada.txt"), ["titulo", "título", "intro", "data"]);
const dataPasta = rodada.match(/^(\d{4})-(\d{2})-(\d{2})/);
const DADOS = {
  cliente: slug,
  rodada,
  marca: cliente.marca || cliente.nome,
  zap: cliente.whatsapp || config.whatsapp,
  data: r.data || (dataPasta ? `${dataPasta[3]}/${dataPasta[2]}/${dataPasta[1]}` : ""),
  secoes: subpastas(origem).map((nomeSec, s) => {
    const dir = path.join(origem, nomeSec);
    const sx = chaves(path.join(dir, "secao.txt"), ["nome", "titulo", "título", "sub"]);
    const titulo = sx.titulo || sx["título"] || semNumero(nomeSec);
    return {
      id: slugify(sx.nome || titulo) || `secao-${s + 1}`,
      nome: sx.nome || titulo,
      titulo,
      sub: sx.sub,
      itens: subpastas(dir).map((nomePeca, p) => peca(path.join(dir, nomePeca), nomePeca, `${s + 1}-${p + 1}`)),
    };
  }),
};

// ---------- página ----------
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const negrito = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const estilo = cliente.estilo || {};
const html = ler(path.join(RAIZ, "motor/index.html"))
  .replaceAll("{{nome}}", esc(cliente.nome))
  .replaceAll("{{fundo}}", esc(estilo["--fundo"] || "#faf8f5"))
  .replaceAll("{{fontes}}", cliente.fontes || "family=Inter:wght@400;500;600")
  .replaceAll("{{cores}}", Object.entries(estilo).map(([k, v]) => `${k}: ${v};`).join(" "))
  .replaceAll("{{titulo}}", esc(r.titulo || r["título"] || "Material para aprovação"))
  .replaceAll("{{intro}}", r.intro ? `<p class="intro">${negrito(r.intro)}</p>` : "")
  .replaceAll("{{assinatura}}", esc(cliente.assinatura || cliente.nome));
fs.writeFileSync(path.join(SAIDA, "index.html"), html);
for (const f of ["app.js", "style.css"]) fs.copyFileSync(path.join(RAIZ, "motor", f), path.join(SAIDA, f));
fs.copyFileSync(path.join(dirCliente, "logo.png"), path.join(SAIDA, "logo.png"));
fs.writeFileSync(path.join(SAIDA, "dados.js"), "// Gerado por scripts/montar.js. Não editar à mão.\nwindow.DADOS = " + JSON.stringify(DADOS, null, 1) + ";\n");

// ---------- resumo ----------
const total = DADOS.secoes.reduce((n, s) => n + s.itens.length, 0);
let bytes = 0;
for (const f of fs.readdirSync(IMG)) bytes += fs.statSync(path.join(IMG, f)).size;
console.log(`${total} peças em ${DADOS.secoes.length} seções, ${contador} imagens (${(bytes / 1048576).toFixed(1)} MB)`);
DADOS.secoes.forEach(s => console.log(`  ${s.nome}: ${s.itens.length}`));
const semImagem = DADOS.secoes.flatMap(s => s.itens).filter(i => !i.slides.length);
if (semImagem.length) console.log(`Sem imagem (confira se é de propósito): ${semImagem.map(i => i.titulo).join("; ")}`);
console.log(`\nLink: ${config.dominio}/${slug}/${rodada}/`);
