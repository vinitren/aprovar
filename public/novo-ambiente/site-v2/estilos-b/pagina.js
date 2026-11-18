/* A página principal em prévia (12/11/2026): a troca da entrada (A, B, C), das seções (A, B, C) e da cor (1, 2, 3),
   a resposta pelo WhatsApp, o "já vi" das listas, o rodo do antes e depois (seções B) e as abas (seções C).
   Sem script a página aparece inteira, na entrada A, nas seções A e na cor 1. */
(function () {
  var html = document.documentElement;
  var cores = window.EB_CORES || [];
  var homes = window.EB_HOMES || [];
  var corpos = window.EB_CORPOS || [];
  /* a escolha em passos (13/11): uma pergunta por vez (entrada, cor, meio da página) e o resumo com o botão do WhatsApp.
     Antes eram as três escolhas juntas num seletor; no celular ficou poluído e fácil de se perder. */
  var guia = document.querySelector('.eb-guia');
  var botoesCor = document.querySelectorAll('.eb-guia [data-cor]');
  var botoesHome = document.querySelectorAll('.eb-guia [data-home]');
  var botoesCorpo = document.querySelectorAll('.eb-guia [data-corpo]');
  var mandar = document.querySelector('.eb-guia-mandar');
  var TOTAL = 3;
  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function acha(lista, campo, v) { return lista.filter(function (x) { return String(x[campo]) === String(v); })[0]; }
  var q = new URLSearchParams(location.search);
  var passo = parseInt(q.get('passo'), 10);
  if (!(passo >= 1 && passo <= TOTAL + 1)) passo = 1;

  function nomes() {
    var c = acha(cores, 'n', html.dataset.paleta), h = acha(homes, 'id', html.dataset.home), s = acha(corpos, 'id', html.dataset.corpo);
    return { cor: c ? c.nome : '', home: h ? h.nome : '', corpo: s ? s.nome : '' };
  }
  function resposta() {
    var n = nomes();
    if (!mandar) return;
    var texto = '*Novo Ambiente · página principal*\nEntrada: ' + n.home + '\nCor: ' + n.cor + '\nMeio da página: ' + n.corpo + '\n\nO que mais queremos mudar:\n';
    mandar.href = 'https://wa.me/' + mandar.dataset.vinicius + '?text=' + encodeURIComponent(texto);
  }
  /* o passo vai no endereço, porque trocar a entrada ou o meio da página recarrega */
  function endereco(extra) {
    var u = new URL(location.href);
    u.searchParams.set('home', html.dataset.home);
    u.searchParams.set('corpo', html.dataset.corpo);
    u.searchParams.set('cor', html.dataset.paleta);
    u.searchParams.set('passo', passo);
    Object.keys(extra || {}).forEach(function (k) { u.searchParams.set(k, extra[k]); });
    u.hash = '';
    return u;
  }
  function mostra() {
    if (!guia) return;
    guia.dataset.passo = passo;
    guia.querySelectorAll('.eb-guia-etapa').forEach(function (e) { e.hidden = String(passo) !== e.dataset.passo; });
    guia.querySelectorAll('[data-guia-num]').forEach(function (e) { e.textContent = passo > TOTAL ? 'Pronto' : passo + ' de ' + TOTAL; });
    botoesCor.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cor === html.dataset.paleta ? 'true' : 'false'); });
    botoesHome.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.home === html.dataset.home ? 'true' : 'false'); });
    botoesCorpo.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.corpo === html.dataset.corpo ? 'true' : 'false'); });
    var n = nomes();
    guia.querySelectorAll('[data-mostra]').forEach(function (b) { b.textContent = n[b.dataset.mostra]; });
    guia.querySelector('.eb-guia-voltar').textContent = passo > TOTAL ? 'Mudar' : 'Voltar';
    guia.querySelector('.eb-guia-proximo').textContent = passo === TOTAL ? 'Ver como ficou' : 'Próximo';
    history.replaceState(null, '', endereco().toString());
    resposta();
  }
  function vai(p) {
    passo = p;
    mostra();
    /* no passo do meio da página, desce até ele; no da entrada, volta pro topo */
    if (p === 1) window.scrollTo({ top: 0, behavior: 'smooth' });
    if (p === 3) { var c = document.querySelector('.eb-corpo'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  if (guia) {
    guia.hidden = false;
    var abrir = guia.querySelector('.eb-guia-abrir');
    var abre = function (sim) { guia.classList.toggle('escondido', !sim); abrir.setAttribute('aria-expanded', sim ? 'true' : 'false'); };
    abrir.addEventListener('click', function () { abre(true); });
    guia.querySelector('.eb-guia-esconder').addEventListener('click', function () { abre(false); });
    guia.querySelector('.eb-guia-proximo').addEventListener('click', function () { vai(Math.min(passo + 1, TOTAL + 1)); });
    guia.querySelector('.eb-guia-voltar').addEventListener('click', function () { vai(passo > TOTAL ? 1 : Math.max(passo - 1, 1)); });
  }

  /* cor: troca na hora */
  botoesCor.forEach(function (b) {
    b.addEventListener('click', function () { html.dataset.paleta = b.dataset.cor; guarda('na-cor', b.dataset.cor); mostra(); });
  });
  /* entrada e meio da página: recarregam, porque a logo e a barra se medem pela entrada na abertura */
  function recarrega(campo, chave, valor) {
    if (valor === html.dataset[campo]) return;
    guarda(chave, valor);
    var extra = {}; extra[campo] = valor;
    if (campo === 'corpo') extra.ver = 'meio';
    location.href = endereco(extra).toString();
  }
  botoesHome.forEach(function (b) { b.addEventListener('click', function () { recarrega('home', 'na-home', b.dataset.home); }); });
  botoesCorpo.forEach(function (b) { b.addEventListener('click', function () { recarrega('corpo', 'na-corpo', b.dataset.corpo); }); });
  if (!html.dataset.paleta) html.dataset.paleta = '1';
  guarda('na-home', html.dataset.home);
  guarda('na-corpo', html.dataset.corpo);
  mostra();
  /* trocou o meio da página: volta direto pra ele, não pro topo */
  if (q.get('ver') === 'meio') {
    var u0 = endereco(); u0.searchParams.delete('ver'); history.replaceState(null, '', u0.toString());
    var c0 = document.querySelector('.eb-corpo'); if (c0) c0.scrollIntoView({ block: 'start' });
  }

  /* seções B: o rodo do antes e depois acompanha o dedo */
  document.querySelectorAll('.f-comparar').forEach(function (c) {
    var r = c.querySelector('input');
    if (!r) return;
    var poe = function () { c.style.setProperty('--pos', r.value + '%'); c.classList.add('mexeu'); };
    r.addEventListener('input', poe);
  });

  /* seções C: um serviço por vez. Link do menu ou da entrada (#fachada, #piso...) abre a aba certa */
  var abas = document.querySelector('.g-abas');
  if (abas) {
    var botoes = abas.querySelectorAll('.g-aba'), paineis = abas.querySelectorAll('.g-painel');
    var menu = abas.querySelector('.g-menu');
    menu.setAttribute('role', 'tablist');
    botoes.forEach(function (b) { b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', b.dataset.aba); });
    paineis.forEach(function (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('tabindex', '-1'); });
    var ativa = function (id, foco) {
      botoes.forEach(function (b) {
        var sim = b.dataset.aba === id;
        b.setAttribute('aria-selected', sim ? 'true' : 'false');
        b.setAttribute('tabindex', sim ? '0' : '-1');
        if (sim && menu.scrollWidth > menu.clientWidth) menu.scrollTo({ left: b.offsetLeft - menu.offsetLeft - 20, behavior: 'smooth' });
        if (sim && foco) b.focus();
      });
      paineis.forEach(function (p) { p.classList.toggle('ativa', p.id === id); });
    };
    abas.classList.add('pronta');
    ativa(paineis[0].id);
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('.g-aba');
      if (!b) return;
      e.preventDefault();
      ativa(b.dataset.aba);
    });
    menu.addEventListener('keydown', function (e) {
      var lista = Array.prototype.slice.call(botoes), i = lista.indexOf(document.activeElement);
      if (i < 0) return;
      var n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!n) return;
      e.preventDefault();
      ativa(lista[(i + n + lista.length) % lista.length].dataset.aba, true);
    });
    /* quem vem do menu do topo ou da entrada: abre a aba e desce até as abas */
    var ids = Array.prototype.map.call(paineis, function (p) { return p.id; });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.closest('.g-menu')) return;
      var id = a.getAttribute('href').slice(1);
      if (ids.indexOf(id) < 0) return;
      e.preventDefault();
      ativa(id);
      abas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (ids.indexOf(location.hash.slice(1)) >= 0) ativa(location.hash.slice(1));
  }

  /* seções C: antes e depois num botão */
  document.querySelectorAll('.g-par').forEach(function (s) {
    var fotos = s.querySelector('.g-fotos');
    s.querySelectorAll('.g-troca button').forEach(function (b) {
      b.addEventListener('click', function () {
        fotos.dataset.ver = b.dataset.ver;
        s.querySelectorAll('.g-troca button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
  });

  /* listas que se desenham quando aparecem: uma vez só */
  var alvos = document.querySelectorAll('[data-anima]');
  if (!('IntersectionObserver' in window)) { alvos.forEach(function (a) { a.classList.add('visto'); }); return; }
  var ob = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); ob.unobserve(e.target); } });
  }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
  alvos.forEach(function (a) { ob.observe(a); });
})();
