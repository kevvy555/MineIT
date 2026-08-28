# MineIT Cleanup Plan and Final Handoff

This is the canonical recovery record for the MineIT cleanup/refactor. The cleanup was behaviour-preserving unless a gameplay change was separately approved. PR #39 was hands-on approved by the user and merged from `CleanUp` into `develop` on 2026-08-28. Do not rely on chat history to determine the cleanup outcome; use this file and GitHub status.

## Current repository status

Status captured 2026-08-28 after user hands-on approval, PR #39 merge, and successful post-merge validation on `develop`.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `develop` |
| Pull request | PR #39, `CleanUp` → `develop` — **merged** |
| Last production checkpoint | `bb33deea` — unified canvas activation on `click` |
| Last fully validated functional head before merge | `bc31f1e5` — production checkpoint plus test-ownership alignment |
| Final `CleanUp` head merged | `58d5436f` — includes repository `AGENTS.md` development contract |
| `develop` merge commit | `ed380c25f23239184b7f4dc727203312d6460511` |
| Package version | `5.11.3` |
| Cleanup phases | **0–7 complete** |
| Large embedded HTML-template debt | **0** |
| Versioned production JS/CSS debt | **0** |
| Internal query-import debt | **0** |
| Import-map debt | **0** |
| Application globals/document app-event debt | **0** |
| CSS orphan debt | **0** |
| Branch reconciliation | **Complete** — `CleanUp` merged into `develop` |
| Final pre-merge compare | **384 ahead / 0 behind** |
| PR state | **Closed and merged** |
| Automated regression status | **GREEN** |
| Merge readiness | **COMPLETE** |
| Remaining cleanup action | None. Future feature/fix work should branch from current `develop` and continue to obey `AGENTS.md`. |

## Merge completion — 2026-08-28

- User completed the hands-on recheck and explicitly approved merging `CleanUp` into `develop`.
- Final `CleanUp` head before merge: `58d5436f083d584dddcaccf29c32f75141c6f7c3`.
- Pre-merge validation for that exact head:
  - Push Test `33104258648` — **success**;
  - PR Test `33104265356` — **success**;
  - Pages `33104257657` — **success**.
- Final compare immediately before merge: `CleanUp` **384 ahead / 0 behind** `develop`; merge base remained `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`.
- PR #39 was marked ready for review and merged using the normal merge strategy with an expected-head guard.
- Merge commit: `ed380c25f23239184b7f4dc727203312d6460511`.
- GitHub verifies the merge commit and its two parents are the previous `develop` head and final `CleanUp` head.
- Post-merge `develop` Test run `33156131648` — **success**:
  - full Node/unit/regression/domain suite — success;
  - browser/mobile presentation and interaction suite — success.
- `CleanUp` was intentionally retained after merge; it was not deleted.

## Post-refactor regression corrections

### Correction A — ship/trade/star-map presentation

Checkpoint: `3c089e87bbfb990cf659a8aca22ad44cde07aa4b`

The user found three issues after the cleanup had otherwise passed the broad regression matrix:

1. **Corporate Trade Ship Sell/Buy lists were empty.**
   - Root cause: after Quick Trade HTML was externalized, `data-sell-row-template`, `data-buy-category-template`, and `data-buy-row-template` were siblings outside the mounted Sell/Buy section roots.
   - The controller clones templates through the mounted section root, so the lookups returned `null` and no stock/category rows were created.
   - Fix: move the reusable `<template>` nodes inside their owning external view roots. No trade/domain rules changed.

2. **Tapping the landed player ship could route through the generic map-selection path instead of opening the Player Colony Ship panel directly.**
   - Root cause: `player-ship-ui.js::selectMapTile()` called `super.selectMapTile()` first and queued the ship panel afterwards.
   - Fix: landed-player-ship interception now occurs before generic selection and returns immediately after `playerShipPanel()`.
   - No player-ship/domain state changed.

3. **Star Map could appear black/empty while the Corporate Trade Ship was docked.**
   - Root cause: `star-map-screen.html` uses a four-row full-screen CSS grid, but `{{CORPORATE_TRADE}}` was an optional fifth direct grid child. When present it could displace the map canvas into an implicit row clipped by the full-screen modal.
   - Fix: the optional corporate-trade control now lives inside the existing Star Map detail row so the screen always keeps the intended four direct grid rows.
   - No galaxy/navigation rules changed.

Coverage added at this checkpoint:
- `tests/post-refactor-regressions.test.js` locks Quick Trade template placement, direct landed-ship interception, and Star Map grid ownership.
- `tests/ui-lifecycle-soak.html` verifies a landed ship tap opens **Player Colony Ship** before entering Star Map.
- browser lifecycle checks require `#starMapCanvas` to have a usable drawing area and visible painted system pixels.

Validation for `3c089e87`:
- Push Test `33093417010` — **success**;
- PR Test `33093421033` — **success**;
- Pages `33093415710` — **success**.

### Correction B — populated Frontier planet table prevented Star Map binding

Functional checkpoint: `46bad27ad2ad33aeb353f645e54490120f57f9ed`

The user then reported that the Star Map was still blank and supplied this runtime error:

`TypeError: Cannot set properties of null (setting 'textContent')`

Stack path:
- `ship-preparation-ui.js::renderPlanetColonies`
- `createPlanetRow`
- `renderPlanetRows`
- `renderPlanetTable`
- `bindStarMapDetailActions`
- `ship-navigation-ui.js::starMap`

Exact root cause:
- `views/planet-table.html` defined `data-planet-colony-template` as `<span data-planet-colony-name></span>`.
- `planetTemplate()` returns `template.content.firstElementChild.cloneNode(true)`, so the returned node was itself the `data-planet-colony-name` element.
- `renderPlanetColonies()` then called `name.querySelector("[data-planet-colony-name]")`.
- `querySelector()` searches descendants, not the element itself, so it returned `null` for a populated colony cell.
- The exception occurred inside `bindStarMapDetailActions()` before `starMap()` reached `requestAnimationFrame(()=>this.bindStarMap())`.
- Therefore the full-screen Star Map DOM/canvas existed, but the canvas binding/draw path never ran, producing the user-visible blank map.

Fix:
- `views/planet-table.html` now gives the cloned template root a descendant `data-planet-colony-name` element, matching the active renderer contract.
- No controller or domain logic changed.

Strengthened regression coverage:
- `tests/post-refactor-regressions.test.js` now locks the planet-colony template contract so the colony-name marker must be a descendant of the cloned root.
- `tests/ui-lifecycle-soak.html` now records browser `error` and `unhandledrejection` events.
- On its first Star Map cycle the browser test now requires:
  1. selected system is **Koplin Frontier**;
  2. the populated planet table contains an existing colony name;
  3. no runtime error/unhandled rejection occurred while opening the Frontier Star Map;
  4. the Star Map canvas has usable dimensions;
  5. the canvas contains visibly painted star/system pixels.

Validation for `46bad27a`:
- Push Test `33095033305` — **success**;
- PR Test `33095036882` — **success**;
- Pages `33095031958` — **success**;
- full Node/regression/domain suite green;
- populated Koplin Frontier planet/colony browser path green;
- zero runtime error/unhandled rejection in that path;
- painted Star Map assertion green.

Connector housekeeping during this correction:
- an empty temporary file named `__tmp_should_not_exist` was accidentally created while switching GitHub write mechanisms;
- it was immediately deleted before the functional fix was applied;
- it has **no net tree/content delta** and does not affect runtime code or the PR file set.

### Correction C — opening the landed Player Colony Ship could click through into Star Map

Functional checkpoint: `188075dc1e13a87a026e8eb269de53a74592073f`

The user reported that tapping the landed colony/player ship still opened Star Map immediately, but using the Star Map **Back** button returned to the correct **Player Colony Ship** six-action panel.

Exact root cause:
- `ship-navigation-ui.js` is the active controller above `player-ship-ui.js` and overrides `playerShipPanel()`.
- The selection interception from Correction A was working: the opening `pointerup` did open **Player Colony Ship**.
- The active panel immediately attached `onclick` handlers to all six action buttons.
- On mobile/pointer input, the same opening gesture could then generate a compatibility `click` after `pointerup`.
- Because the modal had already appeared under that gesture and its buttons were live, the compatibility click could land on the **STAR MAP** action.
- This produced the exact observed navigation stack: Star Map appeared first, while Back returned to the already-opened Player Colony Ship flow.

Temporary fix at this checkpoint:
- `player-ship-ui.js` tracked the pointer that opened the panel and suppressed a matching immediate compatibility click.
- The workaround was lifecycle-owned and validated, but the user correctly identified that it compensated for a deeper inconsistency: canvas activation occurred on `pointerup` while DOM activation occurred on `click`.
- Correction D below replaces this workaround with the permanent interaction architecture. The Correction C guard/listeners were removed; they must not return.

Validation for `188075dc`:
- Push Test `33096942755` — **success**;
- PR Test `33096948691` — **success**;
- Pages `33096941912` — **success**;
- full Node/regression/domain suite green;
- dedicated mobile click-through browser probe green;
- existing Star Map/trade/mobile/multi-colony/lifecycle browser matrix green.

### Correction D — unified activation architecture: click activates, pointer events track gestures

Production checkpoint: `bb33deeaff39ce77f1bc1d78a7b06406d9b977f5`

Fully validated functional head: `bc31f1e530e87c75d913a73626f1570e9e1b35a7`

The user asked to fix the architectural cause of Correction C rather than retain a permanent ghost-click workaround.

Permanent interaction rule:
- **`click` is the one normal activation event for both canvas and DOM controls.**
- `pointerdown`, `pointermove`, `pointerup`, and `pointercancel` are gesture-state events only.
- Pointer gestures may detect movement, long-press/inspect, drag/multi-select, and cancellation, but `pointerup` must not invoke the normal tile/ship activation callback.
- If a pointer gesture is consumed by long-press, drag or multi-select, its subsequent compatibility `click` is suppressed exactly once.
- A clean tap completes pointer gesture tracking and is activated by the browser's resulting `click`.

Production changes at `bb33deea`:
1. `js/ui/world-view.js`
   - canonical `bindInput()` now performs normal map activation only in a canvas `click` listener;
   - `pointerup` only finalises gesture state and multi-selection;
   - `suppressClick` consumes the follow-on click after a drag, long press or multi-select;
   - ordinary revealed-tile selection and one-tap surveying retain the same downstream callbacks.
2. `js/ui/world-view-runtime.js`
   - removed the separate landed-player-ship capture-phase pointer path;
   - removed `bindPlayerShipCapture()`, `_shipPointer`, capture handlers, `stopImmediatePropagation()` and runtime `onPlayerShipClick` ownership;
   - ship clicks now flow through the same canonical canvas activation path as every other map tile.
3. `js/ui/player-ship-ui.js`
   - removed the temporary Correction C global pointer tracker/modal click guard and its lifecycle wiring;
   - direct landed-ship interception in `selectMapTile()` remains and opens **Player Colony Ship** before generic map selection.

No gameplay/domain state changed. No new production module was created. No versioned/copy production file was created.

Regression contract after Correction D:
- `tests/post-refactor-regressions.test.js` requires `pointerup` not to call `onTap`, requires canvas `click` to own `onTap`, requires gesture click suppression, and forbids the ship-specific pointer/ghost-click paths from returning.
- `tests/player-ship-clickthrough-probe.html` now verifies the actual architecture directly:
  1. pointer down/up on the landed player ship **does not** open the panel by itself;
  2. the canvas `click` from that tap opens **Player Colony Ship** and does not enter Star Map;
  3. a separate deliberate DOM click on **STAR MAP** opens Star Map normally;
  4. a moved/consumed pointer gesture followed by its click does not activate the ship;
  5. the next clean tap/click activates normally again;
  6. no browser runtime error is produced.
- `tests/ui-lifecycle-soak.html` uses the same pointerdown → pointerup → click sequence for repeated ship navigation.
- `tests/presentation-architecture.test.js`, `tests/map-first-ux.test.js`, and `tests/ship-expansion.test.js` now lock the new owner map rather than requiring the removed ship pointer hook.

Validation history:
- Initial production run exposed stale tests that explicitly required the old `onPlayerShipClick`/capture-pointer implementation. The zero-debt guard itself was already green.
- Test-only alignment commits:
  - `50f0e81f` — presentation architecture ownership;
  - `092da35e` — map-first ownership;
  - `bc31f1e5` — ShipExpansion ownership.
- These corrections did **not** restore or weaken the old runtime path; they changed the tests to require the new architecture.

Final validation at `bc31f1e5`:
- Push Test `33103002884` — **success**;
- PR Test `33103006969` — **success**;
- Pages `33103001491` — **success**;
- full Node/regression/domain suite green;
- architecture baseline remains: versioned JS 0, versioned CSS 0, query imports 0, import map false, global assignments 0, document app events 0, large HTML templates 0;
- dedicated player-ship click/drag-suppression browser probe green;
- five mobile/landscape viewport probes green;
- multi-colony lifecycle browser probe green;
- repeated UI/Star Map lifecycle soak green;
- existing painted Star Map and populated Frontier planet-table checks remain green.

### Hands-on recheck and merge approval — complete

The user completed the deployed hands-on recheck and confirmed the cleanup branch looked good before explicitly approving the merge on 2026-08-28. The required flows were the Corporate Trade Ship Sell/Buy lists, landed Player Colony Ship opening path, deliberate Star Map navigation/rendering, and normal map tap/drag behaviour. PR #39 was then merged into `develop` as recorded in the merge-completion section above.

## Phase 7 technical validation before the regression reports

### Phase 7.1 — `develop` reconciliation

Checkpoint: `213a859ec1c4fb66c17e471b2c1c9c90f1e322a3`

- two-parent merge with first parent Phase-6 head `2df89fde5b2d759f21d2d1453bd9a78a1d69a145` and second parent `develop` `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`;
- first-parent content delta was only `CLEANUP_PLAN.md` plus exact `assets/art/levels/L1.png`–`L10.png`;
- ten level images reused their existing Git blobs byte-for-byte;
- `develop` compare returned `behind_by = 0`;
- Push Test `33082056002` — success;
- PR Test `33082062486` — success;
- Pages `33082054938` — success.

### Phase 7.2 — final broad validation

Checkpoint: `e633bf1f04c6336ab9037573a436b61faf64af4a`

Runs:
- Push Test `33087964519` — success;
- PR Test `33087970503` — success;
- Pages `33087964360` — success.

This checkpoint proved:
- full Node regression/domain suite and V8 coverage;
- architecture guards at zero for versioned JS/CSS, query imports, import map, application globals/document events, and large HTML templates;
- CSS ownership: exactly 12 linked stylesheets and zero orphan CSS;
- realistic multi-colony + player-ship save/load round trip;
- ShipExpansion probe, travel, planet selection, expedition-colony founding, service-radius, and sole-ship-loss paths;
- **9,000 daily ticks / 25 game years** long-simulation soak;
- Domain/Core V8 function coverage **83.5% (450/539 functions)**;
- browser startup diagnostics;
- mobile/browser presentation matrix at 360×640, 375×667, 390×844, 412×915 and 915×412;
- first-contract renewal + second-colony lifecycle browser flow;
- repeated UI open/close lifecycle soak with observer/listener/live-DOM growth bounds.

The user-reported regressions showed why DOM-presence/lifecycle checks alone were insufficient for extracted presentation and input behavior. The targeted functional checks above must remain part of the regression suite.

## Phase completion summary

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | Complete | Corrected inline-template baseline **50 → 0**; final `cb882c74`, Push `33070686760`, PR `33070691704`, Pages `33070686316`. |
| 5 — Feature controllers | Complete | Final `046ed701`, Push `33078938572`, PR `33078945708`, Pages `33078937342`. |
| 6 — CSS cleanup | Complete | Final `2df89fde`; zero orphan CSS; Push `33081571679`, PR `33081577146`, Pages `33081569786`. |
| 7 — Final validation/reconciliation | Complete | `e633bf1f`; Push `33087964519`, PR `33087970503`, Pages `33087964360`; 25-year soak + browser matrix green. |
| Post-refactor correction A | Automated green | `3c089e87`; Push `33093417010`, PR `33093421033`, Pages `33093415710`. |
| Post-refactor correction B | Automated green | `46bad27a`; Push `33095033305`, PR `33095036882`, Pages `33095031958`. |
| Post-refactor correction C | Superseded by D | `188075dc`; validated temporary ghost-click guard, later removed. |
| Post-refactor correction D | **Merged / green** | production `bb33deea`, validated head `bc31f1e5`; final `CleanUp` `58d5436f`; merge `ed380c25`; post-merge Test `33156131648` success. |

## Important architecture decisions to preserve

### Controller ownership

Modern semantic controller chain is test-locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges must stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition. `tests/controller-owner-map.test.js` locks them. Do not rewrite the inheritance/mixin system casually.

### Presentation and input ownership

- static application markup belongs in `/views`;
- repeated rows/controls use templates/fragments and bounded replacement;
- reusable templates must live inside the DOM/root from which the owning renderer queries them, or the renderer must explicitly query the full fragment;
- when a renderer clones `template.content.firstElementChild` and then calls `clone.querySelector(...)`, required markers must be descendants of that cloned root, not only the root itself;
- large embedded application HTML template debt must remain zero;
- async views must reject stale state/hosts and must not delay `DOMContentLoaded` registration;
- production UI should render/dispatch, not own gameplay rules;
- optional content in fixed CSS-grid screens must not change direct-child row ownership unexpectedly;
- browser tests for canvas workflows must prove the canvas is actually painted and that prerequisite UI binding completed without runtime errors;
- **normal activation is `click` everywhere, including canvas**;
- pointer events are gesture tracking only: down/move/up/cancel must not directly perform normal activation;
- a consumed long-press, drag or multi-select must suppress exactly its follow-on compatibility click;
- do not reintroduce ship-specific pointer capture or a modal ghost-click guard; the unified click path is the canonical solution;
- pointer/listener owners must have explicit lifecycle/disposal when they outlive a local element.

### CSS ownership

`index.html` loads exactly these 12 CSS files, in cascade order, and `/css` contains no other stylesheet:

1. `app.css`
2. `world.css`
3. `panels.css`
4. `portfolio.css`
5. `trade-quality.css`
6. `trade-quick.css`
7. `ui-enhancements.css`
8. `land.css`
9. `map-first.css`
10. `resource-details.css`
11. `adaptive-building-details.css`
12. `ship-expansion.css`

`css/building-details.css` is intentionally deleted. Two inert `classList.remove("building-detail-panel")` calls may remain in active controllers; nothing adds or styles that class.

### State/domain/lifecycle rules

- `GameStore` owns mutable root state.
- Domain services own gameplay rules and authoritative mutation.
- Domain modules never import UI code or render application HTML.
- No application state on `window`.
- No document-level application event bus.
- Every listener/observer/timer/RAF needs a clear owner/disposal lifetime.
- No version-suffixed production JS/CSS, import maps or internal version-query imports.
- Modify canonical production owners in place; do not create versioned/copy replacement modules.
- Preserve mobile/touch behaviour and gameplay semantics.

## Protected unrelated work

Do not overwrite, revert, reformat or replace these unrelated user asset changes:
- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Cleanup work complete — future branch guidance

PR #39 is merged and the cleanup work is complete. The old pre-merge procedure is retained here only as historical context through the completed evidence above.

For future MineIT work:

1. Start from the current `develop` branch unless the user explicitly chooses another base.
2. Read root `AGENTS.md` before coding and preserve the architecture rules recorded in this plan.
3. Use focused feature/fix branches rather than continuing broad cleanup work on `CleanUp`.
4. Keep architecture/regression guards green and never restore versioned or shadow production implementations.
5. Run focused tests during development and the full required CI/browser suite before significant merges.
6. Keep `CleanUp` only as historical/archival context unless the user later asks to delete it.
