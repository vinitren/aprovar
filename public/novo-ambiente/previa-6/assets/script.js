/* Novo Ambiente · página principal. Sem biblioteca. Tudo já aparece sem script;
   aqui só entram a logo que sobe pro menu, a passada do rodo nas fotos e o comparador. */
(function () {
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;
  function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- logo: grande acima do título, sobe com a página e encaixa no menu.
     O menu fica sólido quando ela encaixa, pra nada passar por baixo dela ---------- */
  var topo = document.querySelector('.topo');
  var marca = document.querySelector('.marca');
  var lugarLogo = document.querySelector('.entrada-logo');
  if (calmo && temIO) {
    new IntersectionObserver(function (es) {
      topo.classList.toggle('solido', !es[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(document.querySelector('.entrada'));
  } else if (calmo) {
    topo.classList.add('solido');
  }
  if (marca) {
    if (lugarLogo && !calmo) {
      var ml = { x: 0, y: 0, s: 1 }, agendado = false;
      var posicionar = function () {
        agendado = false;
        var rolou = window.scrollY;
        var falta = ml.y > 0 ? 1 - lim(rolou / ml.y) : 0;
        marca.style.transform = 'translate(' + (ml.x * falta).toFixed(2) + 'px,' + Math.max(0, ml.y - rolou).toFixed(2) + 'px) scale(' + (1 + (ml.s - 1) * falta).toFixed(4) + ')';
        topo.classList.toggle('solido', rolou >= ml.y);
      };
      var medir = function () {
        marca.style.transform = 'none';
        var q = marca.getBoundingClientRect(), a = lugarLogo.getBoundingClientRect();
        ml = { x: a.left - q.left, y: a.top + window.scrollY - q.top, s: a.height / q.height };
        posicionar();
      };
      medir();
      window.addEventListener('scroll', function () {
        if (!agendado) { agendado = true; requestAnimationFrame(posicionar); }
      }, { passive: true });
      window.addEventListener('resize', medir);
      window.addEventListener('load', medir);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    }
    marca.classList.add('pronta');
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

  /* ---------- antes e depois: o vidro limpa conforme a página desce ---------- */
  var palco = document.querySelector('.ba-palco');
  var ba = palco && palco.querySelector('[data-ba]');
  if (ba && !calmo) {
    var agendadoBa = false, contou = false;
    var limpar = function () {
      agendadoBa = false;
      var q = palco.getBoundingClientRect();
      var topoBa = parseFloat(getComputedStyle(ba).top) || 0;
      var curso = q.height - ba.offsetHeight;
      /* um respiro no começo (vê o sujo) e outro no fim (vê o limpo) */
      var p = curso > 0 ? lim(((topoBa - q.top) / curso - .06) / .84) : 1;
      var pos = 100 - p * 100;
      ba.style.setProperty('--pos', pos.toFixed(2) + '%');
      ba.classList.toggle('sem-antes', pos < 14);
      ba.classList.toggle('sem-depois', pos > 86);
      if (!contou && p >= .5) {
        contou = true;
        ba.dispatchEvent(new CustomEvent('limpou-metade', { bubbles: true }));
      }
    };
    limpar();
    window.addEventListener('scroll', function () {
      if (!agendadoBa) { agendadoBa = true; requestAnimationFrame(limpar); }
    }, { passive: true });
    window.addEventListener('resize', limpar);
  }

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
