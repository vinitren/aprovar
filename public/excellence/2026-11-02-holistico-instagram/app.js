// Motor da página de aprovação: monta as peças de dados.js, guarda as
// respostas neste aparelho e no fim monta a mensagem de WhatsApp com tudo.
// Não tem nada de cliente aqui: nome, WhatsApp e conteúdo vêm de dados.js.
(function () {
  const D = window.DADOS;
  const CHAVE = `aprovar:${D.cliente}/${D.rodada}`;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const link = (texto, url) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(texto)}</a>` : esc(texto);

  // ---------- estado ----------
  let estado = {};
  try { estado = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { estado = {}; }
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} };
  const st = id => (estado[id] = estado[id] || {});

  const itens = [];
  D.secoes.forEach(sec => sec.itens.forEach(it => {
    itens.push(it);
    if (it.aprovado && !st(it.id).d) st(it.id).d = "ok";
  }));

  $("#data").textContent = D.data;

  // ---------- render ----------
  const main = $("#conteudo");
  D.secoes.forEach(sec => {
    const el = document.createElement("section");
    el.className = "secao"; el.id = sec.id;
    let html = `<h2>${esc(sec.titulo)}</h2>${sec.sub ? `<p class="sub">${esc(sec.sub)}</p>` : ""}`;
    let grupoAnt = null;
    sec.itens.forEach(it => {
      if (it.grupo && it.grupo !== grupoAnt) html += `<p class="grupo">${esc(it.grupo)}</p>`;
      grupoAnt = it.grupo;
      html += peca(it);
    });
    el.innerHTML = html;
    main.appendChild(el);
  });

  function peca(it) {
    const slides = it.slides || [];
    let h = `<article class="peca" id="peca-${it.id}" data-id="${it.id}">
      <div class="peca-cab">
        <div class="peca-meta">${it.etiqueta ? `<span class="tag${/\bIA\b/.test(it.etiqueta) ? " ia" : ""}">${esc(it.etiqueta)}</span>` : ""}${it.ordem ? `<span>${esc(it.ordem)}</span>` : ""}<span class="status"></span></div>
        <h3>${esc(it.titulo)}</h3>
      </div>`;
    if (slides.length) {
      h += `<div class="galeria${slides.length > 1 ? " varias" : ""}${it.livre ? " livre" : ""}">
        <div class="trilho">${slides.map((s, i) => `<figure data-i="${i}"><img src="${s.src}" alt="${esc(it.titulo)}, ${esc(s.label)}" loading="lazy" decoding="async"></figure>`).join("")}</div>
        ${slides.length > 1 ? `<button class="seta ant" type="button" aria-label="Anterior" disabled>‹</button><button class="seta prox" type="button" aria-label="Próxima">›</button>` : ""}
      </div>
      <div class="leg"><span class="rot${slides[0].ia ? " ia" : ""}">${esc(slides[0].label)}</span>${slides.length > 1 ? `<span class="pontos">${slides.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</span>` : ""}</div>`;
    }
    h += `<div class="peca-corpo">`;
    if (it.nota) h += `<p class="nota">${esc(it.nota)}</p>`;
    if (it.campos) h += `<dl class="campos">${it.campos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
    (it.textos || []).forEach(t => {
      h += `<details class="texto"><summary>${esc(t.resumo)}</summary>`;
      if (t.partes) h += `<div class="texto-in">${t.partes.map(p => `${p.rotulo ? `<p class="rotulo">${esc(p.rotulo)}</p>` : ""}<p>${esc(p.texto)}</p>`).join("")}</div>`;
      if (t.linhas) h += `<ol class="lista">${t.linhas.map(l => `<li>${link(l.texto, l.url)}</li>`).join("")}</ol>`;
      h += `</details>`;
    });
    if (it.pergunta) h += `<div class="pergunta"><p>${esc(it.pergunta)}</p><textarea class="campo resp" rows="2" placeholder="Sua resposta"></textarea></div>`;
    if (it.escolhas) {
      h += `<div class="escolhas">${it.escolhas.map((e, k) => `<div class="escolha"><span>${link(e.pergunta, e.url)}</span><span class="par" data-esc="${k}">${e.opcoes.map(o => `<button type="button" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</span></div>`).join("")}</div>`;
    }
    h += `<div class="decisao"><button class="b-ok" type="button" aria-pressed="false">Aprovado</button><button class="b-muda" type="button" aria-pressed="false">Quero mudar</button></div>
      <div class="obs-muda" hidden><textarea class="campo obs" rows="3" placeholder="O que você quer mudar?"></textarea></div>
    </div></article>`;
    return h;
  }

  // ---------- liga cada peça ----------
  document.querySelectorAll(".peca").forEach(el => {
    const id = el.dataset.id;
    const it = itens.find(x => x.id === id);
    const s = st(id);

    const trilho = $(".trilho", el);
    if (trilho) {
      const figs = trilho.children, pontos = el.querySelectorAll(".pontos i"), rot = $(".leg .rot", el);
      const ant = $(".seta.ant", el), prox = $(".seta.prox", el);
      let atual = 0;
      const marca = i => {
        atual = i;
        pontos.forEach((p, k) => p.classList.toggle("on", k === i));
        rot.textContent = it.slides[i].label;
        rot.classList.toggle("ia", !!it.slides[i].ia);
        if (ant) { ant.disabled = i === 0; prox.disabled = i === figs.length - 1; }
      };
      trilho.addEventListener("scroll", () => {
        const i = Math.round(trilho.scrollLeft / trilho.clientWidth);
        if (i !== atual) marca(i);
      }, { passive: true });
      const vai = i => trilho.scrollTo({ left: i * trilho.clientWidth, behavior: "smooth" });
      if (ant) { ant.onclick = () => vai(atual - 1); prox.onclick = () => vai(atual + 1); }
      trilho.addEventListener("click", e => { const f = e.target.closest("figure"); if (f) abreZoom(it, +f.dataset.i); });
    }

    const bOk = $(".b-ok", el), bMuda = $(".b-muda", el), caixa = $(".obs-muda", el), obs = $(".obs", el);
    const pinta = () => {
      bOk.setAttribute("aria-pressed", s.d === "ok");
      bMuda.setAttribute("aria-pressed", s.d === "muda");
      caixa.hidden = s.d !== "muda";
      el.classList.toggle("ok", s.d === "ok");
      el.classList.toggle("muda", s.d === "muda");
      $(".status", el).textContent = s.d === "ok" ? (it.aprovado && !s.mexeu ? `Aprovado em ${it.aprovado}` : "Aprovado") : s.d === "muda" ? "Quero mudar" : "";
    };
    bOk.onclick = () => { s.d = s.d === "ok" ? undefined : "ok"; s.mexeu = true; pinta(); muda(); };
    bMuda.onclick = () => { s.d = s.d === "muda" ? undefined : "muda"; s.mexeu = true; pinta(); muda(); if (s.d === "muda") obs.focus(); };
    obs.value = s.obs || "";
    obs.oninput = () => { s.obs = obs.value; salvar(); };

    const resp = $(".resp", el);
    if (resp) { resp.value = s.resp || ""; resp.oninput = () => { s.resp = resp.value; salvar(); }; }

    el.querySelectorAll("[data-esc]").forEach(par => {
      const k = par.dataset.esc;
      liga(par, () => (s.esc || {})[k], v => { s.esc = s.esc || {}; s.esc[k] = v; });
    });
    pinta();
  });

  function liga(par, ler, grava) {
    const pinta = () => par.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === ler()));
    par.querySelectorAll("button").forEach(b => b.onclick = () => { grava(ler() === b.dataset.v ? undefined : b.dataset.v); pinta(); salvar(); });
    pinta();
  }

  // ---------- barra, resumo e WhatsApp ----------
  const chips = $("#chips");
  chips.innerHTML = D.secoes.map(sec => `<a href="#${sec.id}" data-sec="${sec.id}">${esc(sec.nome)}<small></small></a>`).join("") + `<a class="enviar" href="#enviar">Enviar</a>`;

  function muda() { salvar(); atualiza(); }
  function atualiza() {
    const total = itens.length;
    const feitos = itens.filter(i => st(i.id).d).length;
    $("#prog-txt").textContent = `${feitos} de ${total} respondidas`;
    $("#prog-bar").style.width = `${(feitos / total) * 100}%`;
    D.secoes.forEach(sec => {
      const f = sec.itens.filter(i => st(i.id).d).length;
      const a = chips.querySelector(`[data-sec="${sec.id}"]`);
      a.querySelector("small").textContent = `${f}/${sec.itens.length}`;
      a.classList.toggle("completa", f === sec.itens.length);
    });
    const ok = itens.filter(i => st(i.id).d === "ok").length;
    const mu = itens.filter(i => st(i.id).d === "muda").length;
    $("#resumo").innerHTML = `<div class="r-ok"><strong>${ok}</strong><span>aprovadas</span></div><div class="r-muda"><strong>${mu}</strong><span>quero mudar</span></div><div><strong>${total - ok - mu}</strong><span>sem resposta</span></div>`;
    const faltam = itens.filter(i => !st(i.id).d);
    $("#faltam").innerHTML = faltam.length ? `<p>Faltam responder:</p>${faltam.map(i => `<a href="#peca-${i.id}">${esc(i.titulo)}</a>`).join("")}` : "";
  }

  function mensagem() {
    const linhas = [`*${D.marca} · aprovação do material (${D.data})*`];
    const ok = itens.filter(i => st(i.id).d === "ok").length, mu = itens.filter(i => st(i.id).d === "muda").length;
    linhas.push(`Aprovadas: ${ok} · Quero mudar: ${mu} · Sem resposta: ${itens.length - ok - mu}`);
    D.secoes.forEach(sec => {
      linhas.push("", `*${sec.titulo}*`);
      sec.itens.forEach(it => {
        const s = st(it.id);
        const nome = it.ordem ? `${it.titulo} (${[it.etiqueta, it.ordem].filter(Boolean).join(" ").toLowerCase()})` : it.titulo;
        const sinal = s.d === "ok" ? "✅" : s.d === "muda" ? "✏️" : "⬜";
        linhas.push(`${sinal} ${nome}${s.d ? "" : " · sem resposta"}`);
        if (s.d === "muda" && s.obs && s.obs.trim()) linhas.push(`   ↳ Mudar: ${s.obs.trim()}`);
        if (s.resp && s.resp.trim()) linhas.push(`   ↳ Resposta: ${s.resp.trim()}`);
        (it.escolhas || []).forEach((e, k) => { const v = (s.esc || {})[k]; if (v) linhas.push(`   ↳ ${e.pergunta.replace(/\?$/, "")}: ${v}`); });
      });
    });
    return linhas.join("\n");
  }

  $("#btn-zap").onclick = () => {
    window.open(`https://wa.me/${D.zap}?text=${encodeURIComponent(mensagem())}`, "_blank", "noopener");
  };

  // ---------- zoom ----------
  const zoom = $("#zoom"), zt = $("#zoom-trilho"), zl = $("#zoom-leg");
  let zItem = null;
  function abreZoom(it, i) {
    zItem = it;
    zt.innerHTML = it.slides.map(s => `<figure><img src="${s.src}" alt=""></figure>`).join("");
    zoom.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => { zt.scrollLeft = i * zt.clientWidth; legZoom(i); });
  }
  const legZoom = i => { zl.textContent = `${zItem.titulo} · ${zItem.slides[i].label}${zItem.slides.length > 1 ? ` (${i + 1}/${zItem.slides.length})` : ""}`; };
  zt.addEventListener("scroll", () => { if (zItem) legZoom(Math.min(zItem.slides.length - 1, Math.round(zt.scrollLeft / zt.clientWidth))); }, { passive: true });
  const fechaZoom = () => { zoom.hidden = true; zt.innerHTML = ""; zItem = null; document.body.style.overflow = ""; };
  $("#zoom-x").onclick = fechaZoom;
  document.addEventListener("keydown", e => {
    if (zoom.hidden) return;
    if (e.key === "Escape") fechaZoom();
    if (e.key === "ArrowRight") zt.scrollBy({ left: zt.clientWidth, behavior: "smooth" });
    if (e.key === "ArrowLeft") zt.scrollBy({ left: -zt.clientWidth, behavior: "smooth" });
  });

  salvar();
  atualiza();
})();
