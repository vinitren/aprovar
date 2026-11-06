/* Medição do site. O que cada evento quer dizer está em MEDICAO.md.
   Os códigos ficam vazios até as contas existirem. Fora do domínio oficial nada
   vai pra ferramenta nenhuma: prévia não suja o dado do cliente. */
(function () {
  var CONFIG = {
    dominio: 'novoambienteservice.com.br',
    ga4: '',        // G-XXXXXXXXXX: Google Analytics
    clarity: '',    // código do projeto no Microsoft Clarity
    metaPixel: ''   // só se o cliente for anunciar no Meta (pergunta em aberto)
  };

  var url = new URL(location.href);
  var debug = url.searchParams.has('medicao');
  var noDominio = location.hostname === CONFIG.dominio || location.hostname === 'www.' + CONFIG.dominio;
  window.dataLayer = window.dataLayer || [];

  /* ---------- de onde a pessoa veio: guarda o primeiro toque da visita ---------- */
  function lerOrigem() {
    var campos = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    var o = {};
    campos.forEach(function (c) { var v = url.searchParams.get(c); if (v) o[c] = v; });
    if (url.searchParams.get('gclid')) o.clique_id = 'google-ads';
    if (url.searchParams.get('fbclid')) o.clique_id = 'meta';
    if (document.referrer && document.referrer.indexOf(location.hostname) === -1) {
      try { o.veio_de = new URL(document.referrer).hostname; } catch (e) {}
    }
    return o;
  }
  var origem = lerOrigem();
  try {
    var guardada = sessionStorage.getItem('na_origem');
    if (guardada) origem = JSON.parse(guardada);
    else sessionStorage.setItem('na_origem', JSON.stringify(origem));
  } catch (e) {}

  /* ---------- registrar: um lugar só pra todo evento ---------- */
  function registrar(nome, dados) {
    var d = Object.assign({ versao_entrada: document.documentElement.dataset.entrada || '' }, origem, dados || {});
    window.dataLayer.push(Object.assign({ event: nome }, d));
    if (window.gtag) window.gtag('event', nome, d);
    if (window.fbq && nome === 'clique_whatsapp') window.fbq('track', 'Contact');
    if (debug) console.log('[medicao]', nome, d);
  }
  window.naRegistrar = registrar;

  /* ---------- ferramentas: só no domínio oficial e com código preenchido ---------- */
  function carregar(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  if (noDominio && CONFIG.ga4) {
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.ga4);
    carregar('https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4);
  }
  if (noDominio && CONFIG.clarity) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    carregar('https://www.clarity.ms/tag/' + CONFIG.clarity);
  }
  if (noDominio && CONFIG.metaPixel) {
    window.fbq = window.fbq || function () { (window.fbq.q = window.fbq.q || []).push(arguments); };
    window.fbq('init', CONFIG.metaPixel);
    window.fbq('track', 'PageView');
    carregar('https://connect.facebook.net/en_US/fbevents.js');
  }

  /* ---------- contexto do clique: em que parte da página, qual serviço, qual público ---------- */
  function contexto(el) {
    var d = {};
    var loc = el.closest('[data-local]'); if (loc) d.local = loc.dataset.local;
    var srv = el.closest('[data-servico]'); if (srv) d.servico = srv.dataset.servico;
    var pub = el.closest('[data-publico]'); if (pub) d.publico = pub.dataset.publico;
    return d;
  }

  /* ---------- a origem vai junto na mensagem, pra aparecer na conversa ---------- */
  function comOrigem(a) {
    var fonte = origem.clique_id || origem.utm_source;
    if (!fonte || a.dataset.origemOk) return;
    try {
      var u = new URL(a.href);
      var texto = u.searchParams.get('text');
      if (!texto) return;
      var novo = texto + ' (origem: ' + fonte + (origem.utm_campaign ? ' / ' + origem.utm_campaign : '') + ')';
      a.href = u.origin + u.pathname + '?text=' + encodeURIComponent(novo);
      a.dataset.origemOk = '1';
    } catch (e) {}
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    var d = contexto(a);
    d.texto_link = (a.textContent || '').trim().slice(0, 60);
    if (/wa\.me|whatsapp\.com/.test(h)) { comOrigem(a); registrar('clique_whatsapp', d); }
    else if (h.indexOf('tel:') === 0) registrar('clique_telefone', d);
    else if (h.indexOf('mailto:') === 0) registrar('clique_email', d);
    else if (/google\.[^/]+\/maps/.test(h)) registrar('clique_endereco', d);
    else if (/instagram\.com/.test(h)) registrar('clique_instagram', d);
    else if (h.charAt(0) === '#') registrar('clique_menu', { destino: h, local: d.local });
  });

  /* ---------- quanto a pessoa rolou ---------- */
  var marcas = [25, 50, 75, 100], feitas = {};
  function rolou() {
    var alt = document.documentElement.scrollHeight - innerHeight;
    if (alt <= 0) return;
    var p = (scrollY / alt) * 100;
    marcas.forEach(function (m) { if (p >= m - .5 && !feitas[m]) { feitas[m] = 1; registrar('rolagem', { porcentagem: m }); } });
  }
  addEventListener('scroll', rolou, { passive: true });

  /* ---------- o que a pessoa viu e usou ---------- */
  if ('IntersectionObserver' in window) {
    var secoes = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { secoes.unobserve(e.target); registrar('secao_vista', { secao: e.target.dataset.secao }); }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('[data-secao]').forEach(function (s) { secoes.observe(s); });
  }
  document.querySelectorAll('.faq details').forEach(function (det) {
    det.addEventListener('toggle', function () {
      if (det.open) registrar('pergunta_aberta', { pergunta: det.querySelector('summary').textContent.trim() });
    });
  });
  var ba = document.querySelector('[data-ba] input');
  if (ba) ba.addEventListener('input', function usou() {
    ba.removeEventListener('input', usou);
    registrar('antes_depois_usado', {});
  });
  var vistos = {};
  document.querySelectorAll('.lista > li').forEach(function (li) {
    function viu() {
      var s = li.dataset.servico;
      if (!vistos[s]) { vistos[s] = 1; registrar('servico_visto', { servico: s }); }
    }
    li.addEventListener('pointerenter', viu);
    li.addEventListener('focusin', viu);
  });
})();
