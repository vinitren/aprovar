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
public/                 o que vai pro ar (a Vercel publica esta pasta)
```

Cada rodada recebe uma **cópia** do motor. Mexer no motor depois não muda
página que já foi pro cliente; pra atualizar uma rodada antiga, montar de novo
com `--refazer`.

## Montar uma rodada

1. Organizar a pasta das peças (formato abaixo), de preferência em
   `Desktop\Clientes\<Nome>\aprovacao\AAAA-MM-DD\`
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

Exemplo completo: `Desktop\Clientes\Excellence-Eventos\aprovacao\2026-10-14\`.

## Publicação (uma vez só)

- Vercel: projeto `aprovar` ligado a este repositório, Framework Preset
  **Other**, sem build. O `vercel.json` aponta `public/` e põe `noindex` em tudo
- Domínio: `aprovar.tdigital.tech` no projeto. O DNS do tdigital.tech está na
  Hostinger: registro **CNAME** `aprovar` → `cname.vercel-dns.com`
- A raiz do domínio manda pro tdigital.tech
