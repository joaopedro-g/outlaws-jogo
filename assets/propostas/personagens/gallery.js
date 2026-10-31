/* Standalone review gallery. Its before and after share JP's same image URLs. */
(() => {
  'use strict';
  const copy = {
    en: { eyebrow: 'CHARACTER PROPOSAL', title: 'The same outlaws. A richer portrait.', intro: "JP's original pixels, with anchored shadows, quiet breathing and stamped rank insignias.", before: 'Before', beforeNote: 'Original sprite, parchment and glowing rarity border.', after: 'After', afterNote: 'The identical sprite, framed like a wanted poster.', ranks: 'Ranks, cast in metal', rankNote: 'Six distinct stamps. Original rarity colors stay recognizable.', footer: 'Visual proposal only. Original PNGs, character traits and game rules stay intact. Motion follows your reduced-motion setting.', demo: 'Open game demo', rank: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'], titleLabel: ['Scout', 'Ranger', 'Warlord'], stats: ['Aim', 'Strength', 'Stealth'] },
    pt: { eyebrow: 'PROPOSTA DE PERSONAGENS', title: 'Os mesmos foras-da-lei. Um retrato mais rico.', intro: 'Os pixels originais do JP, com sombra no chão, respiração suave e insígnias de rank estampadas.', before: 'Antes', beforeNote: 'Sprite original, pergaminho e borda luminosa de raridade.', after: 'Depois', afterNote: 'O sprite idêntico, emoldurado como cartaz de procurado.', ranks: 'Ranks, fundidos em metal', rankNote: 'Seis selos distintos. As cores originais de raridade seguem reconhecíveis.', footer: 'Somente proposta visual. PNGs originais, atributos dos personagens e regras do jogo preservados. A animação respeita a opção de reduzir movimento.', demo: 'Abrir demo do jogo', rank: ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico'], titleLabel: ['Batedor', 'Patrulheiro', 'Chefe'], stats: ['Mira', 'Força', 'Furtividade'] },
    es: { eyebrow: 'PROPUESTA DE PERSONAJES', title: 'Los mismos forajidos. Un retrato más rico.', intro: 'Los píxeles originales de JP, con sombra en el suelo, respiración suave e insignias de rango estampadas.', before: 'Antes', beforeNote: 'Sprite original, pergamino y borde luminoso de rareza.', after: 'Después', afterNote: 'El sprite idéntico, enmarcado como cartel de búsqueda.', ranks: 'Rangos, fundidos en metal', rankNote: 'Seis sellos distintos. Los colores originales de rareza siguen reconocibles.', footer: 'Solo propuesta visual. PNG originales, atributos de personajes y reglas del juego intactos. La animación respeta la opción de reducir movimiento.', demo: 'Abrir demo del juego', rank: ['Común', 'Poco común', 'Raro', 'Épico', 'Legendario', 'Mítico'], titleLabel: ['Explorador', 'Guardabosques', 'Jefe'], stats: ['Puntería', 'Fuerza', 'Sigilo'] }
  };
  const characters = [
    { rank: 1, image: '../../rank-1.png', color: '#6CC24A' },
    { rank: 3, image: '../../rank-3.png', color: '#B06CF0' },
    { rank: 5, image: '../../rank-5.png', color: '#FF4F5E' }
  ];
  function setLanguage(lang) {
    const words = copy[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-copy]').forEach((node) => { node.textContent = words[node.dataset.copy]; });
    document.querySelectorAll('[data-lang]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.lang === lang)); });
    for (const area of ['before', 'after']) {
      document.getElementById(`gallery-${area}`).innerHTML = characters.map((character, i) => `<article class="card r-${character.rank}" ${area === 'before' ? 'data-outlaw-visual="baseline"' : ''} style="--rc:${character.color};--rc2:${character.color}"><span class="c-id">#00${i + 1}</span><img src="${character.image}" alt="OUTLAWS ${words.rank[character.rank]}" width="96" height="96"><div class="c-rank"><i class="gem" aria-hidden="true"></i>${words.rank[character.rank]}</div><div class="c-title">${words.titleLabel[i]}</div><dl class="c-stats">${words.stats.map((stat, n) => `<div><dt>${stat}</dt><dd>${[42, 68, 56][n] + i * 7}</dd></div>`).join('')}</dl></article>`).join('');
    }
    document.getElementById('rank-seals').innerHTML = words.rank.map((rank, i) => `<figure><svg viewBox="0 0 24 24" aria-hidden="true"><use href="rank-seals.svg#rank-${i}"></use></svg><figcaption>${rank}</figcaption></figure>`).join('');
  }
  document.querySelectorAll('[data-lang]').forEach((button) => { button.addEventListener('click', () => setLanguage(button.dataset.lang)); });
  setLanguage('en');
})();
