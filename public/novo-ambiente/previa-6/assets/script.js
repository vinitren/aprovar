/* Novo Ambiente · página principal. Sem biblioteca. Tudo já aparece sem script;
   aqui só entram o menu que encolhe, a passada do rodo nas fotos e o comparador. */
(function () {
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;
  function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function sai(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- menu: transparente sobre a foto, sólido depois dela ---------- */
  var topo = document.querySelector('.topo');
  var entrada = document.querySelector('.entrada');
  if (temIO) {
    new IntersectionObserver(function (es) {
      topo.classList.toggle('solido', !es[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(entrada);
  } else {
    topo.classList.add('solido');
  }

  /* ---------- foto que se revela na passada do rodo ---------- */
  var revelas = document.querySelectorAll('.revela');
  if (temIO && !calmo) {
    var ver = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); ver.unobserve(e.target); }
      });
    }, { threshold: .2 });
    revelas.forEach(function (r) { ver.observe(r); });
  } else {
    revelas.forEach(function (r) { r.classList.add('vis'); });
  }

  /* ---------- serviços: passar o mouse ou focar troca a foto ao lado ---------- */
  var lista = document.querySelector('[data-servicos]');
  var fotos = document.querySelectorAll('.quadro img');
  var atual = 0;
  function trocar(i) {
    if (i === atual || !fotos[i]) return;
    var antes = fotos[atual], nova = fotos[i];
    atual = i;
    fotos.forEach(function (f) { if (f !== antes && f !== nova) f.classList.remove('vis', 'entra'); });
    if (calmo) { antes.classList.remove('vis', 'entra'); nova.classList.add('vis'); return; }
    antes.classList.remove('entra'); antes.classList.add('vis');
    nova.classList.remove('vis');
    void nova.offsetWidth;
    nova.classList.add('entra');
    nova.addEventListener('transitionend', function fim() {
      nova.removeEventListener('transitionend', fim);
      if (fotos[atual] !== nova) return;
      antes.classList.remove('vis');
      nova.classList.remove('entra'); nova.classList.add('vis');
    });
  }
  if (lista) {
    lista.querySelectorAll(':scope > li').forEach(function (li) {
      var i = Number(li.dataset.foto);
      li.addEventListener('pointerenter', function () { trocar(i); });
      li.addEventListener('focusin', function () { trocar(i); });
    });
    /* quem só rola a página também vê a foto de cada serviço */
    if (temIO) {
      var largo = window.matchMedia('(min-width: 62rem)');
      var itens = lista.querySelectorAll(':scope > li');
      var porRolagem = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          itens.forEach(function (li) { li.classList.toggle('ativo', li === e.target); });
          if (largo.matches) trocar(Number(e.target.dataset.foto));
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      itens.forEach(function (li) { porRolagem.observe(li); });
    }
  }

  /* ---------- antes e depois: abre sozinho ao chegar na tela ---------- */
  document.querySelectorAll('[data-ba]').forEach(function (ba) {
    var r = ba.querySelector('input');
    function por(v) { ba.style.setProperty('--pos', v + '%'); r.value = v; }
    var mexeu = false;
    r.addEventListener('input', function () { mexeu = true; por(r.value); });
    /* arrastar em qualquer ponto da imagem, com mouse ou dedo */
    function pelaPosicao(ev) {
      var q = ba.getBoundingClientRect();
      r.value = lim((ev.clientX - q.left) / q.width) * 100;
      r.dispatchEvent(new Event('input', { bubbles: true }));
    }
    var arrastando = false;
    ba.addEventListener('pointerdown', function (ev) { arrastando = true; ba.setPointerCapture(ev.pointerId); pelaPosicao(ev); });
    ba.addEventListener('pointermove', function (ev) { if (arrastando) pelaPosicao(ev); });
    ba.addEventListener('pointerup', function () { arrastando = false; });
    ba.addEventListener('pointercancel', function () { arrastando = false; });
    if (calmo || !temIO) { por(50); return; }
    por(92);
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now();
      (function anda(t) {
        if (mexeu) return;
        var k = lim((t - t0) / 1600);
        por(92 - 42 * sai(k));
        if (k < 1) requestAnimationFrame(anda);
      })(t0);
    }, { threshold: .4 });
    o.observe(ba);
  });

  /* ---------- barra do WhatsApp no celular: some quando já tem botão na tela ---------- */
  var barra = document.querySelector('.barra-wa');
  if (barra && temIO) {
    var vistos = new Set();
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); });
      barra.classList.toggle('vis', vistos.size === 0);
    });
    document.querySelectorAll('[data-esconde-barra]').forEach(function (a) { ob.observe(a); });
  }
})();
