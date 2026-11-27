/* Novo Ambiente · página principal. Sem biblioteca. Tudo já aparece sem script;
   aqui só entram a logo que diminui, as fotos baixando antes e a barra do WhatsApp. */
(function () {
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;
  function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- logo: presa no canto, grande no topo, diminui até o tamanho do menu.
     Termina antes do título chegar nela, e o menu fica sólido nessa hora ---------- */
  var topo = document.querySelector('.topo');
  var marca = document.querySelector('.marca');
  var logo = marca && marca.querySelector('.marca-logo');
  /* 17/11: nas páginas de serviço a trilha (Início / Serviço) vem antes do título: a logo termina de diminuir antes dela */
  var titulo = document.querySelector('.entrada .sv-trilha') || document.querySelector('.entrada h1');
  if (calmo && temIO) {
    new IntersectionObserver(function (es) {
      topo.classList.toggle('solido', !es[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' }).observe(document.querySelector('.entrada'));
  } else if (calmo) {
    topo.classList.add('solido');
  }
  if (logo && titulo && !calmo) {
    var regua = document.createElement('span');
    regua.style.cssText = 'position:absolute;visibility:hidden;height:var(--logo-grande)';
    marca.appendChild(regua);
    var fator = 1, cursoLogo = 1, feito = -1, agendado = false;
    var posicionar = function () {
      agendado = false;
      var p = lim(window.scrollY / cursoLogo);
      if (p === feito) return;
      feito = p;
      logo.style.transform = p < 1 ? 'scale(' + (1 + (fator - 1) * p).toFixed(4) + ')' : '';
      topo.classList.toggle('solido', p >= 1);
    };
    var medir = function () {
      var menu = marca.offsetHeight, grande = regua.offsetHeight;
      var bordaTopo = marca.getBoundingClientRect().top;
      fator = menu / grande;
      /* offsetTop ignora a subida do título na abertura */
      cursoLogo = Math.max(grande - menu, titulo.offsetTop - bordaTopo - menu - 16);
      feito = -1;
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
  if (marca) marca.classList.add('pronta');

  /* ---------- fotos: baixam com folga, antes de chegar perto da tela. No celular é
     isso que garante a foto pronta quando a pessoa chega nela ---------- */
  if (temIO) {
    var adianta = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.loading = 'eager'; adianta.unobserve(e.target); }
      });
    }, { rootMargin: '200% 0px' });
    document.querySelectorAll('img[loading="lazy"]').forEach(function (i) { adianta.observe(i); });
  }

  /* ---------- antes e depois: as fotos ficam paradas. A medição só registra quando
     o par aparece inteiro na tela (o evento mantém o nome da prévia 6) ---------- */
  var ba = document.querySelector('[data-ba]');
  if (ba && temIO) {
    var viu = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      ba.dispatchEvent(new CustomEvent('limpou-metade', { bubbles: true }));
      viu.disconnect();
    }, { threshold: .6 });
    viu.observe(ba);
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

/* 27/11: menu do celular. O botão "Menu" abre a lista das páginas; fecha no X, no Esc, tocando fora
   ou quando a tela passa a ter o menu de computador */
(function () {
  var botao = document.querySelector('.menu-botao');
  var lista = document.getElementById('menu-celular');
  var topo = document.querySelector('.topo');
  if (!botao || !lista || !topo) return;
  function abrir(sim) {
    botao.setAttribute('aria-expanded', sim ? 'true' : 'false');
    botao.querySelector('span').textContent = sim ? 'Fechar' : 'Menu';
    lista.hidden = !sim;
    topo.classList.toggle('menu-aberto', sim);
  }
  botao.addEventListener('click', function () { abrir(lista.hidden); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lista.hidden) { abrir(false); botao.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!lista.hidden && !topo.contains(e.target)) abrir(false);
  });
  lista.addEventListener('click', function (e) { if (e.target.closest('a')) abrir(false); });
  window.matchMedia('(min-width: 62rem)').addEventListener('change', function (m) { if (m.matches) abrir(false); });
})();
