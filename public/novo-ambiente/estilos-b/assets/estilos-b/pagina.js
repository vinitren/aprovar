/* A B escolhida (12/11/2026): a troca das 3 cores, a resposta pelo WhatsApp e o "já vi" das listas.
   Sem script a página aparece inteira, na cor 1. */
(function () {
  var html = document.documentElement;
  var cores = window.EB_CORES || [];
  var botoes = document.querySelectorAll('.eb-cor [data-cor]');
  var responder = document.querySelector('.eb-cor-responder');
  var nome = document.querySelector('.eb-cor-nome');

  function aplicar(n) {
    html.dataset.paleta = n;
    botoes.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cor === String(n) ? 'true' : 'false'); });
    var c = cores.filter(function (x) { return String(x.n) === String(n); })[0];
    if (nome && c) nome.textContent = ' a ' + c.n;
    if (responder && c) {
      var texto = '*Novo Ambiente · cor do site*\nEscolhemos a cor ' + c.n + ' (' + c.nome + ').\n\nO que mais queremos mudar:\n';
      responder.href = 'https://wa.me/' + responder.dataset.vinicius + '?text=' + encodeURIComponent(texto);
    }
    try { localStorage.setItem('na-cor', String(n)); } catch (e) {}
  }
  botoes.forEach(function (b) { b.addEventListener('click', function () { aplicar(b.dataset.cor); }); });
  aplicar(html.dataset.paleta || '1');

  /* listas que se desenham quando aparecem: uma vez só */
  var alvos = document.querySelectorAll('[data-anima]');
  if (!('IntersectionObserver' in window)) { alvos.forEach(function (a) { a.classList.add('visto'); }); return; }
  var ob = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); ob.unobserve(e.target); } });
  }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
  alvos.forEach(function (a) { ob.observe(a); });
})();
