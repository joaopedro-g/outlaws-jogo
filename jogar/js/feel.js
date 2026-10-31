/* Additive OUTLAWS feel loader. One script tag, shared by game and landing. */
(function () {
  'use strict';
  if (window.__outlawsFeelLoading) return;
  window.__outlawsFeelLoading = true;
  const base = new URL('.', document.currentScript.src);
  function load(name) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = new URL(name, base).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  load('sfx.js').then(function () { return load('juice.js'); }).then(function () {
    if (!document.querySelector('#heist-map')) return;
    return load('equipped-adapter.js').then(function () {
    return load('arsenal-sfx.js').then(function () { return load('crusade.js'); }).then(function () {
      return load('eras.js');
    }).then(function () { return load('equipped-sfx.js'); }).then(function () {
      return load('equipped-weapons.js');
    });
    });
  }).then(function () { return load('clarity.js'); }).then(function () {
    if (document.querySelector('#heist-map')) return load('ui-polish.js');
  }).then(function () {
    if (!document.querySelector('#heist-map')) return;
    return load('epoch-sfx.js').then(function () { return load('epoch-weapons.js'); }).then(function () { return load('temporal-arsenal.js'); }).then(function () { return load('chaos-clock.js'); }).then(function () { return load('enemy-stage.js'); }).then(function () { return load('fight-art-v4.js'); }).then(function () { return load('fight-scene-v4.js'); }).then(function () { return load('boss-demo.js'); }).then(function () { if(new URLSearchParams(window.location.search).has('demo'))return load('loop-v5-model.js').then(function(){return load('loop-v5-demo.js');}); });
  }).then(function () {
    window.dispatchEvent(new CustomEvent('outlaws:feel-ready'));
  }).catch(function () {
    window.dispatchEvent(new CustomEvent('outlaws:feel-unavailable'));
  });
})();
