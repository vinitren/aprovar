/* A página principal em prévia (12/11/2026): a troca da entrada (A, B, C), das seções (A, B, C) e da cor (1, 2, 3),
   a resposta pelo WhatsApp, o "já vi" das listas, o rodo do antes e depois (seções B) e as abas (seções C).
   Sem script a página aparece inteira, na entrada A, nas seções A e na cor 1. */
(function () {
  var html = document.documentElement;
  var cores = window.EB_CORES || [];
  var homes = window.EB_HOMES || [];
  var corpos = window.EB_CORPOS || [];
  var botoesCor = document.querySelectorAll('.eb-cor [data-cor]');
  var botoesHome = document.querySelectorAll('.eb-cor [data-home]');
  var botoesCorpo = document.querySelectorAll('.eb-cor [data-corpo]');
  var responder = document.querySelector('.eb-cor-responder');
  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function acha(lista, campo, v) { return lista.filter(function (x) { return String(x[campo]) === String(v); })[0]; }

  function resposta() {
    var c = acha(cores, 'n', html.dataset.paleta), h = acha(homes, 'id', html.dataset.home), s = acha(corpos, 'id', html.dataset.corpo);
    if (!responder || !c || !h || !s) return;
    var texto = '*Novo Ambiente · página principal*\nEntrada: ' + h.id.toUpperCase() + ' (' + h.nome + ')\nSeções: ' + s.id.toUpperCase() + ' (' + s.nome + ')\nCor: ' + c.n + ' (' + c.nome + ')\n\nO que mais queremos mudar:\n';
    responder.href = 'https://wa.me/' + responder.dataset.vinicius + '?text=' + encodeURIComponent(texto);
  }
  function marcar() {
    botoesCor.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cor === html.dataset.paleta ? 'true' : 'false'); });
    botoesHome.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.home === html.dataset.home ? 'true' : 'false'); });
    botoesCorpo.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.corpo === html.dataset.corpo ? 'true' : 'false'); });
    document.querySelectorAll('.eb-cor [data-mostra]').forEach(function (b) {
      var m = b.dataset.mostra;
      b.textContent = m === 'cor' ? html.dataset.paleta : (m === 'home' ? html.dataset.home : html.dataset.corpo).toUpperCase();
    });
    resposta();
  }
  var seletor = document.querySelector('.eb-cor'), abrir = document.querySelector('.eb-cor-abrir');
  if (abrir) {
    abrir.addEventListener('click', function (e) { e.stopPropagation(); seletor.classList.add('aberto'); abrir.setAttribute('aria-expanded', 'true'); });
    /* tocou fora, recolhe de novo */
    document.addEventListener('click', function (e) {
      if (!seletor.classList.contains('aberto') || seletor.contains(e.target)) return;
      seletor.classList.remove('aberto'); abrir.setAttribute('aria-expanded', 'false');
    });
  }

  /* cor: troca na hora */
  botoesCor.forEach(function (b) {
    b.addEventListener('click', function () { html.dataset.paleta = b.dataset.cor; guarda('na-cor', b.dataset.cor); marcar(); });
  });
  /* entrada e seções: recarregam no topo, porque a logo e a barra se medem pela entrada na abertura */
  function recarrega(campo, chave, valor) {
    if (valor === html.dataset[campo]) return;
    guarda(chave, valor);
    var u = new URL(location.href);
    u.searchParams.set('home', campo === 'home' ? valor : html.dataset.home);
    u.searchParams.set('corpo', campo === 'corpo' ? valor : html.dataset.corpo);
    u.searchParams.set('cor', html.dataset.paleta);
    u.hash = '';
    location.href = u.toString();
  }
  botoesHome.forEach(function (b) { b.addEventListener('click', function () { recarrega('home', 'na-home', b.dataset.home); }); });
  botoesCorpo.forEach(function (b) { b.addEventListener('click', function () { recarrega('corpo', 'na-corpo', b.dataset.corpo); }); });
  if (!html.dataset.paleta) html.dataset.paleta = '1';
  guarda('na-home', html.dataset.home);
  guarda('na-corpo', html.dataset.corpo);
  marcar();

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
