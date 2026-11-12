/* A página principal em prévia (12/11/2026): a troca da entrada (A, B, C) e da cor (1, 2, 3), a resposta
   pelo WhatsApp e o "já vi" das listas. Sem script a página aparece inteira, na entrada A e na cor 1. */
(function () {
  var html = document.documentElement;
  var cores = window.EB_CORES || [];
  var homes = window.EB_HOMES || [];
  var botoesCor = document.querySelectorAll('.eb-cor [data-cor]');
  var botoesHome = document.querySelectorAll('.eb-cor [data-home]');
  var responder = document.querySelector('.eb-cor-responder');
  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function acha(lista, campo, v) { return lista.filter(function (x) { return String(x[campo]) === String(v); })[0]; }

  function resposta() {
    var c = acha(cores, 'n', html.dataset.paleta), h = acha(homes, 'id', html.dataset.home);
    if (!responder || !c || !h) return;
    var texto = '*Novo Ambiente · página principal*\nEntrada: ' + h.id.toUpperCase() + ' (' + h.nome + ')\nCor: ' + c.n + ' (' + c.nome + ')\n\nO que mais queremos mudar:\n';
    responder.href = 'https://wa.me/' + responder.dataset.vinicius + '?text=' + encodeURIComponent(texto);
  }
  function marcar() {
    botoesCor.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cor === html.dataset.paleta ? 'true' : 'false'); });
    botoesHome.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.home === html.dataset.home ? 'true' : 'false'); });
    document.querySelectorAll('.eb-cor [data-mostra]').forEach(function (b) { b.textContent = b.dataset.mostra === 'home' ? html.dataset.home.toUpperCase() : html.dataset.paleta; });
    resposta();
  }
  var seletor = document.querySelector('.eb-cor'), abrir = document.querySelector('.eb-cor-abrir');
  if (abrir) abrir.addEventListener('click', function () { seletor.classList.add('aberto'); abrir.setAttribute('aria-expanded', 'true'); });

  /* cor: troca na hora */
  botoesCor.forEach(function (b) {
    b.addEventListener('click', function () { html.dataset.paleta = b.dataset.cor; guarda('na-cor', b.dataset.cor); marcar(); });
  });
  /* entrada: recarrega no topo, porque a logo e a barra se medem pela entrada na abertura */
  botoesHome.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.home === html.dataset.home) return;
      guarda('na-home', b.dataset.home);
      var u = new URL(location.href);
      u.searchParams.set('home', b.dataset.home);
      u.searchParams.set('cor', html.dataset.paleta);
      u.hash = '';
      location.href = u.toString();
    });
  });
  if (!html.dataset.paleta) html.dataset.paleta = '1';
  guarda('na-home', html.dataset.home);
  marcar();

  /* listas que se desenham quando aparecem: uma vez só */
  var alvos = document.querySelectorAll('[data-anima]');
  if (!('IntersectionObserver' in window)) { alvos.forEach(function (a) { a.classList.add('visto'); }); return; }
  var ob = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); ob.unobserve(e.target); } });
  }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
  alvos.forEach(function (a) { ob.observe(a); });
})();
