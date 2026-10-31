# Graphics lab UI

Load `graphics.css` and then `jogar/js/graficos-evolucao.js` after `OutlawsEraArt`. Only these two files and this note belong to the UI front.

## Renderer contract

- `OutlawsEraArt.whenReady`: Promise, or function returning a Promise. Rejection and a 12-second timeout show a retry control.
- `drawScene(ctx, { graphics, style, era, time, motion, width, height })`: the five IDs are `atari`, `8bit`, `16bit`, `arcade`, `hd2d`, plus `original` for the Classic comparison. Dimensions are 312 by 192 backing pixels, displayed at integer 1x or 2x. `false` signals a render failure.
- `setGraphics(id)`: synchronous or Promise result, `false` signals failure. Accepts the five IDs and `original` for restoring the unmodified Classic rendering.
- `getState()`: optional `graphics`, `style`, `era`. Default graphics is `original`; style is `classic` and era is `medieval` unless a valid renderer state says otherwise. Optional `empty:true` replaces scenes with an empty state. Optional `storageAvailable:false` explains that the choice lasts for this visit.
- Listens on window to `outlaws:graphics-change`, `outlaws:art-ready`, `outlaws:era-change`, `outlaws:style-change`.
- Current `OutlawsJuice` exposes `getState()`, not `prefs()`. The UI supports either, reads `motion`, `effects`, `reducedMotion`, and never changes those settings.

## Behavior and selectors

Injects `#outlaws-graphics-header` immediately before the first `#assalto h2` and moves that heading into its own flex header. Fallback is the section containing `#heist-map`. Adds `#outlaws-graphics-upgrade`, native `#outlaws-graphics-dialog`, `#owg-title`, `#owg-help`, `#owg-notice`. Existing title content and IDs remain intact. Original and new levels use the renderer's same comparison scene.

All five buttons preview locally without applying. USE applies the selected level, NEXT LEVEL applies the next of the five levels in one click, and Restore original restores Classic. The UI never calls `setGraphics` on load and never writes storage. Renderer owns local preference `outlaws:visual:graphics` and its restoration. EN/PT/ES/FIL copy follows `I18N.lang()` / `I18N.onChange()`.

`?demo` displays “Demo upgrade. No tokens spent.” Otherwise “Visual preview. No tokens spent.” Both are translated. No price, reward, balance, provider, network request, simulation, wallet action or audio is added. No game event is emitted. The live status distinguishes loading, failure, success and unavailable storage. Native modal handles Escape, Tab containment and page inertness; closing returns focus to the opener. Mosaic has 24 tiles, max 630ms, transform and opacity only, disabled with reduced motion / motion off / effects off. Animation runs only while the dialog is open and document visible.

Public inspection: `OutlawsGraphicsUI.getState()`. Programmatic `open`, `close`, `pick`, `use`, `init` are idempotent where appropriate. Responsive layout keeps exact 312px scenes at 375px mobile, uses a vertical comparison below 748px, and 624px scenes only when width >=1360px and height >=950px. Buttons have >=44px targets.

## Validation

JavaScript syntax and isolated DOM behavior are verified locally. Full visual review at 375, 768, 1440px and the final live renderer remains with integration. All six preview variants retain exact integer CSS scale. Existing native app settings and original source files are untouched.
