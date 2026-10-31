# OUTLAWS art gallery, round 03

Open `assets/propostas/era-art/galeria.html` through the local project server. The page links to `/jogar/?demo` and the round 02 Arcade gallery.

This is an art preview. It only loads `jogar/js/lib.js`, the local art manifest, `graphics-pixels.js`, `jogar/js/arte-epocas.js`, and its own gallery script. No provider, ABI, chain request, gameplay simulation, weapon integration or audio is loaded. Chest openings never award an item.

## Display

- Six 312 × 192 scenes compare Original, Atari, 8-bit, 16-bit, Arcade and HD2D. CSS uses exactly 1× or 2×, with 2× only when a 624 px scene fits its card.
- Global Classic/Arcade and Medieval/Modern/Future controls update the scene comparison and chest preview.
- Six 32 px enemies and three 48 px bosses show Classic and Arcade side by side at 3× and visible native 1×. Pose and character look controls apply to both sizes.
- The chest preview has six rarity choices, each with a distinct symbol and written name. The explicit Open preview button runs shake, crack, rarity light and hero reveal in 700 ms. Motion off and reduced motion reveal immediately without animation.
- Original 64 px blast, smoke and debris show at 3× with their native size beneath.
- Every canvas has a localized accessible description. All labels and names have English, Portuguese, Spanish and Filipino translations.

## Animation and states

One requestAnimationFrame scheduler paints visible canvases at 140 ms sprite intervals. IntersectionObserver keeps offscreen art out of the animation pass. Canvas DOM stays fixed after construction. The scheduler stops when motion is off, the document is hidden, reduced motion is requested or no canvas is visible. Switching motion off settles an active reveal immediately. Already loaded local art remains available offline. Loading, success, offline and retryable error text is localized. A failed load exposes Try again, which reloads the static assets.

## QA selectors and API

`window.OutlawsArtGallery` exposes `setLanguage('en'|'pt'|'es'|'fil')`, `setMotion(boolean)`, `setPose('idle'|'walk-down'|'walk-left'|'walk-right'|'walk-up'|'attack'|'hit'|'fall')`, `openLoot(optionalRarityIndex)` and `getState()`.

`setPose('walk', 'left')` is also accepted. `openLoot()` returns false if art is unavailable or an opening is already running. `getState()` reports language, selected and effective motion, reducedMotion, hidden, ready, status, style, era, pose, actorGraphics, rarity, loot, lootStage, animating, visibleCanvases, canvases, paintCount, frame, rateMs and visualOnly.

Stable controls: `#style`, `#era`, `#motion`, `#pose`, `#actor-graphics`, `[data-lang]`, `[data-rarity="0"]` through `[data-rarity="5"]`, `#open-loot`, `#retry`, `#status-text`, `#loot-status`.

Stable sections: `#worlds`, `#crew-section`, `#boss-section`, `#loot-section`, `#effect-section`. Canvases: `#scene-original`, `#scene-atari`, `#scene-8bit`, `#scene-16bit`, `#scene-arcade`, `#scene-hd2d`, `#loot-canvas`, `[data-actor] canvas`, `[data-effect] canvas`.

