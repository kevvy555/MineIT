# MineIT Cleanup Plan and Final Handoff

This is the canonical recovery record for the `CleanUp` branch. The cleanup/refactor is behaviour-preserving unless a gameplay change was separately approved. Do not rely on chat history to determine merge readiness; use this file and GitHub status.

## Current repository status

Status captured 2026-08-27 after user-reported post-refactor regressions were fixed and automated validation passed.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green production checkpoint | `3c089e87` — post-refactor ship/trade/star-map regression fixes |
| Package version | `5.11.3` |
| Cleanup phases | **0–7 complete** |
| Large embedded HTML-template debt | **0** |
| Versioned production JS/CSS debt | **0** |
| Internal query-import debt | **0** |
| Import-map debt | **0** |
| Application globals/document app-event debt | **0** |
| CSS orphan debt | **0** |
| Branch reconciliation | **Complete** — `develop` is an ancestor of `CleanUp` |
| Current compare to `develop` | **361 ahead / 0 behind** at `3c089e87` |
| PR state | Open and draft; intentionally not merged |
| Automated regression status | **GREEN** |
| Merge readiness | **BLOCKED ON USER HANDS-ON RECHECK** |
| Remaining action | User rechecks the three reported flows on deployed `CleanUp`; only then consider explicit merge approval |

## Post-refactor regression correction

Checkpoint: `3c089e87bbfb990cf659a8aca22ad44cde07aa4b`

The user found three issues after the cleanup had otherwise passed the broad regression matrix:

1. **Corporate Trade Ship Sell/Buy lists were empty.**
   - Root cause: after Quick Trade HTML was externalized, `data-sell-row-template`, `data-buy-category-template`, and `data-buy-row-template` were siblings outside the mounted Sell/Buy section roots.
   - The controller clones templates through the mounted section root, so all three lookups returned `null` and no stock/category rows were created.
   - Fix: move the reusable `<template>` nodes inside their owning external view roots. No trade/domain rules changed.

2. **Tapping the landed player ship could route through the generic map-selection path instead of opening the Player Colony Ship panel directly.**
   - Root cause: `player-ship-ui.js::selectMapTile()` called `super.selectMapTile()` first and queued the ship panel afterwards.
   - Fix: landed-player-ship interception now occurs before generic selection and returns immediately after `playerShipPanel()`.
   - No player-ship/domain state changed.

3. **Star Map could appear as a black/empty screen, particularly while the corporate trade ship was docked.**
   - Root cause: `star-map-screen.html` uses a four-row full-screen CSS grid, but `{{CORPORATE_TRADE}}` was an optional fifth direct grid child. When present it displaced the map canvas into an implicit row that could be clipped by the full-screen modal's `overflow:hidden` layout.
   - Fix: the optional corporate-trade control now lives inside the existing Star Map detail row, so the screen always has the same four direct grid rows and the map keeps the flexible canvas row.
   - No galaxy/navigation rules changed.

New/strengthened regression coverage:
- `tests/post-refactor-regressions.test.js` locks Quick Trade template placement, direct landed-ship interception, and Star Map grid ownership.
- `tests/ui-lifecycle-soak.html` now verifies that a landed ship tap opens a modal titled **Player Colony Ship** before entering Star Map.
- The browser lifecycle soak now checks that `#starMapCanvas` has a usable drawing area and contains visible painted star/system pixels rather than merely checking that the canvas element exists.

Validation for `3c089e87`:
- Push Test `33093417010` — **success**;
- PR Test `33093421033` — **success**;
- Pages `33093415710` — **success**;
- full Node/regression/domain suite green;
- strengthened browser startup/presentation/lifecycle matrix green;
- painted Star Map assertion green;
- exact Player Colony Ship tap assertion green.

### Required hands-on recheck before merge

Do not merge PR #39 until the user confirms all three deployed flows:

1. Let the Corporate Trade Ship arrive; open it and confirm **Sell** shows real colony stock and **Buy** shows resource categories/items.
2. Tap the landed player ship on the colony map and confirm the **Player Colony Ship** six-action panel opens first.
3. Open **Star Map** (ideally while the Corporate Trade Ship is also docked) and confirm visible star systems/map graphics are drawn and interactive.

If any one of these still fails, keep PR #39 draft and make a targeted correction from `3c089e87` or its later documentation-only descendant.

## Phase 7 technical validation before the regression report

### Phase 7.1 — `develop` reconciliation

Checkpoint: `213a859ec1c4fb66c17e471b2c1c9c90f1e322a3`

- two-parent merge with first parent Phase-6 head `2df89fde5b2d759f21d2d1453bd9a78a1d69a145` and second parent `develop` `01d56b2cc679a7293143a7e4fbef54c7f0ee2a20`;
- first-parent content delta was only `CLEANUP_PLAN.md` plus exact `assets/art/levels/L1.png`–`L10.png`;
- ten level images reused their existing Git blobs byte-for-byte; no re-encoding;
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

The user-reported regressions demonstrated that DOM-presence/lifecycle coverage alone was insufficient for some extracted presentation behavior, which is why the targeted checks above were added at `3c089e87`.

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
| Post-refactor regression correction | Automated green; hands-on pending | `3c089e87`; Push `33093417010`, PR `33093421033`, Pages `33093415710`. |

## Important architecture decisions to preserve

### Controller ownership

Modern semantic controller chain is test-locked:

`ship-preparation` → `ship-navigation` → `player-ship` → `expansion` → `adaptive-building` → `resource-development` → `trade-reserve` → `corporate-events` → `operational-controls` → `map-first` → `technology-presentation` → `cash-policy` → legacy composed `ui-controller`.

Deleted compatibility bridges must stay absent:
- `js/ui/building-details-ui.js`
- `js/ui/survival-presentation-ui.js`

Remaining prototype-qualified `.call(this)` dispatches are intentional manual-super boundaries required by the legacy multiple-mixin composition. `tests/controller-owner-map.test.js` locks them. Do not rewrite the inheritance/mixin system casually.

### Presentation ownership

- static application markup belongs in `/views`;
- repeated rows/controls use templates/fragments and bounded replacement;
- reusable templates must live inside the DOM/root from which the owning renderer queries them, or the renderer must explicitly query the full fragment;
- large embedded application HTML template debt must remain zero;
- async views must reject stale state/hosts and must not delay `DOMContentLoaded` registration;
- production UI should render/dispatch, not own gameplay rules;
- optional content in fixed CSS-grid screens must not change direct-child row ownership unexpectedly.

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
- Preserve mobile/touch behaviour and gameplay semantics.

## Protected unrelated work

Do not overwrite, revert, reformat or replace these unrelated user asset changes:
- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Merge procedure — requires explicit user approval after hands-on recheck

Do **not** merge automatically.

After the user confirms the three post-refactor regression flows are correct and explicitly approves merging PR #39:

1. Re-read `CleanUp`, `develop`, and PR #39 immediately before mutation.
2. Require PR head to still be the hands-on-approved fully green head or a later documentation-only fully green head.
3. Require `develop` to remain an ancestor / comparison `behind_by = 0`.
4. Require PR #39 to remain mergeable and checks green.
5. Mark PR #39 ready for review if GitHub requires draft removal before merge.
6. Merge PR #39 into `develop` using the repository's normal merge strategy; do not force-push or bypass failed checks.
7. Verify the resulting `develop` head and its post-merge workflow/Pages state.
8. Only after that consider the `CleanUp` work complete/archivable.

No additional cleanup/refactor work should be added now. Only targeted fixes for newly discovered validation failures should modify `CleanUp` before the merge.