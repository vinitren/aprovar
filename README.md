# Aprovar · páginas de aprovação da Trentini Digital

Uma página por rodada de material, feita pro cliente aprovar no celular: cada
peça com as versões em carrossel, **Aprovado / Quero mudar**, e no fim um botão
que manda todas as respostas pelo WhatsApp.

Endereço: `https://aprovar.tdigital.tech/<cliente>/<rodada>/`
(ex.: `aprovar.tdigital.tech/excellence/2026-10-14/`)

## Como está organizado

```
motor/                  a página genérica (index.html, app.js, style.css)
clientes/<cliente>/     cliente.json (nome, cores, fontes) + logo.png
config.json             o WhatsApp que recebe as respostas e o domínio
scripts/montar.js       pasta de peças → public/<cliente>/<rodada>/
scripts/entregar.js     rodada aprovada → Drive do cliente, em "Passo 1, 2, 3..."
public/                 o que vai pro ar (a Vercel publica esta pasta)
```

É a etapa 4 (e o script da 5) do processo de criativos do trentini:
`/criativos-1-fotos` → `2-anuncios` → `3-instagram` → `4-aprovacao` → `5-drive`.
Todas gravam na mesma pasta da rodada, neste formato.

Cada rodada recebe uma **cópia** do motor. Mexer no motor depois não muda
página que já foi pro cliente; pra atualizar uma rodada antiga, montar de novo
com `--refazer`.

## Montar uma rodada

1. Organizar a pasta das peças (formato abaixo), de preferência em
   `Desktop\Clientes\<Nome>\criativos\AAAA-MM-DD\`
2. Cliente novo: criar `clientes/<cliente>/cliente.json` e `logo.png`
   (copiar o da Excellence e trocar)
3. `node scripts/montar.js <cliente> "<pasta-da-rodada>"`
4. Conferir local (qualquer servidor estático em `public/`), commit e push.
   A Vercel publica sozinha

Precisa do ffmpeg (`winget install Gyan.FFmpeg`); o script acha a instalação
do winget mesmo fora do PATH. Imagem `.webp` é copiada como está; o resto é
reduzido pra 1080 de largura em webp.

## Formato da pasta da rodada

```
2026-10-14/                         o nome da pasta vira o fim do link
  rodada.txt
  01 Anúncios que sobem agora/      seção (o número só ordena)
    secao.txt
    01 Casamento completo/          peça
      info.txt
      01 Feed · foto real.jpg       o nome da imagem (sem o número) é a legenda
      02 Stories · foto real.jpg    "IA" ou "ilustrativa" no nome: legenda roxa
      anuncio.txt                   "Ver o texto do anúncio"
      legenda.txt                   "Ver a legenda"
```

**rodada.txt**
```
titulo: Casamento e 15 anos
intro: Texto curto do topo. **Negrito** assim.
data: 14/10/2026            (sem isso, sai do nome da pasta)
```

**secao.txt** (opcional)
```
nome: Anúncios              o botão na barra fixa
titulo: Anúncios que sobem agora
sub: Os 4 de casamento entram primeiro.
```

**info.txt** (só `titulo` é comum; o resto, quando precisar)
```
titulo: Já tem o lugar? O resto é com a Excellence
etiqueta: Casamento         a etiqueta em cima do título ("IA" nela: roxa)
grupo: Casamento            subtítulo que separa peças dentro da seção
ordem: 1 de 7
nota: O que mudou nesta peça, em uma ou duas frases.
pergunta: Pergunta aberta, com campo de resposta.
aprovado: 13/10             já vem marcada como aprovada
formato: livre              imagem sem a moldura 4:5 (print de perfil)
escolha: A versão IA pode rodar junto? | Pode rodar | Só a foto real
escolha: Post antigo https://instagram.com/p/... | Arquivar | Manter
```
O título vem do `info.txt` porque o Windows não aceita `?` no nome da pasta.
`escolha` pode repetir. Um link na pergunta vira o link dela.

**Textos da peça:** `anuncio.txt` no padrão dos anúncios (TEXTO PRINCIPAL entre
as linhas tracejadas, `TÍTULO:`, `BOTÃO:`); `legenda.txt` como está;
`campos.txt` com `Chave: valor` por linha (vira uma tabela, ex.: nome e bio do
perfil); qualquer outro `.txt` vira "Ver <nome do arquivo>", e se tiver links,
uma lista com um link por linha.

Exemplo completo: `Desktop\Clientes\Excellence-Eventos\criativos\2026-10-14\`.

**A ordem padrão das seções** (é a ordem em que o cliente publica, e vira
"Passo 1, 2, 3..." no Drive):

```
01 Anúncios          feed + stories + anuncio.txt (não vai pro Drive: quem sobe somos nós)
02 Perfil            01 O perfil: campos.txt (nome, categoria, bio, link) + simulação, formato: livre
03 Posts             na ordem de publicar, legenda.txt em cada um
04 Destaques         01 Capa.png + os stories
05 Posts antigos     lista com link do que arquiva + escolha nos duvidosos
06 Reserva           posts pra depois, com legenda
```
Seção sem peça não entra. Rodada só de anúncios tem só a 01.

## Entregar no Drive (depois da aprovação)

```
node scripts/entregar.js "<pasta-da-rodada>" "G:\Meu Drive\<pasta do cliente>\<nome>" --secoes 2,3,4,5,6 --pular "03 Posts/04 Algo"
```

Copia as imagens **originais** (não as reduzidas da página) numa pasta
`Passo N - <seção>` por seção e `NN - <peça>` por peça, com o `legenda.txt`, e
escreve o `LEIA-ME.txt`. Fica de fora o `info.txt` e o `anuncio.txt` (ficha
interna); `campos.txt` vira `texto.txt`. O Google Drive para computador (`G:`)
sincroniza sozinho. Não sobrescreve: se o destino existe, para.

## Publicação (uma vez só)

- Vercel: projeto `aprovar` ligado a este repositório, Framework Preset
  **Other**, sem build. O `vercel.json` aponta `public/` e põe `noindex` em tudo
- Domínio: `aprovar.tdigital.tech` no projeto. O DNS do tdigital.tech está na
  Hostinger: registro **CNAME** `aprovar` → `cname.vercel-dns.com`
- A raiz do domínio manda pro tdigital.tech
