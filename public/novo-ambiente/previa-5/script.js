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

  var c1 = entrada.querySelector('.cena-1');
  var c2 = entrada.querySelector('.cena-2');
  var veuCentro = entrada.querySelector('.veu-centro');
  var veuTroca = entrada.querySelector('.veu-troca');
  var veuTexto = entrada.querySelector('.veu-texto');
  var linha = entrada.querySelector('.linha-marca');
  var rolar = entrada.querySelector('.rolar');
  var chegam = entrada.querySelectorAll('.chegada .wrap > *');

  /* medidas lidas uma vez (e de novo ao redimensionar), nunca no meio da animação */
  var m = { ini: 0, total: 1, fimTopo: 0 };
  function medirPagina() {
    m.ini = entrada.offsetTop;
    m.total = Math.max(1, entrada.offsetHeight - window.innerHeight);
    m.fimTopo = m.ini + entrada.offsetHeight - topo.offsetHeight - 2;
  }
  var solido = null;
  function topoSolido() {
    var s = window.scrollY > m.fimTopo;
    if (s !== solido) { solido = s; topo.classList.toggle('solido', s); }
  }

  if (calmo) {
    raiz.classList.add('estatico');
    medirPagina(); topoSolido();
    window.addEventListener('scroll', topoSolido, { passive: true });
    window.addEventListener('resize', function () { medirPagina(); topoSolido(); });
  } else {
    if (document.readyState === 'complete') carregarCena2();
    else window.addEventListener('load', carregarCena2);

    /* quanto a marca grande anda e encolhe pra cair em cima da do menu */
    var alvo = { x: 0, y: 0, s: .2 };
    function medirMarca() {
      grande.style.transform = 'none';
      var g = grande.getBoundingClientRect(), p = pequena.getBoundingClientRect();
      // a do menu é a mesma marca sem a linha de baixo (85% da altura da grande)
      alvo.s = p.width / g.width;
      var dy = -0.0748 * g.height;
      alvo.x = (p.left + p.width / 2) - (g.left + g.width / 2);
      alvo.y = (p.top + p.height / 2) - (g.top + g.height / 2) - dy * alvo.s;
    }

    var noMenu = null;
    function aplicar(p) {
      var tm = vaiVem(trecho(p, 0, .34));
      var sc = 1 + (alvo.s - 1) * tm;
      grande.style.transform = 'translate3d(' + (alvo.x * tm).toFixed(2) + 'px,' + (alvo.y * tm).toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
      var nm = tm > .985;
      grande.style.opacity = nm ? 0 : 1;
      if (nm !== noMenu) { noMenu = nm; raiz.classList.toggle('no-menu', nm); }
      linha.style.opacity = lim(1 - 2.5 * tm);
      rolar.style.opacity = lim(1 - 4 * tm);
      veuCentro.style.opacity = 1 - tm;

      c1.style.transform = 'scale(' + (1.08 - .08 * sai(trecho(p, 0, .5))).toFixed(4) + ')';

      var ch = [sai(trecho(p, .26, .42)), sai(trecho(p, .3, .46)), sai(trecho(p, .34, .5))];
      for (var i = 0; i < chegam.length; i++) {
        var t = ch[Math.min(i, 2)];
        chegam[i].style.opacity = t;
        chegam[i].style.transform = 'translate3d(0,' + (28 * (1 - t)).toFixed(2) + 'px,0)';
      }
      veuTexto.style.opacity = ch[0];

      var tt = economia ? 0 : vaiVem(trecho(p, .58, .86));
      c2.style.opacity = tt;
      c2.style.transform = 'scale(' + (1.06 - .06 * tt).toFixed(4) + ')';
      veuTroca.style.opacity = tt;
    }

    /* suavizador: a animação vai atrás da rolagem em vez de pular junto com
       a roda do mouse (que no Windows anda de 100 em 100 px) */
    var toque = window.matchMedia('(pointer: coarse)').matches;
    var forca = toque ? .24 : .12;
    var alvoP = 0, atual = 0, ultimo = 0, rodando = false;
    function lerAlvo() { alvoP = lim((window.scrollY - m.ini) / m.total); }
    function passo(t) {
      var dt = ultimo ? Math.min(64, t - ultimo) : 16.667;
      ultimo = t;
      atual += (alvoP - atual) * (1 - Math.pow(1 - forca, dt / 16.667));
      if (Math.abs(alvoP - atual) < .0003) atual = alvoP;
      aplicar(atual);
      if (atual !== alvoP) requestAnimationFrame(passo);
      else { rodando = false; ultimo = 0; }
    }
    function rolou() {
      topoSolido();
      lerAlvo();
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }

    function preparar() { medirPagina(); medirMarca(); lerAlvo(); atual = alvoP; aplicar(atual); topoSolido(); }
    preparar();
    window.addEventListener('scroll', rolou, { passive: true });
    window.addEventListener('resize', preparar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(preparar);
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
