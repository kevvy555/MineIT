# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. Refactoring is behaviour-preserving unless a gameplay change is separately approved. Update this file at every cohesive green checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head before moving the ref.
2. Preserve unrelated user asset work; connector commits touch only explicit paths.
3. Make one cohesive ownership change and update focused tests + the exact architecture debt map in the same checkpoint.
4. Prefer deleting proven shadowed presentation over externalizing dead markup.
5. Static markup belongs in `/views`; repeated controls use templates/fragments and bounded replacement.
6. Domain services own rules and authoritative state mutation; UI renders and dispatches.
7. Async view loading must reject stale state/hosts and must never block startup/`DOMContentLoaded`.
8. Do not advance until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, read the exact workflow log before changing code; never weaken the guard to fit a failure.

## Current repository status

Status captured 2026-08-27 while preparing the final Phase-4 checkpoint.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `a93dc7dd` — Phase 4D.11 Contract Failed + Industry Capacity ownership, including stale assertion alignment |
| Current checkpoint | Phase 4D.12 — final HTML ownership, exact debt 3 → 0 |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 3 |
| Expected after current checkpoint | 0 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 5–7 remain after Phase 4 closes |

## Green checkpoint history

- `a217a509` — ship cargo/fuel rows externalized; green.
- `2b2040ad` — sortable planet table externalized; green.
- `48c23b5` / `7153e30e` — corrected lexical template scanner; genuine baseline locked at 50.
- `227101c8` — Help/manual ownership; 50 → 43.
- `3d03bc53` — V55 operation cards; 43 → 39. Push `33047421531`, PR `33047425532`, Pages `33047420869`.
- `1c12a122` — technology presentation; 39 → 30. Push `33048664562`, PR `33048667800`, Pages `33048664150`.
- `9b8201fe` — land presentation; 30 → 24. Push `33050871178`, PR `33050873588`, Pages `33050870040`.
- `01051465` — colony-tech cleanup; 24 → 19. Push `33051923546`, PR `33051926517`, Pages `33051922844`.
- `c27fc9d1` — resource presentation + nonblocking preload correction; 19 → 15. Push `33053336531`, PR `33053339742`, Pages `33053335423`; browser green.
- `4623e3cc` — UI-enhancement ownership; 15 → 11. Push `33054163574`, PR `33054167037`, Pages `33054162621`; browser green.
- `ef1fcdc5` — Quick Trade Sell/Buy extraction + stale assertion alignment; 11 → 9. Push `33054929802`, PR `33054933882`, Pages `33054929350`; browser green.
- `334e6f17` — survival terminal/help ownership; 9 → 7. Push `33067085875`, PR `33067089205`, Pages `33067085509`; browser green.
- `270f9578` — adaptive-building shell + operating mode externalized; Harvest +/- routed through existing `ResourceService.adjustHarvestIntensity`; 7 → 5. Push `33067797422`, PR `33067803240`, Pages `33067796744`; browser green.
- `92701fd3` / `a93dc7dd` — Contract Failed and Industry Capacity externalized, then Industry presentation assertions aligned with the new owner; 5 → 3. Push `33069061527`, PR `33069065078`, Pages `33069060704`; browser green.

## Verified debt after Phase 4D.11

| File | Findings |
|---|---:|
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **3** |

## Current Phase 4D.12 — final HTML ownership

### 1. `building-details-ui.js` — delete shadowed developed-building renderer

Active-chain evidence:

- `adaptive-building-ui.js` extends `resource-development-ui.js`, which extends `building-details-ui.js`.
- The adaptive controller intercepts every developed `housing`, `power`, `industry` and `extract` tile in both `tile()` and `landTile()` before the old building-details renderer can run.
- No active controller needs the old `buildingHero`, `openColonyBuilding`, `compactExtractionPanel`, `tile` or `landTile` implementations.
- Keep only the small `open()` bridge that removes obsolete `building-detail-modal` styling before generic modal use.
- Do not externalize dead compatibility markup.
- Align artwork/regression tests so developed-building presentation is asserted against `adaptive-building-ui.js` + `views/adaptive-building.html`.

### 2. `map-first-ui.js` — externalize map-controls Help copy

- Add `views/map-first-help-controls.html`.
- Preserve the existing v5.8.0 intro assignment synchronously; later operational/corporate-event/trade-reserve adapters continue to overwrite that intro exactly as before.
- The map-first controls paragraphs move to the external fragment.
- Eagerly preload the fragment without top-level `await`.
- `help()` remains synchronous for the base manual and intro; `mountMapFirstHelp()` reads the cache synchronously when available and retries asynchronously otherwise.
- A delayed fragment may mount only while the captured `#help-controls` section remains connected and is still the current modal section.
- Remove the large inline Help template.
- `selectMapTile()` clears any pending undeveloped-resource ownership so a slow detail-view fetch cannot overwrite a later tile selection.

### 3. `resource-development-ui.js` — externalize active undeveloped-resource panel

- Add `views/undeveloped-resource.html`.
- Preserve synchronous public `tile()` behaviour for the downstream adaptive/map-first controller chain.
- Preload without top-level `await`.
- `undevelopedViewSource()` reads the resolved cache synchronously and retries only while `activeUndevelopedTile === tile`.
- The external view owns hero/facts/requirements/when-developed/actions markup.
- Requirement rows use a cloned external `<template>` + `DocumentFragment` + one `replaceChildren()`.
- Populate labels, metrics, art style, readiness and button state through DOM APIs.
- Replace the tile panel with one bounded `panel.replaceChildren(fragment)`; `panel.innerHTML =` must not return.
- Preserve develop-domain call, extraction sync, recalculation, logging, save, toast, context refresh and final dispatch into the adaptive developed-building panel.
- Closing, successful development, or selection of a different map tile clears stale undeveloped-view ownership.

### Gate

- Extend `tests/final-presentation-view-ownership.test.js` to lock all final ownership decisions.
- Align `tests/how-to-play.test.js`, `tests/map-first-ux.test.js`, and `tests/building-art.test.js` with the canonical owners.
- Exact architecture debt changes 3 → **0**.
- The architecture test must use an empty verified debt map and reject any reintroduced large application HTML template anywhere under `js/`.
- Require Push Test, PR Test, browser startup/presentation interactions and Pages green.
- After those gates pass, immediately update this handoff with the final run IDs and mark Phase 4 Complete before entering Phase 5.

## Protected unrelated worktree changes

Do not overwrite/revert/reformat:

- `assets/art/development/algae-facility/originals/algae-facility-l4.png`
- `assets/art/resources/food-resources/Originals/synthetic-nutrient.png`

## Architecture rules

- `GameStore` owns mutable root state.
- Domain services own rules and authoritative mutation.
- Domain modules never import UI code or render application HTML.
- No application state on `window`; no document-level app event bus.
- Every listener/observer/timer/RAF has a clear owner/disposal lifetime.
- Static markup belongs in `/views`; repeated presentation uses templates/fragments/bounded replacement.
- Async views reject stale state/hosts; eager preloads never block startup.
- No version-suffixed production JS/CSS, import maps or internal version-query imports.
- Exact scanner debt changes only in reviewed extraction checkpoints.
- Preserve mobile/touch behaviour and gameplay semantics.

## Phase tracker

| Phase | State | Exit evidence |
|---|---|---|
| 0 — Test baseline | Complete | Regression/architecture/save/lifecycle/coverage gates established. |
| 1 — Canonical modules | Complete | Zero versioned production JS. |
| 2 — Startup/import cleanup | Complete | Zero import maps/internal version-query imports. |
| 3 — State/events/lifecycle | Complete | Explicit store/boundaries/disposal; zero app globals/document events. |
| 4 — HTML views | In progress | Baseline 50; green progression 43 → 39 → 30 → 24 → 19 → 15 → 11 → 9 → 7 → 5 → 3; current target 0. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed wrappers. |
| 6 — CSS cleanup | Pending final pass | Audit canonical ownership, duplicates and obsolete rules. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Phase 5 — feature controllers

After Phase 4 is green at zero template debt:

1. Inventory the surviving inherited/mixin chain from `ui-controller.js` through the final ship-preparation controller.
2. Map each public method to one canonical feature owner.
3. Remove shadowed compatibility renderers/wrappers, including legacy V55/UI-enhancement technology compatibility paths.
4. Replace direct prototype-qualified calls where they bypass the intended active owner unless they are an explicit, documented compatibility boundary.
5. Split orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation while preserving domain/store boundaries.
6. Audit remaining direct UI state mutation; route authoritative changes through existing domain commands when available.
7. Keep the full regression/browser/Pages gates at every cohesive checkpoint.

## Phase 6 — CSS completion

Map styles to canonical owners, remove duplicate/obsolete/unreachable rules, verify cascade and supported mobile breakpoints, and keep versioned CSS at zero.

## Phase 7 — final validation and merge gate

1. Reconcile the two `develop` commits; effective missing content remains `assets/art/levels/L1.png`–`L10.png`.
2. Run full Node regression/coverage.
3. Run supported mobile/browser viewport matrix.
4. Exercise full multi-colony/interstellar campaign.
5. Run representative save/load round trips.
6. Run repeated navigation/panel lifecycle soak.
7. Run accelerated long-simulation soak.
8. Confirm stable DOM/listener/observer/timer/RAF counts.
9. Confirm no startup/runtime diagnostics and all PR checks green.
10. Update this plan with final evidence and obtain explicit merge approval.

Only then merge draft PR #39 into `develop`.
