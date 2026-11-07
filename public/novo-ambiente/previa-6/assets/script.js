/* Novo Ambiente · página principal. Sem biblioteca. Tudo já aparece sem script;
   aqui só entram a logo que diminui, a passada do rodo no computador e o comparador. */
(function () {
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;
  function lim(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- logo: presa no canto, grande no topo, diminui até o tamanho do menu.
     Termina antes do título chegar nela, e o menu fica sólido nessa hora ---------- */
  var topo = document.querySelector('.topo');
  var marca = document.querySelector('.marca');
  var logo = marca && marca.querySelector('.marca-logo');
  var titulo = document.querySelector('.entrada h1');
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

  /* ---------- faixa no computador: a passada do rodo começa com a foto já pronta ---------- */
  var revelas = document.querySelectorAll('.revela');
  var revelar = function (r) {
    var i = r.querySelector('img');
    var vai = function () { r.classList.add('vis'); };
    if (i && i.decode) { i.loading = 'eager'; i.decode().then(vai, vai); } else vai();
  };
  if (temIO && !calmo && window.matchMedia('(min-width: 62rem)').matches) {
    var ver = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { revelar(e.target); ver.unobserve(e.target); }
      });
    }, { threshold: .1 });
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
    var janela = ba.querySelector('.ba-janela'), fotoLimpa = ba.querySelector('.depois');
    var contou = false, baAlvo = 0, baAtual = 0, baLoop = 0, baAntes = 0;
    var palcoTopo = 0, baCurso = 0, baTopo = 0;
    /* as medidas ficam guardadas: ler o layout a cada giro é o que pesa na rolagem */
    var baRegua = function () {
      palcoTopo = palco.getBoundingClientRect().top + window.scrollY;
      baTopo = parseFloat(getComputedStyle(ba).top) || 0;
      baCurso = palco.offsetHeight - ba.offsetHeight;
    };
    var baMedir = function () {
      /* um respiro no começo (vê o sujo) e outro no fim (vê o limpo) */
      baAlvo = baCurso > 0 ? lim(((baTopo - palcoTopo + window.scrollY) / baCurso - .06) / .84) : 1;
    };
    var baPintar = function () {
      /* a borda da máscara sai toda pela direita em 12% e toda pela esquerda em 88% */
      var p = .12 + baAtual * .76;
      janela.style.transform = 'translate3d(' + (p * -66.6667).toFixed(3) + '%,0,0)';
      fotoLimpa.style.transform = 'translate3d(' + (p * 200).toFixed(3) + '%,0,0)';
      ba.classList.toggle('sem-antes', baAtual > .85);
      ba.classList.toggle('sem-depois', baAtual < .15);
      if (!contou && baAtual >= .5) {
        contou = true;
        ba.dispatchEvent(new CustomEvent('limpou-metade', { bubbles: true }));
      }
    };
    /* a limpeza persegue a rolagem com inércia: desliza entre um giro e outro da roda do mouse */
    var baAndar = function (t) {
      var dt = Math.min(t - baAntes, 50);
      baAntes = t;
      baAtual += (baAlvo - baAtual) * (1 - Math.exp(-dt / 170));
      if (Math.abs(baAlvo - baAtual) < .0006) baAtual = baAlvo;
      baPintar();
      baLoop = baAtual === baAlvo ? 0 : requestAnimationFrame(baAndar);
    };
    var baMexeu = function () {
      baMedir();
      if (!baLoop && baAtual !== baAlvo) { baAntes = performance.now(); baLoop = requestAnimationFrame(baAndar); }
    };
    var baRefazer = function () { baRegua(); baMexeu(); };
    baRegua();
    baMedir();
    baAtual = baAlvo;
    baPintar();
    window.addEventListener('scroll', baMexeu, { passive: true });
    window.addEventListener('resize', baRefazer);
    window.addEventListener('load', baRefazer);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(baRefazer);
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
