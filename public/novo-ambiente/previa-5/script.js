/* Novo Ambiente · página principal
   Entrada: a marca grande no centro sobe pro menu, o título assenta e a cena
   troca pra vitrine, tudo guiado pela rolagem. Sem biblioteca. Sem script ou com
   "reduzir movimento", a entrada aparece pronta numa tela só. */
(function () {
  var raiz = document.documentElement;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conexao = navigator.connection || {};
  var economia = conexao.saveData || /2g/.test(conexao.effectiveType || '');

  var entrada = document.querySelector('.entrada');
  var palco = entrada.querySelector('.palco');
  var topo = document.querySelector('.topo');
  var grande = entrada.querySelector('.marca-centro img');
  var pequena = topo.querySelector('.marca-topo img');

  function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function trecho(p, a, b) { return lim((p - a) / (b - a)); }
  function sai(t) { return 1 - Math.pow(1 - t, 3); }
  function vaiVem(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- a segunda cena só carrega depois da primeira ---------- */
  function carregarCena2() {
    if (economia) return;
    var c2 = entrada.querySelector('.cena-2');
    c2.querySelectorAll('[data-srcset]').forEach(function (s) { s.srcset = s.dataset.srcset; });
    var im = c2.querySelector('img');
    im.srcset = im.dataset.srcset; im.src = im.dataset.src;
  }

  if (calmo) {
    raiz.classList.add('estatico');
  } else {
    if (document.readyState === 'complete') carregarCena2();
    else window.addEventListener('load', carregarCena2);

    /* quanto a marca grande anda e encolhe pra cair em cima da do menu */
    var alvo = { x: 0, y: 0, s: .2 };
    function medir() {
      grande.style.transform = 'none';
      var g = grande.getBoundingClientRect(), m = pequena.getBoundingClientRect();
      // a do menu é a mesma marca sem a linha de baixo (85% da altura da grande)
      alvo.s = m.width / g.width;
      var dy = -0.0748 * g.height;
      alvo.x = (m.left + m.width / 2) - (g.left + g.width / 2);
      alvo.y = (m.top + m.height / 2) - (g.top + g.height / 2) - dy * alvo.s;
    }

    var pedido = false;
    function quadro() {
      pedido = false;
      var total = entrada.offsetHeight - window.innerHeight;
      var p = lim((window.scrollY - entrada.offsetTop) / total);

      var tm = vaiVem(trecho(p, 0, .34));
      grande.style.transform = 'translate(' + (alvo.x * tm) + 'px,' + (alvo.y * tm) + 'px) scale(' + (1 + (alvo.s - 1) * tm) + ')';
      grande.style.opacity = tm > .985 ? 0 : 1;
      raiz.classList.toggle('no-menu', tm > .985);

      var s = palco.style;
      s.setProperty('--t-marca', tm.toFixed(4));
      s.setProperty('--t-zoom', sai(trecho(p, 0, .5)).toFixed(4));
      s.setProperty('--t-chega', sai(trecho(p, .26, .42)).toFixed(4));
      s.setProperty('--t-chega2', sai(trecho(p, .3, .46)).toFixed(4));
      s.setProperty('--t-chega3', sai(trecho(p, .34, .5)).toFixed(4));
      s.setProperty('--t-troca', economia ? 0 : vaiVem(trecho(p, .58, .86)).toFixed(4));

      topo.classList.toggle('solido', window.scrollY > entrada.offsetTop + entrada.offsetHeight - topo.offsetHeight - 2);
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }

    medir(); quadro();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', function () { medir(); pedir(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { medir(); pedir(); });
  }

  if (calmo) {
    window.addEventListener('scroll', function () {
      topo.classList.toggle('solido', window.scrollY > entrada.offsetTop + entrada.offsetHeight - topo.offsetHeight - 2);
    }, { passive: true });
  }

  /* ---------- serviços: a imagem ao lado troca com o serviço que está na tela ---------- */
  var lista = document.querySelector('[data-servicos]');
  var fotos = document.querySelectorAll('.quadro img');
  if (lista && 'IntersectionObserver' in window) {
    var itens = lista.querySelectorAll(':scope > li');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        itens.forEach(function (li) { li.classList.toggle('ativo', li === e.target); });
        var i = e.target.dataset.foto;
        fotos.forEach(function (f, k) { f.classList.toggle('vis', String(k) === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    itens.forEach(function (li) { io.observe(li); });
    itens[0].classList.add('ativo');
  }

  /* ---------- antes e depois: abre sozinho ao chegar na tela ---------- */
  document.querySelectorAll('[data-ba]').forEach(function (ba) {
    var r = ba.querySelector('input');
    function por(v) { ba.style.setProperty('--pos', v + '%'); r.value = v; }
    r.addEventListener('input', function () { por(r.value); });
    if (calmo || !('IntersectionObserver' in window)) { por(50); return; }
    por(92);
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now();
      (function anda(t) {
        var k = lim((t - t0) / 1600);
        por(92 - 42 * sai(k));
        if (k < 1) requestAnimationFrame(anda);
      })(t0);
    }, { threshold: .45 });
    o.observe(ba);
  });

  /* ---------- barra do WhatsApp no celular ---------- */
  var barra = document.querySelector('.barra-wa');
  if (barra && 'IntersectionObserver' in window) {
    var vistos = new Set();
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); });
      barra.classList.toggle('vis', vistos.size === 0);
    });
    document.querySelectorAll('[data-esconde-barra], .entrada').forEach(function (a) { ob.observe(a); });
  }
})();
