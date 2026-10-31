/* Independent art loader. Does not edit or load weapon behavior. */
(function(){'use strict';if(window.__outlawsArtV3Loading)return;window.__outlawsArtV3Loading=true;const base=new URL('.',document.currentScript.src),art=new URL('../../assets/propostas/era-art/',base);
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('graphics.css',art).href;document.head.append(css);
 const load=url=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=reject;document.head.append(s);});
 load(new URL('manifest.js',art).href).then(()=>load(new URL('graphics-pixels.js',art).href)).then(()=>load(new URL('arte-epocas.js',base).href)).then(()=>load(new URL('graficos-evolucao.js',base).href)).catch(()=>window.dispatchEvent(new CustomEvent('outlaws:era-art-unavailable')));
})();
