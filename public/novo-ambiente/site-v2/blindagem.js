/* Dificulta copiar o conteúdo: sem seleção, sem menu do botão direito ou do toque longo,
   sem arrastar imagem e sem os atalhos de copiar, salvar, imprimir e ver o código.
   O visual e os links seguem iguais. A parte de seleção e impressão está no estilo.css. */
(function () {
  function barra(e) { e.preventDefault(); }
  ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (t) {
    document.addEventListener(t, barra);
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var cmd = e.ctrlKey || e.metaKey;
    var ferramentas = cmd && (e.shiftKey || e.altKey) && (k === 'i' || k === 'j' || k === 'c' || k === 'u');
    if (k === 'f12' || ferramentas || (cmd && k.length === 1 && 'acxsup'.indexOf(k) > -1)) e.preventDefault();
  });
})();
