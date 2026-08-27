# MineIT Cleanup Plan and Live Handoff

This is the canonical recovery record for the `CleanUp` branch. The refactor is behaviour-preserving unless a separate gameplay change is explicitly approved. Update this file at each cohesive checkpoint so work can resume after a lost chat without relying on conversation history.

## Checkpoint procedure

1. Verify `CleanUp` head and PR before moving a ref.
2. Preserve unrelated user asset work; connector commits touch only explicit paths.
3. Make one cohesive ownership change and update focused tests + exact debt map in the same checkpoint.
4. Prefer deleting proven shadowed presentation over externalizing dead markup.
5. Static application markup belongs in `/views`; repeated controls use templates/fragments and bounded replacement.
6. Domain services own rules and authoritative game-state mutation; UI renders and dispatches.
7. Async view loading must reject stale state/hosts and must never block startup/`DOMContentLoaded` registration.
8. Do not advance until Push Test, PR Test, browser interaction/coverage and Pages are green.
9. On failure, read exact workflow logs before changing code; never weaken the architecture guard to fit a failure.

## Current repository status

Status captured 2026-08-27 while preparing Phase 4D.10.

| Item | Current state |
|---|---|
| Repository | `kevvy555/MineIT` |
| Working branch | `CleanUp` |
| Pull request | Draft PR #39, `CleanUp` → `develop` |
| Last fully green checkpoint | `334e6f17` — corrected Phase 4D.9 survival terminal/help ownership |
| Current checkpoint | Phase 4D.10 — externalize the two measured `adaptive-building-ui.js` templates |
| Package version | `5.11.3` |
| Active phase | Phase 4 — HTML view ownership |
| Verified large-template debt | 7 |
| Expected after current checkpoint | 5 |
| Branch reconciliation | Deferred to Phase 7 |
| Merge readiness | Not ready; Phases 4–7 remain |

## Green checkpoint history

- `a217a509` — active ship cargo/fuel rows externalized; green.
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
- `09414475` — first survival candidate. It externalized terminal modals but Node guard correctly reported total 8 because the dynamic Help resource catalogue was still one genuine large template. Browser was not run. Do not treat this as green.
- `334e6f17` — externalized the remaining Help resource catalogue into `views/survival-resource-catalog.html` with category/row templates and fragments. `survival-ui.js` reached zero measured templates; total 9 → 7. Push `33067085875`, PR `33067089205`, browser startup/presentation interactions and Pages `33067085509` all green.

## Verified debt after Phase 4D.9

| File | Findings |
|---|---:|
| `js/ui/adaptive-building-ui.js` | 2 |
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **7** |

## Current Phase 4D.10 — Adaptive building ownership

The corrected scanner shows two genuine large templates in `js/ui/adaptive-building-ui.js`:

1. the large unified adaptive-building panel shell in `renderAdaptiveBuilding()`;
2. the extraction operating-mode control/button markup in `extractionBuildingData()`.

This controller is active for Housing, Power, Industry and extraction facilities, and its `tile()` / `landTile()` contract is synchronous. Do **not** cascade async changes through downstream map controllers.

### 4D.10 candidate contract

- Add `views/adaptive-building.html` as the semantic shell owner.
- The external shell owns hero structure, alert, Overview/Operations/Upgrade/Requirements sections, actions, Harvest control and nested badge/operating-mode button templates.
- Eagerly preload the view without top-level `await`.
- `adaptiveViewSource(tile)` reads the resolved cache synchronously. If still loading, retry only when `activeAdaptiveTile === tile`; selecting a different tile clears that ownership so stale loads cannot overwrite it.
- Parse the external rendered source to a fragment and use `tilePanel.replaceChildren(fragment)`; `panel.innerHTML` must not return.
- Populate art attributes, badges and operating-mode buttons through DOM APIs / `DocumentFragment` / cloned `<template>` nodes.
- Preserve existing small computed detail/requirement-card helpers for this checkpoint; Phase 5 can further decompose them if useful. The Phase-4 measured large templates must be zero in this controller.
- Preserve all existing upgrade, demolish, operating-mode, accident, status, workforce, power, requirement and toast/log behaviour.
- Route Harvest +/- through existing `ResourceService.adjustHarvestIntensity(tile, deltaPercent)` rather than direct UI assignment to `tile.harvestIntensity`. This preserves the same 25–200% clamp while restoring the domain mutation boundary.
- Bind operating-mode clicks only on `button[data-adaptive-mode]`; the external mode container must not receive an action handler.
- Add `tests/adaptive-building-view-ownership.test.js` to lock external path, nonblocking preload, stale-tile guard, fragment replacement, nested templates, zero measured templates, absence of `panel.innerHTML`, and the domain harvest command.
- Exact architecture debt changes 7 → **5** and `adaptive-building-ui.js` must remain absent thereafter.
- Require full Push/PR/browser/Pages green before the five one-off files are touched.

### Expected debt after Phase 4D.10

| File | Findings |
|---|---:|
| `js/ui/building-details-ui.js` | 1 |
| `js/ui/contract-ui.js` | 1 |
| `js/ui/industry-ui.js` | 1 |
| `js/ui/map-first-ui.js` | 1 |
| `js/ui/resource-development-ui.js` | 1 |
| **Total** | **5** |

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
| 4 — HTML views | In progress | Baseline 50; green: 43 → 39 → 30 → 24 → 19 → 15 → 11 → 9 → 7; current target 5. |
| 5 — Feature controllers | Pending formal pass | Decompose inherited/mixin ownership and remove shadowed wrappers. |
| 6 — CSS cleanup | Pending final pass | Audit canonical ownership, duplicates and obsolete rules. |
| 7 — Final validation | Pending | Reconcile branch + mobile/browser/campaign/save/lifecycle/soak sign-off. |

## Exact next queue after Phase 4D.10 is green

Five one-off measured templates remain. Inspect each for active-vs-shadowed ownership before deciding extraction vs deletion:

1. `js/ui/building-details-ui.js` — 1
2. `js/ui/contract-ui.js` — 1
3. `js/ui/industry-ui.js` — 1
4. `js/ui/map-first-ui.js` — 1
5. `js/ui/resource-development-ui.js` — 1

Phase 4 exits only when genuine large-template debt reaches zero and full Node/browser/Pages gates remain green.

## Phase 5 — feature controllers

Inventory the surviving inherited/mixin chain, map each public method to one feature owner, remove shadowed compatibility renderers/wrappers (including legacy V55/UI-enhancement technology compatibility), and decompose orchestration by ship/star-map/cargo/buildings/technology/trade/colony/corporation while preserving domain/store boundaries.

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
